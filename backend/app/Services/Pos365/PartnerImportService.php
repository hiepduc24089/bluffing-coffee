<?php

namespace App\Services\Pos365;

use App\DTOs\Pos365\Pos365PartnerDTO;
use App\Enums\Pos365PartnerImportStatusEnum;
use App\Models\Pos365PartnerImport;
use App\Repositories\Pos365PartnerImportRepository;
use App\Repositories\Pos365SyncStateRepository;
use App\Services\MemberPresenceService;
use App\Support\Pos365\Pos365Client;
use App\Support\Pos365\Pos365Exception;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Kéo khách hàng POS365 về theo con trỏ đồng bộ.
 *
 * `GET /api/partners/sync` trả về `{ LatestSync, Data }`: `Data` là phần thay
 * đổi kể từ con trỏ truyền vào, `LatestSync` là con trỏ cho lần sau. Con trỏ do
 * máy chủ POS365 sinh theo giờ của họ nên ta chỉ lưu lại nguyên chuỗi và trả
 * về y như đã nhận — không parse, không so sánh, không lo lệch đồng hồ.
 *
 * Đã kiểm chứng trên tài khoản thật ngày 13/08/2026: bắt được cả khách mới tạo
 * lẫn khách bị sửa, trả về bản ghi đầy đủ, và con trỏ dùng được ở phiên khác.
 * KHÔNG bắt được khách bị xoá — xoá là mất tích im lặng.
 */
class PartnerImportService
{
    public function __construct(
        private readonly Pos365Client $client,
        private readonly Pos365PartnerImportRepository $imports,
        private readonly Pos365SyncStateRepository $syncStates,
        private readonly PartnerLinkService $linker,
        private readonly MemberPresenceService $presence,
    ) {}

    public function sync(bool $full = false): Pos365SyncResult
    {
        if (! config('pos365.enabled') || ! $this->client->isConfigured()) {
            return Pos365SyncResult::skipped('POS365 chưa được bật hoặc chưa cấu hình.');
        }

        $key = Pos365SyncStateRepository::PARTNERS;

        if ($full) {
            $this->syncStates->resetCursor($key);
        }

        $this->syncStates->markRunning($key);

        try {
            $payload = $this->fetch($this->syncStates->cursor($key));
        } catch (Throwable $e) {
            $this->syncStates->markFailure($key, $e->getMessage());

            throw $e;
        }

        $counts = [];
        $failed = 0;

        foreach ($payload['rows'] as $row) {
            if (! is_array($row)) {
                $failed++;

                continue;
            }

            $partner = Pos365PartnerDTO::fromApi($row);

            if ($partner === null) {
                $failed++;
                Log::warning('POS365: bản ghi khách hàng không có Id, bỏ qua', ['row' => $row]);

                continue;
            }

            try {
                $import = $this->record($partner);

                // Admin đã chủ động bỏ qua bản ghi này (khách vãng lai, bản ghi
                // rác, hoặc đã gộp tay). Mỗi lượt sync sau vẫn kéo nó về nếu có
                // thay đổi, nhưng quyết định của người phải thắng máy.
                if ($import->status === Pos365PartnerImportStatusEnum::Ignored) {
                    $status = Pos365PartnerImportStatusEnum::Ignored;
                } else {
                    $status = $this->linker->link($partner, $import);

                    // Lượt gia tăng chỉ trả về những khách POS365 vừa động vào,
                    // nên có mặt ở đây là một tín hiệu "người này đang ở quán".
                    //
                    // Lượt kéo lại toàn bộ (`--full`) thì KHÔNG: nó trả về cả
                    // quán, và đóng dấu tất cả cùng một mốc sẽ xoá sạch thứ tự
                    // gần đây — đúng thứ duy nhất cột này dùng để làm.
                    if (! $full && $import->user_id !== null) {
                        $this->presence->markSeenById($import->user_id);
                    }
                }

                $counts[$status->value] = ($counts[$status->value] ?? 0) + 1;
            } catch (Throwable $e) {
                $failed++;
                Log::error('POS365: xử lý khách hàng thất bại', [
                    'pos365_partner_id' => $partner->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Con trỏ chỉ nhích lên khi TOÀN BỘ lô đã xử lý xong. Còn một bản ghi
        // lỗi thì giữ nguyên con trỏ cũ để lần sau kéo lại — mọi bước ở đây đều
        // khoá theo `Partner.Id` nên chạy lại không tạo trùng.
        if ($failed === 0) {
            $this->syncStates->markSuccess($key, $payload['cursor']);
        } else {
            $this->syncStates->markFailure($key, "{$failed} bản ghi lỗi, giữ nguyên con trỏ để kéo lại.");
        }

        return Pos365SyncResult::completed(
            received: count($payload['rows']),
            failed: $failed,
            byStatus: $counts,
            cursor: $payload['cursor'],
        );
    }

    /**
     * @return array{rows: array<int, mixed>, cursor: string|null}
     */
    private function fetch(?string $cursor): array
    {
        $payload = $this->client->get(
            '/api/partners/sync',
            $cursor !== null ? ['LatestSync' => $cursor] : [],
        );

        $rows = $payload['Data'] ?? null;

        if (! is_array($rows)) {
            throw Pos365Exception::unexpectedPayload('/api/partners/sync', 'thiếu mảng `Data`');
        }

        $next = $payload['LatestSync'] ?? null;

        return [
            'rows' => $rows,
            // Không có con trỏ mới thì giữ con trỏ cũ, đừng để null — null nghĩa
            // là "kéo lại từ đầu" và sẽ quét lại toàn bộ khách của quán.
            'cursor' => is_string($next) && $next !== '' ? $next : $cursor,
        ];
    }

    /**
     * Ghi lại bản ghi thô trước khi xử lý. Bản ghi hỏng hay không dùng được vẫn
     * phải nằm lại đây, nếu không thì khi có tranh cãi về BP sẽ không còn gì để
     * đối chiếu.
     */
    private function record(Pos365PartnerDTO $partner): Pos365PartnerImport
    {
        $attributes = [
            'pos365_code' => $partner->code,
            'name' => $partner->name,
            'phone' => $partner->phone,
            'phone_e164' => $partner->phoneE164,
            'payload' => $partner->raw,
        ];

        $existing = $this->imports->findByPartnerId($partner->id);

        // Không hạ trạng thái của bản ghi admin đã chốt "bỏ qua" — làm vậy thì
        // mỗi lượt sync lại dựng dậy đúng những việc người ta vừa dọn xong.
        if ($existing === null || $existing->status !== Pos365PartnerImportStatusEnum::Ignored) {
            $attributes['status'] = Pos365PartnerImportStatusEnum::Pending;
        }

        return $this->imports->upsertByPartnerId($partner->id, $attributes);
    }
}
