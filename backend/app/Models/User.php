<?php

namespace App\Models;

use App\Enums\UserRoleEnum;
use App\Support\PhoneNumber;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'phone',
        'role',
        'password',
        'bp_balance',
        'rank_level',
        'claimed_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'role' => UserRoleEnum::class,
            'password' => 'hashed',
            'bp_balance' => 'integer',
            'claimed_at' => 'datetime',
            'last_seen_at' => 'datetime',
        ];
    }

    /**
     * `phone_e164` luôn được suy ra từ `phone`, không bao giờ gán tay — nếu để
     * hai cột trôi khỏi nhau thì việc khớp hội viên với khách POS365 sẽ hỏng âm
     * thầm. Vì vậy cột này cũng không nằm trong $fillable.
     */
    protected function phone(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value) => [
                'phone' => $value,
                'phone_e164' => PhoneNumber::normalize($value),
            ],
        );
    }

    /**
     * Người chơi đã tự đăng nhập vào tài khoản này lần nào chưa.
     *
     * Tài khoản kéo từ POS365 về đăng nhập được ngay (mật khẩu mặc định là số
     * điện thoại), nên "có mật khẩu" không còn phân biệt được gì. Mốc bây giờ
     * là `claimed_at` — được đóng dấu ở lần đăng nhập thành công đầu tiên.
     *
     * Đây cũng là ranh giới quyền sở hữu hồ sơ: chưa nhận thì quầy sửa gì trên
     * POS365 thành viên đi theo, nhận rồi thì tên hiển thị là của người chơi.
     */
    public function isClaimed(): bool
    {
        return $this->claimed_at !== null;
    }

    /**
     * Hàng ngũ cũ: tài khoản kéo về trước khi có mật khẩu mặc định. Migration
     * đã cấp mật khẩu cho tất cả, nên đây chỉ còn là chốt chặn cho bản ghi lọt
     * lưới (khôi phục từ bản sao lưu cũ, seed tay).
     */
    public function hasPassword(): bool
    {
        return $this->password !== null;
    }

    public function pos365Partners(): HasMany
    {
        return $this->hasMany(UserPos365Partner::class);
    }

    public function bpTransactions(): HasMany
    {
        return $this->hasMany(BpTransaction::class);
    }

    public function tournamentRegistrations(): HasMany
    {
        return $this->hasMany(TournamentRegistration::class);
    }

    public function statistic(): HasOne
    {
        return $this->hasOne(UserStatistic::class);
    }

    public function badges(): BelongsToMany
    {
        return $this->belongsToMany(Badge::class, 'user_badges')
            ->withPivot('earned_at');
    }
}
