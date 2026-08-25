<?php

namespace App\Http\Resources;

use App\Models\ShiftAssignment;
use App\Support\ShiftTimeResolver;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ShiftAssignment
 */
class ShiftAssignmentResource extends JsonResource
{
    /**
     * `locked` do lời gọi truyền vào chứ không tự tra: lịch trả về cả tuần nên
     * tra theo từng ca sẽ thành N+1, còn ca vừa tạo/sửa thì chắc chắn chưa khóa.
     *
     * @param  ShiftAssignment  $resource
     */
    public function __construct($resource, private readonly bool $locked = false)
    {
        parent::__construct($resource);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $range = app(ShiftTimeResolver::class)->rangeFor($this->work_date, $this->slot);

        return [
            'id' => $this->id,
            'workDate' => $this->work_date->toDateString(),
            'slot' => $this->slot->value,
            'role' => $this->role->value,
            'roleLabel' => $this->role->label(),
            'startAt' => $range['start']->format('Y-m-d H:i'),
            'endAt' => $range['end']->format('Y-m-d H:i'),
            'note' => $this->note,
            'locked' => $this->locked,
            'staff' => SchedulableStaffResource::make($this->whenLoaded('admin')),
        ];
    }
}
