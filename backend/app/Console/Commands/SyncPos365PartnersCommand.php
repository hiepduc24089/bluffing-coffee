<?php

namespace App\Console\Commands;

use App\Enums\Pos365PartnerImportStatusEnum;
use App\Services\Pos365\PartnerImportService;
use Illuminate\Console\Command;

class SyncPos365PartnersCommand extends Command
{
    protected $signature = 'pos365:sync-partners
                            {--full : Bỏ con trỏ và kéo lại toàn bộ khách hàng}';

    protected $description = 'Kéo khách hàng mới và khách hàng vừa sửa từ POS365 về';

    public function handle(PartnerImportService $service): int
    {
        $result = $service->sync(full: (bool) $this->option('full'));

        if (! $result->ran) {
            $this->components->warn($result->skipReason ?? 'Bỏ qua.');

            return self::SUCCESS;
        }

        $this->components->info("Nhận {$result->received} bản ghi từ POS365.");

        foreach (Pos365PartnerImportStatusEnum::cases() as $status) {
            $count = $result->count($status);

            if ($count > 0) {
                $this->components->twoColumnDetail($status->label(), (string) $count);
            }
        }

        if ($result->failed > 0) {
            $this->components->error(
                "{$result->failed} bản ghi lỗi — giữ nguyên con trỏ, lượt sau sẽ kéo lại.",
            );

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
