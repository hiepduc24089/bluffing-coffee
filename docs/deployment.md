# Deploy Bluffing Coffee

## Kiến trúc

Toàn bộ dự án chạy trên **một VPS Việt Nam duy nhất**. Caddy (nằm trong
FrankenPHP) vừa serve SPA vừa proxy API, nên frontend và backend dùng chung một
domain:

```
                   ┌──────────────────────────────────────────────┐
                   │  VPS Việt Nam (2 vCPU · 4GB RAM · Ubuntu)    │
   Người dùng ───► │  bluffing.duckdns.org                        │
                   │                                              │
                   │  ┌────────────────────────────────────────┐  │
                   │  │ app — FrankenPHP (Caddy + PHP)         │  │
                   │  │      :80 / :443, tự cấp chứng chỉ TLS  │  │
                   │  │                                        │  │
                   │  │   /api/*  ─┐                           │  │
                   │  │   /up      ├─► Laravel  (/app/public)  │  │
                   │  │   /storage/*┘                          │  │
                   │  │                                        │  │
                   │  │   còn lại ───► SPA      (/srv/frontend)│  │
                   │  └───────────┬──────────────┬─────────────┘  │
                   │              ▼              ▼                │
                   │        ┌─────────┐    ┌─────────┐            │
                   │        │  mysql  │    │  redis  │            │
                   │        └─────────┘    └─────────┘            │
                   └──────────────────────────────────────────────┘
```

Hệ quả của việc cùng origin:

- **Không có CORS.** Trình duyệt không gửi preflight vì không có request
  cross-origin nào. `backend/config/cors.php` chỉ còn phục vụ local dev.
- **Không có mixed content.** Cả SPA lẫn API đều nằm sau cùng một chứng chỉ.
- **`VITE_API_URL` là đường dẫn tương đối `/api`**, đã bake sẵn vào bundle lúc
  build image. Không cần khai biến này ở đâu trên production.

Auth dùng Bearer token (Sanctum personal access token) chứ không dùng cookie,
nên cũng không vướng SameSite.

### File liên quan

| File | Vai trò |
|---|---|
| `backend/Dockerfile.prod` | Image production: build frontend rồi gộp cùng backend vào một image |
| `.dockerignore` | Lọc build context (context là **gốc repo**, không phải `backend/`) |
| `backend/docker-compose.prod.yml` | Stack production: app + mysql + redis |
| `backend/docker/frankenphp/Caddyfile` | Routing SPA/API + auto HTTPS |
| `backend/docker/php/php.prod.ini` | PHP/opcache cho production |
| `backend/docker/php/entrypoint.prod.sh` | Chờ DB, warm cache, tạo storage link |
| `backend/docker/scripts/backup-db.sh` | Backup MySQL + xóa bản cũ, dùng cho cron |
| `backend/.env.production.example` | Mẫu env production |
| `backend/.env.deploy` | *(chỉ có trên server)* một dòng `APP_IMAGE=` — tag image đang chạy |
| `.github/workflows/ci.yml` | Test backend + build frontend (reusable) |
| `.github/workflows/deploy.yml` | Test → build image lên GHCR → server pull |

### Image được build ở đâu

CI build image trên GitHub Actions rồi đẩy lên **GHCR** với tag là commit SHA;
server chỉ `docker pull` + `up -d`. Hai lý do:

- VPS 2 vCPU/4GB đang phục vụ traffic — build ngay trên đó làm chậm site
- Rollback chỉ là đổi một dòng trong `.env.deploy` rồi `up -d` (vài giây), thay
  vì checkout commit cũ và build lại (vài phút, trong lúc site đang chết)

`backend/Dockerfile` và `backend/docker-compose.yml` (nginx + php-fpm) giữ
nguyên cho local dev, không bị ảnh hưởng.

