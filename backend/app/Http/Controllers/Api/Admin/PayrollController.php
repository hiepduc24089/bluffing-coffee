<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\PayrollIndexRequest;
use App\Http\Requests\Payroll\PayrollPaymentRequest;
use App\Http\Requests\Payroll\UpdateHourlyRateRequest;
use App\Http\Resources\PayrollRowResource;
use App\Models\Admin;
use App\Services\PayrollService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class PayrollController extends Controller
{
    public function __construct(
        private readonly PayrollService $payrollService,
    ) {}

    public function index(PayrollIndexRequest $request): AnonymousResourceCollection
    {
        $month = CarbonImmutable::createFromFormat('Y-m', $request->validated()['month'])->startOfMonth();

        return PayrollRowResource::collection(
            $this->payrollService->monthlySummary($month, $this->actor($request)),
        );
    }

    public function updateRate(UpdateHourlyRateRequest $request, Admin $staff): JsonResponse
    {
        $hourlyRate = $request->validated()['hourlyRate'] ?? null;
        $updated = $this->payrollService->updateHourlyRate(
            $staff,
            $hourlyRate === null ? null : (int) $hourlyRate,
            $this->actor($request),
        );

        return response()->json([
            'data' => [
                'id' => $updated->id,
                'name' => $updated->name,
                'hourlyRate' => $updated->hourly_rate,
            ],
        ]);
    }

    public function pay(PayrollPaymentRequest $request, Admin $staff): JsonResponse
    {
        $payment = $this->payrollService->pay(
            $staff,
            $this->month($request),
            $this->actor($request),
        );

        return response()->json([
            'data' => [
                'paidAt' => $payment->paid_at->format('Y-m-d H:i'),
                'totalHours' => (float) $payment->total_hours,
                'hourlyRate' => $payment->hourly_rate,
                'totalPay' => $payment->total_pay,
            ],
        ], Response::HTTP_CREATED);
    }

    public function revertPayment(PayrollPaymentRequest $request, Admin $staff): JsonResponse
    {
        $this->payrollService->revertPayment($staff, $this->month($request), $this->actor($request));

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    private function month(PayrollPaymentRequest $request): CarbonImmutable
    {
        return CarbonImmutable::createFromFormat('Y-m', $request->validated()['month'])->startOfMonth();
    }

    private function actor(Request $request): Admin
    {
        /** @var Admin $admin */
        $admin = $request->user();

        return $admin;
    }
}
