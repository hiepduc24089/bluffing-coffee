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
 * 30 giây. Cron vẫn chỉ gọi `schedule:run` mỗi phút — phần dày hơn một phút là
 * do Laravel tự lo: hễ trong lịch có việc dưới một phút, `schedule:run` KHÔNG
 * thoát ngay nữa mà ở lại tới hết phút đó, cứ 100ms ngó một lượt xem việc nào
 * tới hạn (`ScheduleRunCommand::repeatEvents`).
 *
 * Hệ quả không nằm ở file này mà ở tầng ngoài: tiến trình giờ sống gần trọn
 * phút thay vì ~1,5 giây, nên nó vẫn đang cầm khoá đúng lúc cron nổ lượt kế.
 * `run-scheduler.sh` vì thế phải CHỜ khoá chứ không được bỏ lượt — xem chú
 * thích "Bẫy 3" trong script đó. Để `flock -n` như cũ thì thành một phút chạy
 * một phút mất trắng, mà log không có dấu hiệu gì bất thường.
 *
 * Lượt không có gì mới chỉ tốn một request rỗng sang POS365.
 *
 * Lượt sync đo được ~0.5 giây nên không cần `runInBackground()` — chạy nền chỉ
 * thêm một tiến trình mồ côi để lo, không tiết kiệm được gì.
 *
 * `withoutOverlapping` phải có hạn khoá tường minh: mặc định của Laravel là 24
 * giờ, nên một lần bị kill cứng (deploy đúng lúc đang chạy) sẽ để lại khoá treo
 * và đồng bộ chết im suốt một ngày. 10 phút là quá đủ cho việc chạy nửa giây,
 * và ở nhịp 30 giây thì chốt chặn này là thứ giữ cho một lượt chậm bất thường
 * không bị lượt sau chồng lên.
 */
Schedule::command('pos365:sync-partners')
    ->everyThirtySeconds()
    ->withoutOverlapping(10);
