<?php

namespace App\Services;

use App\DTOs\ShiftAssignmentDTO;
use App\Enums\ShiftSlotEnum;
use App\Enums\StaffPositionEnum;
use App\Models\Admin;
use App\Models\ShiftAssignment;
use App\Models\ShiftSetting;
use App\Repositories\PayrollPaymentRepository;
use App\Repositories\ShiftScheduleRepository;
use App\Support\ShiftTimeResolver;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ShiftScheduleService
{
    public function __construct(
        private readonly ShiftScheduleRepository $scheduleRepository,
        private readonly PayrollPaymentRepository $paymentRepository,
        private readonly ShiftTimeResolver $timeResolver,
    ) {}

    /**
     * `paidKeys` là tập `adminId-YYYY-MM` đã trả lương, để tầng hiển thị biết ca
     * nào bị khoá mà không phải hỏi lại DB theo từng ca.
     *
     * @return array{assignments: Collection<int, ShiftAssignment>, settings: Collection<int, ShiftSetting>, paidKeys: array<int, string>}
     */
    public function calendar(CarbonInterface $from, CarbonInterface $to): array
    {
        return [
            'assignments' => $this->scheduleRepository->assignmentsBetween($from, $to),
            'settings' => $this->timeResolver->all(),
            'paidKeys' => $this->paymentRepository->paidKeysBetween($from, $to)->all(),
        ];
    }

    public function isLocked(ShiftAssignment $assignment): bool
    {
        return $this->paymentRepository->find($assignment->admin, $assignment->work_date) !== null;
    }

    /**
     * @return Collection<int, Admin>
     */
    public function schedulableStaff(): Collection
    {
        return $this->scheduleRepository->schedulableStaff();
    }

    public function assign(ShiftAssignmentDTO $data, Admin $actor): ShiftAssignment
    {
        return DB::transaction(function () use ($data, $actor) {
            $staff = $this->resolveStaff($data->staffId);
            $this->guardNotPaid($staff, $data->workDate);
            $sameDay = $this->scheduleRepository->assignmentsForDateLocked($data->workDate);

            $this->guardAssignable($staff, $data, $sameDay, null);

            return $this->scheduleRepository->create([
                'admin_id' => $staff->getKey(),
                'work_date' => $data->workDate->toDateString(),
                'slot' => $data->slot->value,
                'role' => ($data->role ?? $this->positionOf($staff))->value,
                'note' => $data->note,
                'created_by_admin_id' => $actor->getKey(),
            ])->load('admin');
        });
    }

    /**
     * Dùng chung cho kéo thả (đổi ngày/nửa ca) lẫn sửa trong modal, vì cả hai
     * đều là "ghi đè toàn bộ thông tin của một ca".
     */
    public function move(ShiftAssignment $assignment, ShiftAssignmentDTO $data): ShiftAssignment
    {
        return DB::transaction(function () use ($assignment, $data) {
            $staff = $this->resolveStaff($data->staffId);
            // Cả chỗ đi lẫn chỗ đến đều phải mở khoá, nếu không sẽ kéo được một ca
            // ra khỏi tháng đã chốt (làm hụt giờ công đã trả) hoặc thả vào tháng đó.
            $this->guardNotPaid($assignment->admin, $assignment->work_date);
            $this->guardNotPaid($staff, $data->workDate);
            $sameDay = $this->scheduleRepository->assignmentsForDateLocked($data->workDate);

            $this->guardAssignable($staff, $data, $sameDay, $assignment);

            return $this->scheduleRepository->update($assignment, [
                'admin_id' => $staff->getKey(),
                'work_date' => $data->workDate->toDateString(),
                'slot' => $data->slot->value,
                'role' => ($data->role ?? $this->positionOf($staff))->value,
                'note' => $data->note,
            ])->load('admin');
        });
    }

    public function remove(ShiftAssignment $assignment): void
    {
        DB::transaction(function () use ($assignment) {
            $this->guardNotPaid($assignment->admin, $assignment->work_date);
            $this->scheduleRepository->delete($assignment);
        });
    }

    /**
     * Đã chuyển khoản lương tháng nào thì giờ công tháng đó là con số đã trả,
     * không cho sửa nữa — muốn sửa phải hủy thanh toán trước.
     */
    private function guardNotPaid(Admin $staff, CarbonInterface $workDate): void
    {
        if ($this->paymentRepository->find($staff, $workDate) === null) {
            return;
        }

        throw ValidationException::withMessages([
            'workDate' => 'Lương tháng '.$workDate->format('m/Y').' của '.$staff->name
                .' đã thanh toán, ca trong tháng này đã bị khóa.',
        ]);
    }

    private function resolveStaff(int $staffId): Admin
    {
        $staff = Admin::query()->find($staffId);

        if (! $staff instanceof Admin) {
            throw ValidationException::withMessages([
                'staffId' => 'Không tìm thấy nhân viên.',
            ]);
        }

        return $staff;
    }

    /**
     * @param  Collection<int, ShiftAssignment>  $sameDay
     */
    private function guardAssignable(
        Admin $staff,
        ShiftAssignmentDTO $data,
        Collection $sameDay,
        ?ShiftAssignment $current,
    ): void {
        $position = $this->positionOf($staff);
        $role = $data->role ?? $position;
        $setting = $this->timeResolver->settingFor($data->workDate);

        $others = $sameDay->reject(
            fn (ShiftAssignment $assignment) => $current && $assignment->getKey() === $current->getKey(),
        );

        // Một người được đứng nửa ca đầu và nửa ca sau của cùng một ngày — đó là hai
        // khung giờ rời nhau. Chỉ chặn khi hai ca thật sự chồng giờ: nguyên ca đụng
        // mọi thứ, còn hai nửa giống nhau thì trùng.
        $conflict = $others->first(
            fn (ShiftAssignment $assignment) => $assignment->admin_id === $staff->getKey()
                && $assignment->slot->overlaps($data->slot),
        );

        if ($conflict instanceof ShiftAssignment) {
            throw ValidationException::withMessages([
                'staffId' => $staff->name.' đã có '.mb_strtolower($conflict->slot->label()).' trong ngày này.',
            ]);
        }

        $this->guardCapacity($others, $data->slot, $role, $setting);
    }

    /**
     * @param  Collection<int, ShiftAssignment>  $others
     */
    private function guardCapacity(
        Collection $others,
        ShiftSlotEnum $slot,
        StaffPositionEnum $role,
        ShiftSetting $setting,
    ): void {
        $overlapping = $others
            ->filter(fn (ShiftAssignment $assignment) => $assignment->role === $role)
            ->filter(fn (ShiftAssignment $assignment) => $assignment->slot->overlaps($slot))
            ->count();

        $capacity = $role === StaffPositionEnum::Barista ? $setting->max_barista : $setting->max_dealer;

        if ($overlapping < $capacity) {
            return;
        }

        throw ValidationException::withMessages([
            'slot' => 'Ca này đã đủ '.$capacity.' '.mb_strtolower($role->label()).'.',
        ]);
    }

    private function positionOf(Admin $staff): StaffPositionEnum
    {
        $position = $staff->position;

        if (! $position instanceof StaffPositionEnum) {
            throw ValidationException::withMessages([
                'staffId' => $staff->name.' chưa được chọn vị trí, hãy cập nhật ở trang Nhân viên.',
            ]);
        }

        return $position;
    }
}
