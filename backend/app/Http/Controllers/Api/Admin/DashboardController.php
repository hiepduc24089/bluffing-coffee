<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\DashboardSummaryRequest;
use App\Http\Resources\DashboardSummaryResource;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboardService,
    ) {
    }

    public function index(DashboardSummaryRequest $request): JsonResponse
    {
        $summary = $this->dashboardService->summary($request->activityLimit());

        return response()->json([
            'data' => DashboardSummaryResource::make($summary)->resolve(),
        ]);
    }
}