> Guide này viết cho VPS Việt Nam, nhưng không phụ thuộc nhà cung cấp nào — mọi
> bước đều chạy được trên bất kỳ VPS Ubuntu 24.04 nào có IPv4 public.

---

## 1. Thuê VPS Việt Nam

### Cấu hình nên chọn

| Thành phần | Mức đề xuất | Ghi chú |
|---|---|---|
| vCPU | 2 | Stack này không nghẽn CPU ở quy mô một quán. vCPU thứ 3 gần như không giúp gì |
| RAM | 4 GB | Xem bảng phân bổ bên dưới. 2GB chạy được nhưng không build image trên server được |
| Disk | 30–40 GB NVMe | Image Docker + volume MySQL + backup. 20GB sẽ chật sau vài tháng |
| OS | Ubuntu 24.04 LTS | Guide này dùng Ubuntu; distro khác phải tự đổi lệnh `apt` |
| Datacenter | Hà Nội hoặc TP.HCM | Chọn nơi gần khách hàng nhất |
| IPv4 | Bắt buộc | VN hầu như luôn kèm sẵn, không tính phí riêng như VPS nước ngoài |

**Giá tham khảo: ~158.000đ/tháng** (trả trước 12 tháng ≈ 1.896.000đ) cho gói
2 vCPU / 4GB / 30GB NVMe / 200 Mbps. Trả theo năm thường rẻ hơn 15–20% so với
trả tháng.

Một số nhà cung cấp phổ biến: AZDIGI, Vietnix, TinoHost, iNET, CloudFly,
BizFly Cloud, Viettel IDC, VNPT Cloud. Giá và khuyến mãi thay đổi liên tục nên
hãy đọc bảng giá thật trước khi chốt.

### RAM đi đâu

| Thành phần | Mặc định | Sau khi tune |
|---|---|---|
| Ubuntu 24.04 + Docker daemon | ~350 MB | ~350 MB |
| MySQL 8.4 | ~450 MB | ~250 MB |
| Redis | ~30 MB | ~30 MB |
| FrankenPHP + Laravel (opcache 128MB) | ~250 MB | ~250 MB |
| **Tổng lúc chạy** | **~1,1 GB** | **~880 MB** |

Con số quyết định nằm ở chỗ khác: bước bootstrap ở §5 chạy `yarn build` ngay
trên server, riêng nó ngốn **~2 GB**. Đó là lý do mốc 4GB — máy 2GB sẽ OOM ở
bước đó và phải hoặc bật swap, hoặc bỏ hẳn việc build trên server (để CI build
rồi chạy workflow deploy bằng tay).

Với 4GB thì không cần tune gì cả. Chỉ khi nào `free -h` báo available thường
xuyên dưới 300MB mới cần hạ `innodb_buffer_pool_size` hoặc nâng gói.

### Vài điều cần hỏi trước khi mua

- **Nâng gói giữa chừng tính thế nào?** Câu quan trọng nhất khi trả trước 12
  tháng — mua gói nhỏ chỉ hợp lý nếu nâng cấp được và phần chưa dùng được cấn
  trừ. Hỏi luôn: nâng RAM/CPU có phải migrate sang node khác không (nếu có thì
  **IP có thể đổi**, phải cập nhật DuckDNS và secret `DEPLOY_HOST`).
- **Có hoàn tiền trong bao nhiêu ngày?** Đang cam kết một năm với nhà cung cấp
  chưa dùng thử, nên cửa sổ hoàn tiền là lưới an toàn. Chạy các lệnh test ở cuối
  mục này ngay tuần đầu.
- **Băng thông 200 Mbps là quốc tế hay chỉ trong nước?** Nhiều nơi niêm yết tốc
  độ cổng nhưng bóp riêng quốc tế. Ảnh hưởng trực tiếp: mỗi lần deploy server
  phải `docker pull` ~400MB từ GHCR. Ở 200 Mbps mất ~16 giây, ở 10 Mbps mất
  **~5,5 phút** — sát với `command_timeout: 15m` trong `deploy.yml`.
