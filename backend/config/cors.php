<?php

// Production KHÔNG cần cấu hình này: Caddy serve frontend và API trên cùng một
// domain (`/api/*` -> Laravel, còn lại -> SPA), nên request không phải
// cross-origin và trình duyệt không gửi preflight.
//
// Phần dưới chỉ phục vụ local dev, lúc Vite chạy ở :5173 còn API ở :8000.
// `FRONTEND_URL` để trống là bình thường; chỉ điền khi cần cho phép thêm origin
// lạ (ví dụ mở app từ điện thoại trong LAN qua IP của máy dev).
$frontendUrls = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('FRONTEND_URL', ''))
)));

return [
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_unique([
        ...$frontendUrls,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
    ])),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
