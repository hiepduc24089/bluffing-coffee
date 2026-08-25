<?php

namespace App\Http\Controllers\Api\Admin;

use App\DTOs\ShiftAssignmentDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Schedule\ScheduleIndexRequest;
use App\Http\Requests\Schedule\StoreShiftAssignmentRequest;
use App\Http\Requests\Schedule\UpdateShiftAssignmentRequest;
use App\Http\Resources\SchedulableStaffResource;
use App\Http\Resources\ShiftAssignmentResource;
use App\Http\Resources\ShiftSettingResource;
use App\Models\Admin;
use App\Models\ShiftAssignment;
use App\Repositories\PayrollPaymentRepository;
use App\Services\ShiftScheduleService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ShiftScheduleController extends Controller
{
    public function __construct(
        private readonly ShiftScheduleService $scheduleService,
    ) {}

    public function index(ScheduleIndexRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $calendar = $this->scheduleService->calendar(
            CarbonImmutable::parse($validated['from'])->startOfDay(),
            CarbonImmutable::parse($validated['to'])->startOfDay(),
        );

        $paidKeys = array_flip($calendar['paidKeys']);

        return response()->json([
            'data' => [
                'assignments' => $calendar['assignments']->map(
                    fn (ShiftAssignment $assignment) => ShiftAssignmentResource::make(
                        $assignment,
                        isset($paidKeys[PayrollPaymentRepository::key($assignment->admin_id, $assignment->work_date)]),
                    ),
                ),
                'settings' => ShiftSettingResource::collection($calendar['settings']),
            ],
        ]);
    }

    public function staff(): AnonymousResourceCollection
    {
        return SchedulableStaffResource::collection($this->scheduleService->schedulableStaff());
    }

    public function store(StoreShiftAssignmentRequest $request): ShiftAssignmentResource
    {
        return ShiftAssignmentResource::make(
            $this->scheduleService->assign(
                ShiftAssignmentDTO::fromArray($request->validated()),
                $this->actor($request),
            ),
        );
    }

    public function update(UpdateShiftAssignmentRequest $request, ShiftAssignment $assignment): ShiftAssignmentResource
    {
        return ShiftAssignmentResource::make(
            $this->scheduleService->move($assignment, ShiftAssignmentDTO::fromArray($request->validated())),
        );
    }

    public function destroy(ShiftAssignment $assignment): JsonResponse
    {
        $this->scheduleService->remove($assignment);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    private function actor(Request $request): Admin
    {
        /** @var Admin $admin */
        $admin = $request->user();

        return $admin;
    }
}
