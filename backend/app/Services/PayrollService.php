<?php

namespace App\Services;

use App\DTOs\PayrollRowDTO;
use App\Enums\AdminSpecialPermissionEnum;
use App\Enums\ShiftSlotEnum;
use App\Models\Admin;
use App\Models\PayrollPayment;
use App\Models\ShiftAssignment;
use App\Repositories\PayrollPaymentRepository;
use App\Repositories\ShiftScheduleRepository;
use App\Support\ShiftTimeResolver;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Bảng lương tính thẳng từ lịch đã xếp: không có bảng chấm công riêng, vì ca
 * chốt trên lịch chính là căn cứ trả lương của quán.
 */
class PayrollService
{
    public function __construct(
        private readonly ShiftScheduleRepository $scheduleRepository,
        private readonly PayrollPaymentRepository $paymentRepository,
        private readonly ShiftTimeResolver $timeResolver,
    ) {}

    /**
     * Lương là chuyện riêng của từng người: chỉ quản lý được cấp quyền xem toàn
     * quán mới thấy cả bảng, còn lại chỉ thấy đúng dòng của mình.
     *
     * @return Collection<int, PayrollRowDTO>
     */
    public function monthlySummary(CarbonImmutable $month, Admin $actor): Collection
    {
        $from = $month->startOfMonth();
        $to = $month->endOfMonth();

        $assignmentsByStaff = $this->scheduleRepository
            ->assignmentsBetween($from, $to)
            ->groupBy('admin_id');

        $paymentsByStaff = $this->paymentRepository->forMonth($month)->keyBy('admin_id');

        return $this->visibleStaff($actor)
            ->map(function (Admin $staff) use ($assignmentsByStaff, $paymentsByStaff) {
                /** @var Collection<int, ShiftAssignment> $assignments */
                $assignments = $assignmentsByStaff->get($staff->getKey(), collect());

                return $this->buildRow($staff, $assignments, $paymentsByStaff->get($staff->getKey()));
            })
            ->values();
    }

    public function updateHourlyRate(Admin $staff, ?int $hourlyRate, Admin $actor): Admin
    {
        $this->guardCanEditRate($staff, $actor);

        return DB::transaction(function () use ($staff, $hourlyRate) {
            $staff->update(['hourly_rate' => $hourlyRate]);

            return $staff->refresh();
        });
    }

    /**
     * Đánh dấu đã chuyển khoản lương tháng cho một nhân viên. Số giờ, lương giờ
     * và thành tiền được chụp lại ngay lúc này, vì từ đây các ca của tháng đó bị
     * khoá và bảng lương không được phép tính ra con số khác nữa.
     */
    public function pay(Admin $staff, CarbonImmutable $month, Admin $actor): PayrollPayment
    {
        $this->guardCanPay($staff, $actor);

        return DB::transaction(function () use ($staff, $month, $actor) {
            if ($this->paymentRepository->findLocked($staff, $month) instanceof PayrollPayment) {
                throw ValidationException::withMessages([
                    'month' => 'Lương tháng này của '.$staff->name.' đã được thanh toán.',
                ]);
            }

            $row = $this->rowFor($staff, $month);

            if ($row->hourlyRate === null) {
                throw ValidationException::withMessages([
                    'month' => 'Chưa chốt lương giờ cho '.$staff->name.'.',
                ]);
            }

            if ($row->shiftCount === 0) {
                throw ValidationException::withMessages([
                    'month' => $staff->name.' không có ca nào trong tháng này.',
                ]);
            }

            return $this->paymentRepository->create([
                'admin_id' => $staff->getKey(),
                'period_month' => $month->startOfMonth()->toDateString(),
                'total_hours' => $row->totalHours,
                'hourly_rate' => $row->hourlyRate,
                'total_pay' => $row->totalPay,
                'paid_at' => CarbonImmutable::now(),
                'paid_by_admin_id' => $actor->getKey(),
            ]);
        });
    }

    /**
     * Gỡ đánh dấu đã thanh toán để mở khoá lại các ca của tháng. Dành cho trường
     * hợp bấm nhầm — nếu không, một cú bấm sai sẽ khoá vĩnh viễn lịch của tháng đó.
     */
    public function revertPayment(Admin $staff, CarbonImmutable $month, Admin $actor): void
    {
        $this->guardCanPay($staff, $actor);

        DB::transaction(function () use ($staff, $month) {
            $payment = $this->paymentRepository->findLocked($staff, $month);

            if (! $payment instanceof PayrollPayment) {
                throw ValidationException::withMessages([
                    'month' => 'Lương tháng này của '.$staff->name.' chưa được thanh toán.',
                ]);
            }

            $this->paymentRepository->delete($payment);
        });
    }

