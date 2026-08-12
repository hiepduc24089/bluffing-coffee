<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\StaffIndexRequest;
use App\Http\Requests\Staff\StoreStaffRequest;
use App\Http\Requests\Staff\SyncStaffPermissionsRequest;
use App\Http\Requests\Staff\UpdateStaffRequest;
use App\Http\Resources\StaffResource;
use App\Models\Admin;
use App\Services\AdminPermissionCatalog;
use App\Services\StaffService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class StaffController extends Controller
{
    public function __construct(
        private readonly StaffService $staffService,
        private readonly AdminPermissionCatalog $permissionCatalog,
    ) {
    }

    public function index(StaffIndexRequest $request): AnonymousResourceCollection
    {
        $validated = $request->validated();

        return StaffResource::collection(
            $this->staffService->paginate(
                search: $validated['search'] ?? null,
                perPage: (int) ($validated['per_page'] ?? 10),
            ),
        );
    }

    public function catalog(): JsonResponse
    {
        return response()->json(['data' => $this->permissionCatalog->toArray()]);
    }

    public function store(StoreStaffRequest $request): StaffResource
    {
        return StaffResource::make($this->staffService->create($request->validated()));
    }

    public function update(UpdateStaffRequest $request, Admin $staff): StaffResource
    {
        return StaffResource::make(
            $this->staffService->update($staff, $request->validated(), $this->actor($request)),
        );
    }

    public function syncPermissions(SyncStaffPermissionsRequest $request, Admin $staff): StaffResource
    {
        return StaffResource::make(
            $this->staffService->syncPermissions(
                $staff,
                $request->validated()['permissions'],
                $this->actor($request),
            ),
        );
    }

    public function destroy(Request $request, Admin $staff): JsonResponse
    {
        $this->staffService->delete($staff, $this->actor($request));

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    private function actor(Request $request): Admin
    {
        /** @var Admin $admin */
        $admin = $request->user();

        return $admin;
    }
}