- **vCPU là dedicated hay shared?** Nhiều gói giá rẻ share CPU rất nặng, lúc cao
  điểm chậm thấy rõ. Câu trả lời né tránh là dấu hiệu xấu.
- **Backup của nhà cung cấp giữ bao nhiêu ngày, restore mất bao lâu?** Có sẵn
  thì tốt, nhưng **không thay thế** `backup-db.sh` — xem phần Vận hành để biết
  vì sao cần cả hai.
- **Có chặn port nào không.** Một số nơi chặn port 25 (gửi mail). Dự án đang để
  `MAIL_MAILER=log` nên chưa ảnh hưởng, nhưng sau này gửi mail thật thì phải
  dùng SMTP relay bên ngoài.

**Đừng mua gói 24–36 tháng** dù chiết khấu hấp dẫn. Trả 12 tháng, vì nhiều khả
năng bạn sẽ muốn nâng gói trong năm tới.

Sau khi tạo xong, ghi lại **địa chỉ IPv4** và mật khẩu `root` mà nhà cung cấp
gửi qua email.

### Kiểm tra ngay trong tuần đầu

Làm trong lúc còn cửa sổ hoàn tiền, đừng đợi đến khi deploy xong mới phát hiện:

```bash
# Băng thông quốc tế thực tế — con số quan trọng nhất, không phải con số quảng cáo
time curl -o /dev/null https://speed.cloudflare.com/__down?bytes=104857600

# Disk I/O (MySQL sống chết vì cái này)
apt-get install -y fio
fio --name=w --rw=randwrite --bs=4k --size=1G --numjobs=4 --runtime=30 \
    --group_reporting --direct=1

# Latency từ mạng của quán về VPS
ping -c 20 <IPv4>
```

## 2. Mở firewall bằng `ufw`

Khác Hetzner, VPS Việt Nam thường **không có firewall ở tầng network**, nên phải
tự cấu hình `ufw` ngay trên máy.

```bash
ssh root@<IPv4>

apt-get update && apt-get install -y ufw

ufw default deny incoming
ufw default allow outgoing

ufw allow 22/tcp      # SSH — mở TRƯỚC khi enable, không thì tự khoá mình ở ngoài
ufw allow 80/tcp      # HTTP (Let's Encrypt cần để xác thực domain)
ufw allow 443/tcp     # HTTPS
ufw allow 443/udp     # HTTP/3, bỏ qua cũng được

ufw enable
ufw status verbose
```

Lỡ tay chặn mất port 22 thì vào bằng **Console/VNC** trên trang quản trị của nhà
cung cấp để gỡ.

> ⚠️ **`ufw` KHÔNG chặn được port mà Docker publish.** Docker tự ghi rule vào
> chuỗi `DOCKER` của iptables, nằm trước rule của `ufw`. Nghĩa là bất kỳ dòng
> `ports:` nào trong compose đều mở thẳng ra Internet bất chấp `ufw`.
>
> Stack này an toàn vì chỉ publish 80/443 — đúng thứ cần mở. Nhưng **đừng bao
> giờ thêm `ports: ["3306:3306"]` cho MySQL** với suy nghĩ "`ufw` chặn rồi": làm
> vậy là phơi database ra Internet. Muốn nối DB từ máy local thì dùng SSH tunnel
> (xem phần Ghi chú).

## 3. Cài Docker và tạo user deploy

