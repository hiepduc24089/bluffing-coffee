<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
 * POS365 không có webhook — đã rà hết ~400 operation trong metadata của họ,
 * không có chỗ nào khai báo URL của mình. Muốn biết quầy vừa tạo khách nào thì
 * chỉ có cách hỏi lại theo nhịp.
 *
 * Mỗi phút — nhịp dày nhất mà Laravel làm được, vì cron chỉ gọi `schedule:run`
 * một phút một lần. Đây cũng là lý do phần tăng thêm gần như bằng không: tiến
 * trình đó vốn đã khởi động mỗi phút dù có việc hay không, ta chỉ thêm phần
 * thân lệnh vào một lần boot sẵn có. Lượt không có gì mới chỉ tốn một request
 * rỗng sang POS365.
 *
 * Lượt sync đo được ~0.5 giây nên không cần `runInBackground()` — chạy nền chỉ
 * thêm một tiến trình mồ côi để lo, không tiết kiệm được gì.
 *
 * `withoutOverlapping` phải có hạn khoá tường minh: mặc định của Laravel là 24
 * giờ, nên một lần bị kill cứng (deploy đúng lúc đang chạy) sẽ để lại khoá treo
 * và đồng bộ chết im suốt một ngày. 10 phút là quá đủ cho việc chạy nửa giây,
 * và ở nhịp một phút thì chốt chặn này là thứ giữ cho một lượt chậm bất thường
 * không bị lượt sau chồng lên.
 */
Schedule::command('pos365:sync-partners')
    ->everyMinute()
    ->withoutOverlapping(10);
