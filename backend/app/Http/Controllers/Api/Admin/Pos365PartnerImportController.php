<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pos365\IgnorePos365PartnerImportRequest;
use App\Http\Requests\Pos365\LinkPos365PartnerImportRequest;
use App\Http\Requests\Pos365\Pos365PartnerImportIndexRequest;
use App\Http\Resources\Pos365PartnerImportResource;
use App\Models\Pos365PartnerImport;
use App\Models\User;
use App\Repositories\Pos365PartnerImportRepository;
use App\Repositories\Pos365SyncStateRepository;
use App\Services\Pos365\PartnerImportService;
use App\Services\Pos365\PartnerLinkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Hàng đợi đối soát khách hàng POS365.
 *
 * Phần lớn khách được gắn tự động. Màn này tồn tại cho phần còn lại: khách thu
 * ngân quên nhập số điện thoại. POS365 không ép nhập số được (đã thử) nên hàng
 * đợi này sẽ luôn có việc, không phải trường hợp hiếm.
 */
class Pos365PartnerImportController extends Controller
{
    public function __construct(
        private readonly Pos365PartnerImportRepository $imports,
        private readonly Pos365SyncStateRepository $syncStates,
        private readonly PartnerLinkService $linkService,
        private readonly PartnerImportService $importService,
    ) {}

    public function index(Pos365PartnerImportIndexRequest $request): AnonymousResourceCollection
    {
        $validated = $request->validated();

        $imports = $this->imports->paginate(
            $validated['status'] ?? null,
            $validated['search'] ?? null,
            (int) ($validated['per_page'] ?? 20),
        );

        return Pos365PartnerImportResource::collection($imports)->additional([
            'meta' => [
                'counts' => $this->imports->countsByStatus(),
            ],
        ]);
    }

    public function status(): JsonResponse
    {
        $state = $this->syncStates->find(Pos365SyncStateRepository::PARTNERS);

        return response()->json([
            'data' => [
                'enabled' => (bool) config('pos365.enabled'),
                'cursor' => $state->cursor,
                'lastRunAt' => $state->last_run_at?->format('Y-m-d H:i:s'),
                'lastSuccessAt' => $state->last_success_at?->format('Y-m-d H:i:s'),
                'lastError' => $state->last_error,
                'counts' => $this->imports->countsByStatus(),
            ],
        ]);
    }

    public function sync(): JsonResponse
    {
        $result = $this->importService->sync();

        return response()->json([
            'data' => [
                'ran' => $result->ran,
                'skipReason' => $result->skipReason,
                'received' => $result->received,
                'failed' => $result->failed,
                'byStatus' => $result->byStatus,
            ],
        ]);
    }

    public function link(
        LinkPos365PartnerImportRequest $request,
        Pos365PartnerImport $partnerImport,
    ): Pos365PartnerImportResource {
        $user = User::query()->findOrFail($request->validated('user_id'));

        $updated = $this->linkService->linkManually($partnerImport, $user);

        return Pos365PartnerImportResource::make($updated->load('user'));
    }

    public function ignore(
        IgnorePos365PartnerImportRequest $request,
        Pos365PartnerImport $partnerImport,
    ): Pos365PartnerImportResource {
        $updated = $this->linkService->ignore($partnerImport, $request->validated('note'));

        return Pos365PartnerImportResource::make($updated->load('user'));
    }
}
