<?php

namespace App\Support;

use App\Enums\DayTypeEnum;
use App\Enums\ShiftSlotEnum;
use App\Models\ShiftSetting;
use App\Repositories\ShiftScheduleRepository;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Giờ mở ca chỉ có hai dòng cấu hình nhưng bị hỏi lại cho từng ca trong tuần,
 * nên đăng ký singleton và nạp một lần cho mỗi request thay vì query lặp.
 */
class ShiftTimeResolver
{
    /** @var Collection<int, ShiftSetting>|null */
    private ?Collection $settings = null;

    public function __construct(
        private readonly ShiftScheduleRepository $scheduleRepository,
    ) {}

    /**
     * @return Collection<int, ShiftSetting>
     */
    public function all(): Collection
    {
        return $this->settings ??= $this->scheduleRepository->settings();
    }

    public function settingFor(CarbonInterface $date): ShiftSetting
    {
        $dayType = DayTypeEnum::fromDate($date);
        $setting = $this->all()->firstWhere('day_type', $dayType);

        if (! $setting instanceof ShiftSetting) {
            throw ValidationException::withMessages([
                'workDate' => 'Chưa cấu hình giờ mở ca cho '.$dayType->label().'.',
            ]);
        }

        return $setting;
    }

    /**
     * @return array{start: CarbonInterface, end: CarbonInterface}
     */
    public function rangeFor(CarbonInterface $date, ShiftSlotEnum $slot): array
    {
        return $slot->rangeOn($date, $this->settingFor($date));
    }
}
