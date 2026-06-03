<?php

namespace App\DTOs;

readonly class PhoneLoginDTO
{
    public function __construct(
        public string $phone,
        public string $password,
    ) {
    }

    /**
     * @param array{phone: string, password: string} $payload
     */
    public static function fromArray(array $payload): self
    {
        return new self(
            phone: $payload['phone'],
            password: $payload['password'],
        );
    }
}
