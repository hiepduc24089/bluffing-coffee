<?php

namespace App\Repositories;

use App\Models\Admin;
use App\Models\ShiftAssignment;
use App\Models\ShiftSetting;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;

class ShiftScheduleRepository
{
    /**
     * @return Collection<int, ShiftAssignment>
     */
    public function assignmentsBetween(CarbonInterface $from, CarbonInterface $to): Collection
    {
        return ShiftAssignment::query()
            ->with('admin')
            ->whereBetween('work_date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('work_date')
            ->orderBy('slot')
            ->get();
    }

    /**
     * Khoá các dòng cùng ngày để hai admin xếp ca song song không cùng lọt qua
     * bước đếm sức chứa.
     *
     * @return Collection<int, ShiftAssignment>
     */
    public function assignmentsForDateLocked(CarbonInterface $date): Collection
    {
        return ShiftAssignment::query()
            ->where('work_date', $date->toDateString())
            ->lockForUpdate()
            ->get();
    }

    /**
     * @return Collection<int, ShiftSetting>
     */
    public function settings(): Collection
    {
        return ShiftSetting::query()->get();
    }

    /**
     * @return Collection<int, Admin>
     */
    public function schedulableStaff(): Collection
    {
        return Admin::query()
            ->whereNotNull('position')
            ->orderBy('position')
            ->orderBy('name')
            ->get();
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): ShiftAssignment
    {
        return ShiftAssignment::query()->create($attributes);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(ShiftAssignment $assignment, array $attributes): ShiftAssignment
    {
        $assignment->update($attributes);

        return $assignment->refresh();
    }

    public function delete(ShiftAssignment $assignment): void
    {
        $assignment->delete();
    }
}
