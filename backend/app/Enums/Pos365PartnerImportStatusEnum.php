<?php

namespace App\Enums;

/**
 * Kết quả xử lý một khách hàng kéo về từ POS365.
 *
 * Chỉ `MissingPhone` là cần người can thiệp. Ba trạng thái còn lại là kết cục
 * đã xong, giữ lại để đối chiếu khi có tranh cãi về BP.
 */
enum Pos365PartnerImportStatusEnum: string
{
    /** Vừa kéo về, chưa xử lý xong. Chỉ tồn tại trong lúc chạy một lô. */
    case Pending = 'pending';

    /** Đã tạo tài khoản vỏ mới bên Bluffing. */
    case Imported = 'imported';

    /** Số điện thoại trùng thành viên đã có — gắn thêm partner vào người đó. */
    case Linked = 'linked';

    /** Thu ngân tạo khách không nhập số điện thoại, không biết là ai. */
    case MissingPhone = 'missing_phone';

    /** Admin xác nhận bỏ qua: khách vãng lai, bản ghi rác, hoặc trùng đã gộp tay. */
    case Ignored = 'ignored';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Chờ xử lý',
            self::Imported => 'Đã tạo tài khoản',
            self::Linked => 'Đã gắn vào thành viên có sẵn',
            self::MissingPhone => 'Thiếu số điện thoại',
            self::Ignored => 'Bỏ qua',
        };
    }

    /**
     * Trạng thái còn chờ người xử lý — dùng cho badge đếm việc ở màn admin.
     */
    public function needsAttention(): bool
    {
        return $this === self::MissingPhone || $this === self::Pending;
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
