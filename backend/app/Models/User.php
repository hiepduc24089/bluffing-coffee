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
     * Tài khoản vỏ kéo từ POS365 về chưa có ai đăng nhập: có BP, có lịch sử,
     * nhưng chưa có mật khẩu. Người chơi "nhận" nó bằng số điện thoại + OTP.
     */
    public function isClaimed(): bool
    {
        // Mốc quyết định là "có mật khẩu đăng nhập được hay không", chứ không
        // phải `claimed_at` — admin tạo thành viên tay cũng là tài khoản dùng
        // được ngay. `claimed_at` chỉ ghi lại thời điểm, không dùng để chặn.
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
