# Deploy Bluffing Coffee

## Kiến trúc

```
                   ┌────────────────────────────────┐
   Người dùng ───► │  Vercel (frontend, static)     │
                   │  bluffing-coffee.vercel.app    │
                   └──────────────┬─────────────────┘
                                  │ XHR + Bearer token
                                  ▼
                   ┌────────────────────────────────────────┐
                   │  Hetzner Cloud VPS (2 vCPU · 4GB RAM)  │
                   │  bluffing-api.duckdns.org              │
                   │                                        │
                   │  ┌──────────────────────────────────┐  │
                   │  │ app  — FrankenPHP (Caddy + PHP)  │  │
                   │  │        :80 / :443, tự cấp SSL    │  │
                   │  └───────────┬──────────┬───────────┘  │
                   │              ▼          ▼              │
                   │        ┌─────────┐  ┌─────────┐        │
                   │        │  mysql  │  │  redis  │        │
                   │        └─────────┘  └─────────┘        │
                   └────────────────────────────────────────┘
```

Frontend và backend nằm khác domain, nhưng auth dùng Bearer token (Sanctum
personal access token) chứ không dùng cookie, nên không vướng SameSite. Chỉ cần
`FRONTEND_URL` ở backend khớp origin của Vercel để CORS pass.

**Backend bắt buộc phải có HTTPS.** Vercel serve qua HTTPS, nếu API chạy HTTP
thuần thì trình duyệt chặn toàn bộ request vì mixed content.

### File liên quan

| File | Vai trò |
|---|---|
| `backend/Dockerfile.prod` | Image production, bake source + vendor vào trong |
| `backend/docker-compose.prod.yml` | Stack production: app + mysql + redis |
| `backend/docker/frankenphp/Caddyfile` | Cấu hình web server + auto HTTPS |
| `backend/docker/php/php.prod.ini` | PHP/opcache cho production |
| `backend/docker/php/entrypoint.prod.sh` | Chờ DB, warm cache, tạo storage link |
| `backend/.env.production.example` | Mẫu env production |
| `frontend/vercel.json` | SPA rewrite + cache header cho Vercel |
| `.github/workflows/ci.yml` | Test backend + build frontend |
| `.github/workflows/deploy-backend.yml` | Deploy backend qua SSH khi push `main` |

`backend/Dockerfile` và `backend/docker-compose.yml` (nginx + php-fpm) giữ
nguyên cho local dev, không bị ảnh hưởng.

---

## 1. Tạo server trên Hetzner Cloud