```bash
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
cp /root/.ssh/authorized_keys /home/deploy/.ssh/   # nếu đã dùng SSH key
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Nếu nhà cung cấp chỉ đưa mật khẩu `root` chứ chưa có SSH key, thì từ **máy
local** đẩy key lên trước:

```bash
ssh-copy-id root@<IPv4>
```

Rồi tắt đăng nhập bằng mật khẩu cho an toàn — VPS có IPv4 public bị dò mật khẩu
SSH liên tục:

```bash
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# Image cloud của Ubuntu 24.04 có sẵn /etc/ssh/sshd_config.d/50-cloud-init.conf
# đặt `PasswordAuthentication yes`. File trong sshd_config.d/ được Include ở đầu
# nên nó THẮNG — chỉ sửa sshd_config là mật khẩu vẫn bật mà không có dấu hiệu gì.
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' \
  /etc/ssh/sshd_config /etc/ssh/sshd_config.d/*.conf

sshd -t && systemctl restart ssh   # `sshd -t` chặn restart khi cú pháp sai

# Đọc cấu hình sshd đang thực thi, không phải nội dung file:
sshd -T | grep -i '^passwordauthentication'   # phải ra "no"
```

Kiểm tra từ máy local rằng mật khẩu thật sự đã bị chặn:

```bash
ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no root@<IPv4>
# mong đợi: Permission denied (publickey).
```

> Kiểm tra chắc chắn đã SSH được bằng key ở một cửa sổ terminal khác **trước
> khi** tắt mật khẩu.

User `deploy` thuộc group `docker` nên chạy được `docker compose` mà không cần
`sudo`, đúng thứ workflow deploy cần. Nó cũng **không** có quyền sudo, nên deploy
key bị lộ cũng không leo lên được root.

Thoát ra, SSH lại bằng `deploy@<IPv4>` rồi kiểm tra `docker compose version`.

## 4. Domain miễn phí bằng DuckDNS

Cả site chỉ cần **một** hostname, vì frontend và API dùng chung domain.

### IP của VPS đã cố định sẵn

IPv4 gắn vào VPS không đổi khi reboot, nên không phải làm gì để giữ IP. Cron ở
dưới chỉ là phòng hờ cho trường hợp sau này bạn đổi sang server khác.

### Tạo subdomain

1. Vào [duckdns.org](https://www.duckdns.org), đăng nhập bằng GitHub/Google
2. Tạo subdomain, ví dụ `bluffing` → được `bluffing.duckdns.org`
3. Điền IPv4 của VPS vào ô `current ip` rồi bấm **update ip**
4. Copy **token** hiển thị ở đầu trang

### Cron tự cập nhật IP (phòng hờ)

Trên VPS, với user `deploy`:

```bash
mkdir -p ~/duckdns
cat > ~/duckdns/update.sh <<'EOF'
#!/bin/bash
curl -fsS "https://www.duckdns.org/update?domains=bluffing&token=<TOKEN>&ip=" \
  -o ~/duckdns/duck.log
EOF
chmod 700 ~/duckdns/update.sh

crontab -e
# */5 * * * * /home/deploy/duckdns/update.sh >/dev/null 2>&1
```

Để trống `ip=` thì DuckDNS lấy IP của bên gọi request.

### Kiểm tra trước khi khởi động container

```bash
dig bluffing.duckdns.org +short   # phải ra đúng IPv4 của VPS
```

Bước này **bắt buộc làm trước** khi chạy container lần đầu: Caddy cần domain
resolve đúng và port 80 mở thì mới xin được chứng chỉ Let's Encrypt. Let's
Encrypt có giới hạn số lần thử thất bại, nên đừng restart liên tục khi DNS
chưa sẵn sàng.

Muốn test nhanh bằng HTTP trước thì đặt `SERVER_NAME=:80` — lúc này site vẫn
chạy đầy đủ qua `http://<IPv4>`, chỉ là không có HTTPS.

> Sau này muốn dùng domain thật (`bluffingcoffee.com`), chỉ cần trỏ A record về
> cùng IP rồi đổi `SERVER_NAME` + `APP_URL` trong `.env.production` và restart.
> Caddy tự xin cert mới. Không phải build lại image, vì `VITE_API_URL` là đường
> dẫn tương đối.

## 5. Deploy lần đầu

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

