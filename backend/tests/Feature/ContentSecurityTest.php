<?php

namespace Tests\Feature;

use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ContentSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_content_page_html_is_sanitized_before_storage(): void
    {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/admin/content-pages', [
            'type' => 'post',
            'title' => 'Security Post',
            'coverImage' => 'settings/posts/cover.jpg',
            'content' => '<p onclick="alert(1)">Hello <script>alert(1)</script><img src="data:image/svg+xml;base64,abc" onerror="alert(1)"></p>',
            'isPublished' => true,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.content', '<p>Hello <img></p>');

        $this->assertDatabaseHas('content_pages', [
            'title' => 'Security Post',
            'content' => '<p>Hello <img></p>',
        ]);
    }

    public function test_data_uri_images_are_rejected(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/admin/content-pages', [
            'type' => 'post',
            'title' => 'Bad Cover',
            'coverImage' => 'data:image/svg+xml;base64,abc',
            'content' => '<p>Hello</p>',
            'isPublished' => true,
        ])->assertUnprocessable();

        $this->postJson('/api/admin/banners', [
            'title' => 'Bad Banner',
            'image' => 'data:image/svg+xml;base64,abc',
        ])->assertUnprocessable();
    }

    private function actingAsAdmin(): void
    {
        Sanctum::actingAs(Admin::factory()->create(), ['admin']);
    }
}
