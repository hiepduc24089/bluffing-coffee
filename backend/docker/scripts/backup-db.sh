#!/usr/bin/env bash
#
# Backup MySQL production, nén gzip, rồi xóa bản cũ hơn KEEP_DAYS ngày.
#
# Cài vào crontab của user `deploy` (chạy 3h sáng hằng ngày):
#   crontab -e
#   0 3 * * * /home/deploy/bluffing-coffee/backend/docker/scripts/backup-db.sh >> /home/deploy/backups/backup.log 2>&1
#
# Biến môi trường tùy chọn:
#   BACKUP_DIR    thư mục chứa backup            (mặc định ~/backups)
#   KEEP_DAYS     số ngày giữ lại                (mặc định 14)
#   BACKUP_REMOTE đích rsync để đẩy ra khỏi VM   (ví dụ u123456@u123456.your-storagebox.de:backups/)
#
# CẢNH BÁO: backup nằm cùng VM thì mất VM là mất luôn. Hãy đặt BACKUP_REMOTE,
# hoặc ít nhất bật Hetzner Backup/Snapshot cho server.

set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-${HOME}/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"

cd "$BACKEND_DIR"

compose=(docker compose -f docker-compose.prod.yml --env-file .env.production)
if [ -f .env.deploy ]; then
    compose+=(--env-file .env.deploy)
fi

mkdir -p "$BACKUP_DIR"

stamp="$(date +%F-%H%M)"
dest="${BACKUP_DIR}/bc-${stamp}.sql.gz"
tmp="${BACKUP_DIR}/.bc-${stamp}.sql.gz.partial"

cleanup() {
    rm -f "$tmp"
}
trap cleanup EXIT

echo "[$(date +'%F %T')] Bắt đầu backup -> ${dest}"

# Mật khẩu và tên DB lấy từ env sẵn có TRONG container mysql, không phải parse
# .env.production ở ngoài. `set -o pipefail` (đã bật) khiến mysqldump lỗi là cả
# pipeline lỗi, tránh sinh ra file .gz rỗng trông như backup thành công.
"${compose[@]}" exec -T mysql sh -c '
    exec mysqldump \
        -uroot -p"$MYSQL_ROOT_PASSWORD" \
        --single-transaction \
        --quick \
        --routines \
        --events \
        --no-tablespaces \
        "$MYSQL_DATABASE"
' | gzip > "$tmp"

# gzip của một dump rỗng vẫn ~20 byte, nên chặn ngưỡng thấp là đủ để bắt lỗi.
size="$(stat -c %s "$tmp")"
if [ "$size" -lt 1024 ]; then
    echo "Backup chỉ có ${size} byte — coi như thất bại." >&2
    exit 1
fi

mv "$tmp" "$dest"
trap - EXIT

echo "[$(date +'%F %T')] Xong: ${dest} ($(du -h "$dest" | cut -f1))"

deleted="$(find "$BACKUP_DIR" -maxdepth 1 -name 'bc-*.sql.gz' -type f -mtime +"$KEEP_DAYS" -print -delete | wc -l)"
if [ "$deleted" -gt 0 ]; then
    echo "Đã xóa ${deleted} backup cũ hơn ${KEEP_DAYS} ngày."
fi

if [ -n "${BACKUP_REMOTE:-}" ]; then
    echo "Đồng bộ ra ${BACKUP_REMOTE}"
    rsync -az --delete "${BACKUP_DIR}/" "${BACKUP_REMOTE}"
fi