Điền vào `.env.production`, đặc biệt là `APP_KEY`, `SERVER_NAME`, `APP_URL` và
ba password ở trên. Không cần `FRONTEND_URL` — frontend cùng origin với API.

Khởi động:

```bash
# .env.deploy giữ tag image đang chạy. Lần đầu chưa có image trên GHCR (CI chưa
# chạy lần nào), nên build tay ngay trên server và trỏ vào tag local.
printf 'APP_IMAGE=bluffing-coffee-app:latest\n' > .env.deploy

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.production --env-file .env.deploy"

# Build này lâu (~5–10 phút): stage 1 cài node_modules và chạy `yarn build`,
# stage 2 cài PHP extension và composer install. Từ lần deploy sau CI lo hết.
$COMPOSE build app

# Migrate trong container tạm trước, để schema xong xuôi rồi mới cho app
# nhận traffic. Đây cũng là thứ tự mà workflow deploy dùng.
$COMPOSE up -d mysql redis
$COMPOSE run --rm app php artisan migrate --force

$COMPOSE up -d
```

Từ lần deploy thứ hai trở đi, workflow tự ghi đè `.env.deploy` bằng tag GHCR
tương ứng commit vừa merge — không phải build trên server nữa.

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

### Kiểm tra

```bash
# API sống chưa
curl -I https://bluffing.duckdns.org/up

# SPA có được serve không (phải trả về HTML của index.html, không phải 404)
curl -s https://bluffing.duckdns.org/ | head -5

# Đường dẫn SPA bất kỳ cũng phải ra index.html, không được 404
curl -sI https://bluffing.duckdns.org/admin/login | head -1

# Đăng nhập thử
curl -s -X POST https://bluffing.duckdns.org/api/admin/auth/login \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"email":"admin@bluffing.coffee","password":"<mật-khẩu-mạnh>"}'

$COMPOSE logs -f app
```

## 6. Bật CI/CD

### Tạo SSH key riêng cho GitHub Actions

Trên máy local (đừng dùng lại key cá nhân):

```bash
ssh-keygen -t ed25519 -C "github-actions-bluffing-coffee" -f ~/.ssh/bc_deploy -N ""
```

Đưa public key lên VPS:

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
| `DEPLOY_HEALTH_URL` | `https://bluffing.duckdns.org/up` |
| `DEPLOY_PORT` | *(tùy chọn, mặc định 22)* |

Không cần secret nào cho GHCR: workflow đăng nhập bằng `GITHUB_TOKEN` mà GitHub
tự cấp cho mỗi lần chạy, và token đó hết hiệu lực ngay khi workflow kết thúc.

### Luồng hoạt động

- Mở PR vào `main` → `ci.yml` chạy test backend (PHPUnit + MySQL) và build frontend
- Merge vào `main` → `deploy.yml` chạy bốn job nối tiếp:
  1. **CI** — gọi lại chính `ci.yml`. Test đỏ thì dừng ở đây, không build, không deploy
  2. **Build và push image** — build `Dockerfile.prod` trên runner (cả frontend
     lẫn backend), đẩy lên `ghcr.io/hiepduc24089/bluffing-coffee-app` với hai
     tag: commit SHA và `latest`
  3. **Deploy** — SSH vào VPS: `git reset --hard <sha>`, `docker pull`, ghi
     `.env.deploy`, `up -d mysql redis`, `migrate --force`, `up -d`, rồi health check
  4. **Rollback** — chỉ chạy khi job deploy hỏng: đổi `.env.deploy` về tag trước
     đó rồi `up -d`

`deploy.yml` **không lọc theo path**: image chứa cả frontend nên sửa gì trong
`frontend/` cũng phải build và deploy lại.

Vì `ci.yml` được deploy gọi lại, nó **không** trigger theo `push: main` — nếu
không thì mỗi lần push sẽ chạy test hai lần.