    private function rowFor(Admin $staff, CarbonImmutable $month): PayrollRowDTO
    {
        $assignments = $this->scheduleRepository
            ->assignmentsBetween($month->startOfMonth(), $month->endOfMonth())
            ->where('admin_id', $staff->getKey());

        return $this->buildRow($staff, $assignments, null);
    }

    /**
     * Trả lương là thao tác đụng thẳng vào tiền nên tách riêng khỏi `payroll.update`
     * (vốn chỉ để sửa mức lương giờ). Cùng lý do với sửa lương giờ: phải xem được
     * cả bảng mới trả được, và không ai tự bấm "đã chuyển khoản" cho chính mình.
     */
    private function guardCanPay(Admin $staff, Admin $actor): void
    {
        if (! $this->canViewAll($actor) || ! $actor->hasPermission(AdminSpecialPermissionEnum::PaySalary->value)) {
            throw ValidationException::withMessages([
                'staff' => 'Bạn không có quyền thanh toán lương.',
            ]);
        }

        if (! $actor->is_super_admin && $staff->getKey() === $actor->getKey()) {
            throw ValidationException::withMessages([
                'staff' => 'Không thể tự thanh toán lương cho chính mình.',
            ]);
        }
    }

    /**
     * @return Collection<int, Admin>
     */
    private function visibleStaff(Admin $actor): Collection
    {
        if ($this->canViewAll($actor)) {
            return $this->scheduleRepository->schedulableStaff();
        }

        return collect([$actor]);
    }

    private function canViewAll(Admin $actor): bool
    {
        return $actor->hasPermission(AdminSpecialPermissionEnum::ViewAllPayroll->value);
    }

    /**
     * Người chỉ xem lương của mình thì cũng không được tự sửa mức lương đó, nếu
     * không thì quyền `payroll.update` biến thành quyền tự tăng lương.
     */
    private function guardCanEditRate(Admin $staff, Admin $actor): void
    {
        if (! $this->canViewAll($actor)) {
            throw ValidationException::withMessages([
                'staff' => 'Bạn không có quyền sửa lương giờ.',
            ]);
        }

        if (! $actor->is_super_admin && $staff->getKey() === $actor->getKey()) {
            throw ValidationException::withMessages([
                'staff' => 'Không thể tự sửa lương của chính mình.',
            ]);
        }
    }

    /**
     * @param  Collection<int, ShiftAssignment>  $assignments
     */
    private function buildRow(Admin $staff, Collection $assignments, ?PayrollPayment $payment): PayrollRowDTO
    {
        // Gộp theo ngày trước khi tính: lịch cho phép một người nhận cả hai nửa ca
        // trong ngày, nhưng trên bảng lương đó là một ca Full-time chứ không phải hai Part-time.
        $shifts = $assignments
            ->groupBy(fn (ShiftAssignment $assignment) => $assignment->work_date->toDateString())
            ->sortKeys()
            ->map(fn (Collection $ofDay) => $this->dayEntry($ofDay))
            ->values()
            ->all();

        $totalHours = round(array_sum(array_column($shifts, 'hours')), 2);
        $hourlyRate = $staff->hourly_rate;
        $fullShiftCount = count(
            array_filter($shifts, fn (array $shift) => $shift['slot'] === ShiftSlotEnum::Full->value),
        );

        return new PayrollRowDTO(
            staff: $staff,
            shiftCount: count($shifts),
            fullShiftCount: $fullShiftCount,
            halfShiftCount: count($shifts) - $fullShiftCount,
            totalHours: $totalHours,
            hourlyRate: $hourlyRate,
            totalPay: $hourlyRate === null ? null : (int) round($totalHours * $hourlyRate),
            shifts: $shifts,
            payment: $payment,
        );
    }

    /**
     * Một ngày luôn quy về đúng một dòng công: guard xếp ca chỉ cho phép {Full-time},
     * {Part-time ca 1}, {Part-time ca 2} hoặc cả hai ca Part-time — trường hợp cuối cộng
     * lại chính là Full-time. Lấy khoảng giờ của Full-time thay vì cộng hai nửa để khỏi
     * lệch số lẻ khi làm tròn.
     *
     * @param  Collection<int, ShiftAssignment>  $ofDay
     * @return array{workDate: string, slot: string, slotLabel: string, startAt: string, endAt: string, hours: float}
     */
    private function dayEntry(Collection $ofDay): array
    {
        /** @var ShiftAssignment $first */
        $first = $ofDay->first();
        $slot = $ofDay->count() > 1 ? ShiftSlotEnum::Full : $first->slot;
        $range = $this->timeResolver->rangeFor($first->work_date, $slot);

        return [
            'workDate' => $first->work_date->toDateString(),
            'slot' => $slot->value,
            'slotLabel' => $slot->label(),
            'startAt' => $range['start']->format('H:i'),
            'endAt' => $range['end']->format('H:i'),
            'hours' => round($range['start']->diffInMinutes($range['end']) / 60, 2),
        ];
    }
}
