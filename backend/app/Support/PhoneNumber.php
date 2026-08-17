<?php

namespace App\Support;

/**
 * Chuẩn hoá số điện thoại về E.164 Việt Nam để so khớp giữa hai hệ thống.
 *
 * Số nhập ở quầy POS365 và số thành viên tự khai không bao giờ cùng một dạng:
 * "0912345678", "+84912345678", "0912 345 678", "84.912.345.678" đều là một
 * người. So khớp bằng chuỗi thô sẽ tạo ra trùng lặp giả, nên mọi phép so khớp
 * đều đi qua đây.
 */
class PhoneNumber
{
    private const COUNTRY_CODE = '84';

    /**
     * Trả về dạng "+84912345678", hoặc null nếu không nhận dạng được — số không
     * nhận dạng được phải đi vào hàng đợi đối soát tay chứ không được đoán bừa.
     */
    public static function normalize(?string $raw): ?string
    {
        if ($raw === null) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $raw) ?? '';

        if ($digits === '') {
            return null;
        }

        // "84912345678" — đã có mã quốc gia.
        if (str_starts_with($digits, self::COUNTRY_CODE)) {
            $national = substr($digits, strlen(self::COUNTRY_CODE));

            return self::isValidNational($national)
                ? '+'.self::COUNTRY_CODE.$national
                : null;
        }

        // "0912345678" — dạng nội địa quen thuộc nhất.
        if (str_starts_with($digits, '0')) {
            $national = substr($digits, 1);

            return self::isValidNational($national)
                ? '+'.self::COUNTRY_CODE.$national
                : null;
        }

        // "912345678" — đã bỏ số 0 đầu.
        return self::isValidNational($digits)
            ? '+'.self::COUNTRY_CODE.$digits
            : null;
    }

    /**
     * Dạng nội địa "0988111222" — thứ người Việt đọc, gõ và dùng để đăng nhập.
     *
     * Số từ POS365 về có thể mang bất kỳ định dạng nào thu ngân gõ vào
     * ("0988 111 222", "+84988111222"). Lưu nguyên chuỗi đó vào `users.phone`
     * là hỏng đăng nhập, vì đăng nhập so khớp chuỗi chính xác.
     */
    public static function toLocal(?string $raw): ?string
    {
        $e164 = self::normalize($raw);

        return $e164 === null
            ? null
            : '0'.substr($e164, strlen(self::COUNTRY_CODE) + 1);
    }

    /**
     * Phần sau mã quốc gia: di động Việt Nam là 9 chữ số, cố định có thể 9 hoặc
     * 10. Ngoài khoảng đó thì gần như chắc chắn là gõ nhầm.
     */
    private static function isValidNational(string $national): bool
    {
        $length = strlen($national);

        return $length >= 9
            && $length <= 10
            && ! str_starts_with($national, '0');
    }
}