> ⚠️ **Rollback tự động chỉ đổi image, không đụng tới database.** Nếu bản lỗi đã
> chạy migration phá cấu trúc thì phải `migrate:rollback` hoặc restore từ backup
> bằng tay. Hệ quả thực tế: migration phải **tương thích ngược** với code cũ,
> vì migration chạy trước khi container mới lên. Đừng drop/rename cột mà code
> đang chạy còn dùng — tách thành hai lần deploy.

### Quyền đọc package trên GHCR

Package mới tạo trên GHCR mặc định là **private**. Workflow tự lo được (nó
`docker login` bằng `GITHUB_TOKEN`), nhưng nếu bạn muốn `docker pull` bằng tay
trên server thì có hai cách:

- Đổi package sang public: GitHub → tab **Packages** → chọn package →
  *Package settings* → *Change visibility* → Public
- Hoặc giữ private và đăng nhập bằng Personal Access Token có scope
  `read:packages`:
  ```bash
  echo <PAT> | docker login ghcr.io -u <github-username> --password-stdin
  ```

### Branch protection

Nên bật **branch protection** cho `main` (Settings → Branches) với yêu cầu
"Require status checks to pass" chọn `Backend tests` + `Frontend build`, để code
lỗi không lọt thẳng lên server. Job **CI** trong workflow deploy là lớp chặn thứ
hai, phòng trường hợp push thẳng lên `main` không qua PR.

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
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.production --env-file .env.deploy"

# Log web server (Caddy) + stdout của PHP. Giới hạn 3 file × 10MB mỗi service,
# khai trong docker-compose.prod.yml — Docker mặc định không giới hạn.
$COMPOSE logs -f app

# Log ứng dụng Laravel. Channel `daily` nên file có ngày trong tên và tự xóa
# sau LOG_DAILY_DAYS (mặc định 14) ngày.
$COMPOSE exec -T app tail -f "storage/logs/laravel-$(date +%F).log"
```

**Backup database**

Dùng script sẵn có — nó dump, nén, kiểm tra file không rỗng, rồi xóa bản cũ:

```bash
mkdir -p ~/backups
~/bluffing-coffee/backend/docker/scripts/backup-db.sh
```

Đặt vào crontab cho chạy hằng ngày lúc 3h sáng:

```bash
crontab -e
# 0 3 * * * /home/deploy/bluffing-coffee/backend/docker/scripts/backup-db.sh >> /home/deploy/backups/backup.log 2>&1
```

Chỉnh được qua biến môi trường: `BACKUP_DIR` (mặc định `~/backups`), `KEEP_DAYS`
(mặc định 14), `BACKUP_REMOTE` (đích `rsync`, để trống thì bỏ qua).

Backup nằm cùng VPS thì mất VPS là mất luôn. Dump của quán chỉ cỡ vài chục MB
nên đẩy ra ngoài **không tốn phí**, chỉ cần đặt `BACKUP_REMOTE` trong dòng cron:

```bash
# rsync về máy bạn (cần VPS SSH được vào máy đó, hoặc dùng Tailscale)
BACKUP_REMOTE=duc@nha-cua-ban:~/bc-backups/

