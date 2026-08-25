<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Quán đổi bàn xanh dương thành bàn đen. `table_key` được lưu thẳng vào ghế và
 * nhật ký sự kiện nên phải đổi cả dữ liệu cũ, nếu không lịch sử gom bàn sẽ trỏ
 * tới một bàn không còn tồn tại.
 */
return new class extends Migration
{
    /**
     * @var array<int, array{table: string, column: string}>
     */
    private const TARGETS = [
        ['table' => 'live_tables', 'column' => 'key'],
        ['table' => 'live_table_seats', 'column' => 'table_key'],
        ['table' => 'tournament_live_events', 'column' => 'table_key'],
        ['table' => 'tournament_live_events', 'column' => 'from_table_key'],
        ['table' => 'tournament_live_events', 'column' => 'to_table_key'],
    ];

    public function up(): void
    {
        $this->rename('blue', 'black');
        $this->renameInMetadata('blue', 'black');

        DB::table('live_tables')->where('key', 'black')->update(['name' => 'Bàn Đen']);
    }

    public function down(): void
    {
        $this->rename('black', 'blue');
        $this->renameInMetadata('black', 'blue');

        DB::table('live_tables')->where('key', 'blue')->update(['name' => 'Bàn Xanh Dương']);
    }

    private function rename(string $from, string $to): void
    {
        foreach (self::TARGETS as $target) {
            DB::table($target['table'])
                ->where($target['column'], $from)
                ->update([$target['column'] => $to]);
        }
    }

    /**
     * Mã bàn còn nằm rải trong `metadata` của sự kiện: `mergedFromTableKey`,
     * `targetTableKey`, `sourceTableKeys`, `movements[].fromTableKey`. Duyệt đệ quy
     * theo tên khoá thay vì liệt kê từng đường dẫn, để khoá mới thêm sau vẫn dính.
     */
    private function renameInMetadata(string $from, string $to): void
    {
        $rows = DB::table('tournament_live_events')
            ->whereNotNull('metadata')
            ->where('metadata', 'like', '%"'.$from.'"%')
            ->get(['id', 'metadata']);

        foreach ($rows as $row) {
            $metadata = json_decode((string) $row->metadata, true);

            if (! is_array($metadata)) {
                continue;
            }

            DB::table('tournament_live_events')
                ->where('id', $row->id)
                ->update([
                    'metadata' => json_encode(
                        $this->replaceTableKeys($metadata, $from, $to),
                        JSON_UNESCAPED_UNICODE,
                    ),
                ]);
        }
    }

    /**
     * Chỉ đụng vào giá trị nằm dưới khoá có đuôi `TableKey`/`TableKeys` (kể cả khi
     * là mảng), nên chuỗi khác trùng chữ "blue" trong metadata không bị đổi nhầm.
     *
     * @param  array<mixed>  $value
     * @return array<mixed>
     */
    private function replaceTableKeys(array $value, string $from, string $to): array
    {
        foreach ($value as $key => $item) {
            if (is_array($item)) {
                $value[$key] = $this->replaceTableKeys($item, $from, $to);

                continue;
            }

            if ($item !== $from || ! is_string($key)) {
                continue;
            }

            if (str_ends_with($key, 'TableKey') || str_ends_with($key, 'TableKeys')) {
                $value[$key] = $to;
            }
        }

        return $value;
    }
};
