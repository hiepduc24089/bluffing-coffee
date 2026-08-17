#!/usr/bin/env bash
#
# Gọi Laravel scheduler trong container app. Cron chạy file này mỗi phút, còn
# Laravel tự quyết lệnh nào tới hạn — xem `backend/routes/console.php`.
#
# Cài vào crontab của user `deploy` (mỗi phút, không thưa hơn được):
#   crontab -e
#   * * * * * /home/deploy/bluffing-coffee/backend/docker/scripts/run-scheduler.sh >> /home/deploy/scheduler.log 2>&1
#
# Đổi đường dẫn cho khớp DEPLOY_PATH thật của bạn. Script tự suy ra thư mục
# backend từ vị trí của chính nó, nên không có đường dẫn nào bị đóng cứng bên
# trong.
#
# Vì sao cần script thay vì nhét thẳng lệnh docker vào crontab: ba cái bẫy dưới
# đây đều làm cron hỏng ÂM THẦM, mà crontab một dòng thì không chỗ nào xử lý.

set -euo pipefail

# Bẫy 1: cron chạy với PATH tối thiểu (`/usr/bin:/bin`). Docker cài qua script
# chính chủ nằm ở /usr/bin nên thường may mắn chạy được, nhưng bản cài bằng tay
# hoặc snap thì không — và triệu chứng chỉ là "cron không chạy", không manh mối.
PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${PATH:-}"

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$BACKEND_DIR"

# Bẫy 2: `.env.deploy` do CI/CD sinh ra ở lần deploy đầu tiên. Truyền
# `--env-file` trỏ vào file chưa tồn tại là docker compose lỗi ngay, nên trước
# lần deploy đầu thì cron sẽ chết mỗi phút. Thiếu file thì bỏ qua — compose đã
# có sẵn giá trị mặc định cho ${APP_IMAGE}.
compose=(docker compose -f docker-compose.prod.yml --env-file .env.production)
if [ -f .env.deploy ]; then
    compose+=(--env-file .env.deploy)
fi

# Bẫy 3: một lượt treo (POS365 không trả lời, docker exec đơ) mà cron vẫn nổ mỗi
# phút thì tiến trình chồng lên nhau. `withoutOverlapping()` của Laravel chỉ
# chặn được ở tầng trong container, không chặn được cái vỏ docker exec ở ngoài.
if command -v flock >/dev/null 2>&1; then
    exec 9<"${BASH_SOURCE[0]}"
    if ! flock -n 9; then
        echo "[$(date +'%F %T')] Lượt trước còn đang chạy — bỏ qua lượt này."
        exit 0
    fi
fi

# Deploy vừa thay image thì container xuống vài giây. Bỏ qua chứ không báo lỗi:
# con trỏ đồng bộ chỉ nhích lên sau khi cả lô xử lý xong, nên lượt sau kéo lại
# từ đúng chỗ cũ. Kiểm bằng docker inspect thay vì cờ `--status` của compose để
# không phụ thuộc phiên bản compose trên máy.
cid="$("${compose[@]}" ps -q app 2>/dev/null || true)"

if [ -z "$cid" ] || [ "$(docker inspect -f '{{.State.Running}}' "$cid" 2>/dev/null)" != "true" ]; then
    echo "[$(date +'%F %T')] Container app chưa chạy — bỏ qua lượt này."
    exit 0
fi

# Bỏ stdout: từ khi `pos365:sync-partners` chạy mỗi phút thì lượt nào cũng in ra
# tên lệnh, giữ lại chỉ để đầy log. Stderr vẫn chảy ra ngoài cho crontab ghi
# lại — đó là chỗ lỗi thật hiện ra.
exec "${compose[@]}" exec -T app php artisan schedule:run >/dev/null