# hoặc Cloudflare R2 — free 10GB, không tính phí egress.
# R2 dùng giao thức S3 nên thay rsync bằng `rclone sync`, xem `man rclone`.
```

**Backup của nhà cung cấp không thay thế script này.** Gói VPS đang dùng có
backup toàn máy hàng ngày, nhưng hai thứ giải quyết hai bài toán khác nhau:

| | Backup nhà cung cấp | `backup-db.sh` |
|---|---|---|
| Phạm vi | Toàn bộ máy | Chỉ database |
| Cứu được | VPS chết, hỏng disk | Xoá nhầm dữ liệu, migration hỏng |
| Khôi phục | Quay ngược **tất cả** — cả file upload lẫn code | Chỉ nạp lại DB, mọi thứ khác giữ nguyên |
| Nằm ở đâu | Hạ tầng nhà cung cấp | Trên VPS, và ở nơi bạn đặt `BACKUP_REMOTE` |

Tình huống hay gặp nhất không phải VPS chết, mà là "hôm kia lỡ tay xoá mất dữ
liệu, cần lấy lại đúng một bảng". Snapshot toàn máy xử lý việc đó rất tệ.

> Tối thiểu: cứ vài tuần `scp` một bản dump về máy bạn. Việc này tốn 10 giây và
> là thứ duy nhất cứu được dữ liệu khi cả VPS lẫn tài khoản nhà cung cấp có vấn
> đề.

Khôi phục từ file backup:

```bash
gunzip -c ~/backups/bc-2026-08-10-0300.sql.gz | \
  $COMPOSE exec -T mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
```

**Rollback** về bản trước:

Bình thường không phải làm gì — health check hỏng thì workflow tự rollback. Làm
tay khi cần quay lại xa hơn một bản:

```bash
cd ~/bluffing-coffee/backend

# Các tag còn trên máy (deploy dọn image treo cũ hơn 7 ngày)
docker images ghcr.io/hiepduc24089/bluffing-coffee-app

printf 'APP_IMAGE=ghcr.io/hiepduc24089/bluffing-coffee-app:<sha-cũ>\n' > .env.deploy
$COMPOSE up -d
```

Rollback đổi cả frontend lẫn backend cùng lúc, vì hai thứ nằm trong một image —
không có chuyện SPA mới gọi API cũ.

Tag không còn trên máy thì `docker pull` lại từ GHCR trước (cần đăng nhập nếu
package đang để private).

Migration không tự rollback theo. Nếu bản lỗi đã chạy migration phá cấu trúc thì
phải `migrate:rollback` hoặc restore từ backup.

**Restart / cập nhật env**

```bash
$COMPOSE up -d          # sau khi sửa .env.production
$COMPOSE restart app
```

`config:cache` chạy trong entrypoint nên đổi env **bắt buộc** phải restart
container mới có tác dụng.

**Khi nào cần nâng gói VPS**

Đừng đoán, nhìn số:

```bash
free -h                      # available < 300MB thường xuyên -> hết RAM thật
vmstat 1 5                   # cột si/so khác 0 liên tục -> đang swap, chậm rõ
uptime                       # load average > 2 kéo dài -> hết CPU (2 vCPU)
df -h                        # disk còn dưới 20% -> dọn image hoặc nâng
docker stats --no-stream     # container nào đang ngốn
```

Thứ chạm trần trước tiên gần như chắc chắn là **RAM do MySQL**, khi dữ liệu lớn
dần. Lúc đó có hai lựa chọn theo thứ tự: hạ `innodb_buffer_pool_size` (miễn phí,
đổi lại query chậm hơn), rồi mới nâng gói.

Disk gần đầy thì dọn trước khi nâng — image Docker cũ thường là thủ phạm:

```bash
docker image prune -a -f --filter "until=72h"   # giữ lại các tag gần đây để rollback
docker builder prune -f                          # cache của buildx, hay phình nhất
```

**Nối vào MySQL**

MySQL không publish port ra host lẫn ra Internet. Cách đơn giản nhất là mở shell
ngay trong container:

```bash
$COMPOSE exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

Cần dùng GUI (TablePlus, DBeaver…) từ máy local thì mở SSH tunnel, kèm một
container tạm làm cầu nối — như vậy port 3306 chỉ lắng nghe trên `127.0.0.1`
của VPS, không ra Internet:

```bash
# Trên VPS — giữ cửa sổ này mở
docker run --rm -p 127.0.0.1:3306:3306 \
  --network bluffing-coffee-prod_bluffing_coffee_prod \
  alpine/socat tcp-listen:3306,fork,reuseaddr tcp-connect:mysql:3306

# Trên máy local — giữ cửa sổ này mở, rồi trỏ GUI vào 127.0.0.1:3307
ssh -N -L 3307:127.0.0.1:3306 deploy@<IPv4>
```

