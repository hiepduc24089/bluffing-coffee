<?php

namespace App\Support\Pos365;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Client HTTP cho POS365.
 *
 * POS365 không có API key cũng không có OAuth: đăng nhập bằng tài khoản người
 * dùng để lấy `SessionId`, rồi gửi kèm mọi request dưới dạng cookie `ss-id`.
 * Phiên có hạn nhưng POS365 không nói là bao lâu, nên lớp này vừa đặt hạn ngắn
 * ở phía mình vừa bắt 401 để đăng nhập lại giữa chừng.
 */
class Pos365Client
{
    public function isConfigured(): bool
    {
        return $this->baseUrl() !== ''
            && (string) $this->username() !== ''
            && (string) $this->password() !== '';
    }

    /**
     * @param  array<string, mixed>  $query
     * @return array<mixed>
     */
    public function get(string $path, array $query = []): array
    {
        return $this->send('GET', $path, $query);
    }

    /**
     * @param  array<string, mixed>  $body
     * @param  array<string, mixed>  $query
     * @return array<mixed>
     */
    public function post(string $path, array $body = [], array $query = []): array
    {
        return $this->send('POST', $path, $query, $body);
    }

    /**
     * @param  array<string, mixed>  $query
     * @param  array<string, mixed>|null  $body
     * @return array<mixed>
     */
    private function send(string $method, string $path, array $query = [], ?array $body = null): array
    {
        $response = $this->dispatch($method, $path, $query, $body, $this->session());

        // Phiên hết hạn giữa chừng: đăng nhập lại đúng một lần rồi thử lại.
        if ($response->status() === 401) {
            $this->forgetSession();
            $response = $this->dispatch($method, $path, $query, $body, $this->session());
        }

        if (! $response->successful()) {
            throw Pos365Exception::requestFailed($method, $path, $response->status(), $response->body());
        }

        $decoded = $response->json();

        if (! is_array($decoded)) {
            throw Pos365Exception::unexpectedPayload($path, 'không phải JSON dạng mảng hoặc đối tượng');
        }

        return $decoded;
    }

    /**
     * @param  array<string, mixed>  $query
     * @param  array<string, mixed>|null  $body
     */
    private function dispatch(string $method, string $path, array $query, ?array $body, string $session): Response
    {
        // POS365 chỉ trả JSON khi được yêu cầu tường minh; thiếu tham số này nó
        // trả HTML của giao diện web.
        $query['format'] = 'json';

        $request = $this->http()->withHeaders(['Cookie' => 'ss-id='.$session]);

        return $method === 'GET'
            ? $request->get($this->url($path), $query)
            : $request->withQueryParameters($query)->post($this->url($path), $body ?? []);
    }

    private function session(): string
    {
        $cached = Cache::get($this->cacheKey());

        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $session = $this->login();

        Cache::put(
            $this->cacheKey(),
            $session,
            now()->addMinutes((int) config('pos365.session_ttl_minutes', 30)),
        );

        return $session;
    }

    public function forgetSession(): void
    {
        Cache::forget($this->cacheKey());
    }

    /**
     * Đăng nhập có thử lại: POS365 thi thoảng trả response thiếu `SessionId` dù
     * thông tin đăng nhập đúng, gọi lại vài giây sau thì bình thường.
     */
    private function login(): string
    {
        if (! $this->isConfigured()) {
            throw Pos365Exception::notConfigured();
        }

        $attempts = max(1, (int) config('pos365.login_attempts', 3));
        $delayMs = max(0, (int) config('pos365.retry_delay_ms', 1500));

        for ($attempt = 1; $attempt <= $attempts; $attempt++) {
            $response = $this->http()->get($this->url('/api/auth/credentials'), [
                'Username' => $this->username(),
                'Password' => $this->password(),
                'format' => 'json',
            ]);

            $session = $response->successful() ? $response->json('SessionId') : null;

            if (is_string($session) && $session !== '') {
                return $session;
            }

            Log::warning('POS365: đăng nhập thất bại', [
                'attempt' => $attempt,
                'status' => $response->status(),
            ]);

            if ($attempt < $attempts && $delayMs > 0) {
                usleep($delayMs * 1000);
            }
        }

        throw Pos365Exception::loginFailed($attempts);
    }

    private function http(): PendingRequest
    {
        return Http::acceptJson()
            ->timeout((int) config('pos365.timeout', 30))
            ->withoutRedirecting();
    }

    private function url(string $path): string
    {
        return $this->baseUrl().'/'.ltrim($path, '/');
    }

    private function cacheKey(): string
    {
        return (string) config('pos365.session_cache_key', 'pos365:session');
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('pos365.base_url'), '/');
    }

    private function username(): ?string
    {
        return config('pos365.username');
    }

    private function password(): ?string
    {
        return config('pos365.password');
    }
}
