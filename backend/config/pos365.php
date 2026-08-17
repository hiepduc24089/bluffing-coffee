<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cửa hàng
    |--------------------------------------------------------------------------
    |
    | POS365 cấp cho mỗi cửa hàng một tên miền riêng. Phải gọi vào tên miền đó,
    | gọi thẳng api.pos365.vn không có dữ liệu của quán.
    |
    */

    'base_url' => rtrim((string) env('POS365_BASE_URL', ''), '/'),

    'username' => env('POS365_USERNAME'),

    'password' => env('POS365_PASSWORD'),

    /*
    |--------------------------------------------------------------------------
    | Bật / tắt
    |--------------------------------------------------------------------------
    |
    | Thiếu cấu hình thì cron tự bỏ qua thay vì ném lỗi mỗi phút. Nhờ vậy môi
    | trường dev và CI không cần biết gì về POS365.
    |
    */

    'enabled' => env('POS365_ENABLED', false)
        && env('POS365_BASE_URL')
        && env('POS365_USERNAME'),

    /*
    |--------------------------------------------------------------------------
    | HTTP
    |--------------------------------------------------------------------------
    |
    | login_attempts: POS365 thi thoảng trả về response không có SessionId dù
    | thông tin đăng nhập đúng — đã gặp khi chạy thử ngày 13/08/2026. Gọi lại
    | vài giây sau thì bình thường, nên client phải tự thử lại.
    |
    */

    'timeout' => (int) env('POS365_TIMEOUT', 30),

    'login_attempts' => (int) env('POS365_LOGIN_ATTEMPTS', 3),

    'retry_delay_ms' => (int) env('POS365_RETRY_DELAY_MS', 1500),

    /*
    | SessionId sống được bao lâu thì POS365 không công bố. Ta tự đặt hạn ngắn
    | hơn phỏng đoán và đăng nhập lại khi hết, cộng thêm việc bắt 401 để đăng
    | nhập lại giữa chừng.
    */

    'session_ttl_minutes' => (int) env('POS365_SESSION_TTL_MINUTES', 30),

    'session_cache_key' => 'pos365:session',

    /*
    |--------------------------------------------------------------------------
    | Đồng bộ hội viên
    |--------------------------------------------------------------------------
    |
    | page_size chỉ dùng cho đường dự phòng OData. `GET /api/partners/sync` trả
    | về trọn phần thay đổi kể từ con trỏ, không phân trang.
    |
    */

    'partner_page_size' => (int) env('POS365_PARTNER_PAGE_SIZE', 100),

    /*
    | POS365 phân loại đối tác bằng `Type`: 1 là khách hàng, 0 là nhà cung cấp.
    | Ta chỉ quan tâm khách hàng.
    */

    'partner_customer_type' => 1,

];