Xong việc thì `Ctrl-C` cả hai. Đừng để container `socat` chạy thường trực.

---

## Chi phí

Chủ trương: **chỉ trả tiền cho VPS, mọi thứ còn lại dùng free tier.**

| Hạng mục | Chi phí/tháng |
|---|---|
| VPS Việt Nam (2 vCPU / 4GB / 30GB NVMe / 200 Mbps, gồm IPv4) | 158.000đ |
| DuckDNS — subdomain + DNS | 0đ |
| Let's Encrypt — chứng chỉ TLS qua Caddy | 0đ |
| GitHub Actions + GHCR — CI/CD và registry (repo public) | 0đ |
| Backup hàng ngày của nhà cung cấp | 0đ (kèm gói) |
| UptimeRobot — giám sát `/up` | 0đ |
| **Tổng** | **158.000đ** (trả trước 12 tháng ≈ 1.896.000đ) |

Lưu ý:

- **Không có khoản hosting frontend** vì SPA được Caddy serve ngay trên VPS.
  Trước đây phương án Vercel Hobby là 0đ nhưng theo điều khoản chỉ dành cho mục
  đích phi thương mại — vận hành thật cho quán là vi phạm, phải lên Pro
  $20/tháng. Serve tại chỗ vừa hết lo khoản đó, vừa bỏ luôn CORS.
- **GHCR chỉ miễn phí không giới hạn khi repo public.** Deploy tag image theo
  commit SHA nên mỗi lần deploy đẻ ra một version ~300–500MB và không tự xóa.
  Nếu chuyển repo sang private, GitHub Free chỉ cho 500MB → hết quota sau 1–2
  lần deploy. Lúc đó phải thêm bước dọn version cũ vào workflow.
- Băng thông trong nước của VPS VN thường không giới hạn, nên traffic coi như
  không phát sinh chi phí.
- Free tier của các nhà cung cấp thay đổi thường xuyên — nên kiểm tra lại trang
  pricing trước khi phụ thuộc vào một dịch vụ nào đó lâu dài.

## Ghi chú

- **Volume dữ liệu**: `mysql_data`, `app_storage` (file upload + log Laravel),
  `caddy_data` (chứng chỉ TLS) là named volume. `docker compose down -v` sẽ xóa
  sạch — đừng bao giờ chạy lệnh đó trên production.
- **Giới hạn log**: mỗi service giới hạn 3 file × 10MB (`logging:` trong
  `docker-compose.prod.yml`), và Laravel dùng channel `daily` tự xóa sau 14
  ngày. Không có hai thứ này thì log ghi mãi cho tới khi đầy disk, và đầy disk
  thì MySQL chết trước tiên.
- **MySQL và Redis không mở port ra ngoài**, chỉ truy cập được trong network của
  compose. Đọc lại cảnh báo `ufw` ở bước 2 trước khi định thêm `ports:`.
- **`/` thuộc về SPA, không phải Laravel.** Caddy chỉ đẩy `/api/*`, `/up` và
  `/storage/*` sang PHP; mọi đường dẫn khác trả về `index.html`. Route
  `Route::get('/')` trong `routes/web.php` vì thế không bao giờ được gọi trên
  production.
- **`route:cache` không chạy được** vì `routes/web.php` còn closure route
  (`Route::get('/')`). Xóa route đó — nó đã vô dụng như trên — thì bật lại được
  `route:cache` trong `entrypoint.prod.sh`.
- **Đổi frontend cũng phải deploy lại backend**, vì hai thứ nằm chung một image.
  Đây là cái giá của kiến trúc same-origin, đổi lại được deploy nguyên tử: SPA
  và API luôn khớp phiên bản.