Đăng ký tại [console.hetzner.cloud](https://console.hetzner.cloud). Cần thẻ tín
dụng hoặc PayPal. Tài khoản mới đôi khi bị giữ lại xác minh danh tính vài giờ —
nên tạo tài khoản sớm để khỏi phải chờ đúng lúc cần dùng.

**New Project** → đặt tên `bluffing-coffee` → **Add Server**:

- **Location**:
  - `Singapore` — cách VN ~40ms, nên chọn cái này. Đổi lại có phụ phí khoảng
    20–40% so với châu Âu và hạn mức traffic thấp hơn (vượt tính €7.40/TB).
  - `Falkenstein` / `Nuremberg` (Đức) — rẻ nhất nhưng ~250ms từ VN.
- **Image**: Ubuntu 24.04
- **Type**: dòng **shared vCPU**, cấu hình **2 vCPU / 4GB RAM**. Ở châu Âu là
  `CX22`/`CX23`; ở Singapore phải dùng dòng `CPX` vì `CX` chỉ có ở EU.
- **Networking**: bật **IPv4**. Có phụ phí ~€0.50/tháng, nhưng bỏ IPv4 thì khá
  nhiều mạng ở VN không vào được.
- **SSH key**: dán public key của bạn, đừng dùng mật khẩu
- **Firewall**: tạo mới, cấu hình ở bước 2
- **Name**: `bluffing-prod`

Giá tham khảo: ~€6/tháng ở Đức, ~€7.5/tháng ở Singapore (đã gồm IPv4). Hetzner
đã điều chỉnh giá hai lần trong năm 2026, nên hãy đọc con số thật trong console
trước khi bấm tạo.

4GB RAM là dư dả cho stack này: không phải tinh chỉnh MySQL, không cần swap, và
build image ngay trên server cũng thoải mái.

Ghi lại **địa chỉ IPv4** của server.

## 2. Mở firewall

Hetzner chỉ có **một tầng** firewall — ở mức network, nằm ngoài server — và
image Ubuntu của họ không bật `ufw`, nên chỉ phải cấu hình một chỗ.

Console → **Firewalls** → tạo firewall, thêm các inbound rule sau rồi gán
(**Apply to**) cho server `bluffing-prod`:

| Protocol | Port | Source |
|---|---|---|
| TCP | 22 | `0.0.0.0/0`, `::/0` |
| TCP | 80 | `0.0.0.0/0`, `::/0` |
| TCP | 443 | `0.0.0.0/0`, `::/0` |
| UDP | 443 | `0.0.0.0/0`, `::/0` |

UDP 443 dành cho HTTP/3, bỏ qua cũng được, chỉ mất HTTP/3.

Firewall Hetzner mặc định **chặn toàn bộ inbound** ngay khi được gán, nên quên
mở port 22 là tự khoá mình ở ngoài. Nếu lỡ tay, vẫn vào được bằng **Console**
(VNC trên web) để gỡ.

## 3. Cài Docker và tạo user deploy

Hetzner cho đăng nhập bằng `root`. Cài Docker trước:

```bash
ssh root@<IPv4>

apt-get update
apt-get install -y ca-certificates curl git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
```

Rồi tạo user riêng cho CI/CD — đừng để GitHub Actions SSH vào bằng `root`:

```bash
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy

mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

User `deploy` thuộc group `docker` nên chạy được `docker compose` mà không cần
`sudo`, đúng thứ workflow deploy cần. Nó cũng **không** có quyền sudo, nên deploy
key bị lộ cũng không leo lên được root.

Thoát ra, SSH lại bằng `deploy@<IPv4>` rồi kiểm tra `docker compose version`.

## 4. Domain miễn phí bằng DuckDNS

Frontend dùng luôn domain Vercel cấp (`<app>.vercel.app`), không phải làm gì.
Backend cần một hostname có HTTPS, dùng DuckDNS là đủ và miễn phí.

### IP của Hetzner đã cố định sẵn

IPv4 gắn vào server Hetzner không đổi khi stop/start, nên không phải làm gì để
giữ IP. Cron ở dưới chỉ là phòng hờ cho trường hợp sau này bạn dựng server mới.

### Tạo subdomain

1. Vào [duckdns.org](https://www.duckdns.org), đăng nhập bằng GitHub/Google
2. Tạo subdomain, ví dụ `bluffing-api` → được `bluffing-api.duckdns.org`
3. Điền Public IP của VM vào ô `current ip` rồi bấm **update ip**
4. Copy **token** hiển thị ở đầu trang

### Cron tự cập nhật IP (phòng hờ)

Trên VM:

```bash
mkdir -p ~/duckdns
cat > ~/duckdns/update.sh <<'EOF'
#!/bin/bash
curl -fsS "https://www.duckdns.org/update?domains=bluffing-api&token=<TOKEN>&ip=" \
  -o ~/duckdns/duck.log
EOF
chmod 700 ~/duckdns/update.sh

crontab -e
# */5 * * * * /home/deploy/duckdns/update.sh >/dev/null 2>&1
```

Để trống `ip=` thì DuckDNS lấy IP của bên gọi request.

### Kiểm tra trước khi khởi động container

```bash
dig bluffing-api.duckdns.org +short   # phải ra đúng Public IP của VM
```

Bước này **bắt buộc làm trước** khi chạy container lần đầu: Caddy cần domain
resolve đúng và port 80 mở thì mới xin được chứng chỉ Let's Encrypt. Let's
Encrypt có giới hạn số lần thử thất bại, nên đừng restart liên tục khi DNS
chưa sẵn sàng.

Muốn test nhanh bằng HTTP trước thì đặt `SERVER_NAME=:80`, nhưng lúc đó frontend
trên Vercel chưa gọi được API vì bị chặn mixed content.

> Sau này muốn dùng domain thật (`api.bluffingcoffee.com`), chỉ cần trỏ A record
> về cùng IP rồi đổi `SERVER_NAME` + `APP_URL` trong `.env.production` và
> `VITE_API_URL` trên Vercel. Caddy tự xin cert mới.

## 5. Deploy backend lần đầu

```bash
cd ~
git clone https://github.com/hiepduc24089/bluffing-coffee.git
cd bluffing-coffee/backend

cp .env.production.example .env.production
chmod 600 .env.production
```

Sinh secret:

```bash
# APP_KEY
docker run --rm dunglas/frankenphp:1-php8.3-alpine \
  php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"

# DB_PASSWORD / MYSQL_ROOT_PASSWORD / REDIS_PASSWORD
openssl rand -base64 24
```

Điền vào `.env.production`, đặc biệt là `APP_KEY`, `SERVER_NAME`, `APP_URL`,
`FRONTEND_URL`, và ba password ở trên.

Khởi động:

```bash
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.production"

$COMPOSE build app

# Migrate trong container tạm trước, để schema xong xuôi rồi mới cho app
# nhận traffic. Đây cũng là thứ tự mà workflow deploy dùng.
$COMPOSE up -d mysql redis
$COMPOSE run --rm app php artisan migrate --force

$COMPOSE up -d
```

### Seed dữ liệu khởi tạo

> ⚠️ **Không chạy `php artisan db:seed --force`** trên image production. Lệnh đó
> sẽ lỗi `Call to undefined function Database\Factories\fake()`, vì image build
> bằng `composer install --no-dev` nên không có `fakerphp/faker`, trong khi
> `AdminSeeder` và `MemberSeeder` dùng model factory. Ngoài ra `MemberSeeder`
> chỉ sinh dữ liệu giả, không nên chạy trên production.

Seed ba seeder dữ liệu tham chiếu (không dùng factory nên chạy được bình thường):

```bash
$COMPOSE exec -T app php artisan db:seed --class=RewardProfileSeeder --force
$COMPOSE exec -T app php artisan db:seed --class=GameFormatSeeder --force
$COMPOSE exec -T app php artisan db:seed --class=BadgeSeeder --force
```

Tạo tài khoản admin trực tiếp, đặt mật khẩu mạnh ngay từ đầu (model `Admin` có
cast `password => hashed` nên truyền chuỗi thô, không cần `bcrypt()`):

```bash
$COMPOSE exec -T app php artisan tinker --execute='
  App\Models\Admin::updateOrCreate(
    ["email" => "admin@bluffing.coffee"],
    ["name" => "Admin", "password" => "<mật-khẩu-mạnh>"]
  );'
```

Kiểm tra đăng nhập được:

```bash
curl -s -X POST https://bluffing-api.duckdns.org/api/admin/auth/login \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"email":"admin@bluffing.coffee","password":"<mật-khẩu-mạnh>"}'
```

Kiểm tra:

```bash
curl -I https://bluffing-api.duckdns.org/up
$COMPOSE logs -f app
```

## 6. Deploy frontend lên Vercel

Trên [vercel.com](https://vercel.com) → **Add New Project** → import repo GitHub.

| Cấu hình | Giá trị |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Vite (tự nhận) |
| Build/Output | đã khai trong `frontend/vercel.json`, không cần sửa |

Environment Variables → thêm cho cả Production và Preview:

```
VITE_API_URL = https://bluffing-api.duckdns.org/api
```

Vite nhúng biến `VITE_*` vào bundle **lúc build**, nên mỗi lần đổi giá trị này
phải redeploy mới ăn.

Sau khi có domain Vercel, cập nhật `FRONTEND_URL` trong `.env.production` trên
VM rồi chạy lại `$COMPOSE up -d` để CORS nhận origin mới.

CI/CD của frontend do Vercel Git integration lo: push lên `main` → deploy
production, mở PR → deploy preview. Không cần workflow riêng.

> **Preview deploy và CORS**: mỗi PR được Vercel cấp một URL ngẫu nhiên dạng
> `bluffing-coffee-git-<branch>-<user>.vercel.app`, không khớp `FRONTEND_URL` nên
> sẽ bị chặn CORS khi gọi API. Nếu cần preview gọi được backend, thêm pattern vào
> `allowed_origins_patterns` trong `backend/config/cors.php`:
>
> ```php
> 'allowed_origins_patterns' => [
>     '#^https://bluffing-coffee-git-[\w-]+\.vercel\.app$#',
> ],
> ```
>
> Không cần preview gọi API thì cứ để nguyên — production vẫn chạy bình thường.

## 7. Bật CI/CD cho backend

### Tạo SSH key riêng cho GitHub Actions

Trên máy local (đừng dùng lại key cá nhân):

```bash
ssh-keygen -t ed25519 -C "github-actions-bluffing-coffee" -f ~/.ssh/bc_deploy -N ""
```

Đưa public key lên VM:

```bash
ssh-copy-id -i ~/.ssh/bc_deploy.pub deploy@<IPv4>
```

### Khai secrets

GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Giá trị ví dụ |
|---|---|
| `DEPLOY_HOST` | `<IPv4>` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_SSH_KEY` | Toàn bộ nội dung `~/.ssh/bc_deploy` (kể cả dòng `-----BEGIN...`/`-----END...`) |
| `DEPLOY_PATH` | `/home/deploy/bluffing-coffee` |
| `DEPLOY_HEALTH_URL` | `https://bluffing-api.duckdns.org/up` |
| `DEPLOY_PORT` | *(tùy chọn, mặc định 22)* |

### Luồng hoạt động

- Mở PR vào `main` → `ci.yml` chạy test backend (PHPUnit + MySQL) và build frontend
- Merge vào `main`:
  - có thay đổi trong `backend/**` → `deploy-backend.yml` SSH vào VM, `git reset --hard`, build image, `up -d`, `migrate --force`, rồi gọi health check
  - frontend → Vercel tự deploy

Nên bật **branch protection** cho `main` (Settings → Branches) với yêu cầu
"Require status checks to pass" chọn `Backend tests` + `Frontend build`, để code
lỗi không lọt thẳng lên server.

> **Về tên branch**: repo hiện chỉ có `main`, không có `master`, nên các workflow
> đang trigger theo `main`. Nếu bạn muốn dùng `master`, sửa `branches: [main]`
> thành `branches: [master]` trong cả hai file workflow.

Muốn deploy phải bấm duyệt tay thì tạo Environment tên `production`
(Settings → Environments) và thêm required reviewer — workflow đã khai
`environment: production` sẵn.

---

## Vận hành

**Xem log**

```bash
cd ~/bluffing-coffee/backend
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.production"

$COMPOSE logs -f app
$COMPOSE exec -T app tail -f storage/logs/laravel.log
```

**Backup database**

```bash
$COMPOSE exec -T mysql sh -c \
  'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction bluffing_coffee' \
  | gzip > ~/backups/bc-$(date +%F).sql.gz
```

Đặt vào crontab cho chạy hằng ngày:

```bash
mkdir -p ~/backups
crontab -e
# 0 3 * * * cd /home/deploy/bluffing-coffee/backend && docker compose -f docker-compose.prod.yml --env-file .env.production exec -T mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction bluffing_coffee' | gzip > /home/deploy/backups/bc-$(date +\%F).sql.gz
```

Backup nằm cùng VM thì mất VM là mất luôn — nên sync định kỳ ra chỗ khác
(Hetzner Storage Box, S3, hoặc `rsync` về máy bạn).

**Rollback** về commit trước:

```bash
cd ~/bluffing-coffee
git log --oneline -10
git checkout <commit-sha>
cd backend && $COMPOSE build app && $COMPOSE up -d
```

Migration không tự rollback theo. Nếu bản lỗi đã chạy migration phá cấu trúc thì
phải `migrate:rollback` hoặc restore từ backup.

**Restart / cập nhật env**

```bash
$COMPOSE up -d          # sau khi sửa .env.production
$COMPOSE restart app
```

`config:cache` chạy trong entrypoint nên đổi env **bắt buộc** phải restart
container mới có tác dụng.

---

## Ghi chú

- **Volume dữ liệu**: `mysql_data`, `app_storage` (file upload), `caddy_data`
  (chứng chỉ SSL) là named volume. `docker compose down -v` sẽ xóa sạch — đừng
  bao giờ chạy lệnh đó trên production.
- **MySQL và Redis không mở port ra ngoài**, chỉ truy cập được trong network của
  compose. Muốn nối DB từ máy local thì dùng SSH tunnel.
- **`route:cache` không chạy được** vì `routes/web.php` còn closure route
  (`Route::get('/')`). Chuyển route đó sang controller thì bật lại được trong
  `entrypoint.prod.sh`.
- **Vercel Hobby** theo điều khoản chỉ dành cho mục đích phi thương mại. Khi vận
  hành thật cho quán thì cần lên gói Pro.
- Free tier của các nhà cung cấp thay đổi thường xuyên — nên kiểm tra lại trang
  pricing trước khi phụ thuộc vào một dịch vụ nào đó lâu dài.
