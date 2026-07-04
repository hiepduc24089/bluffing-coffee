<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSettingImageRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class SettingImageController extends Controller
{
    public function store(StoreSettingImageRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $path = $request->file('image')->store($validated['directory'], 'public');

        return response()->json([
            'data' => [
                'path' => $path,
                'publicPath' => "/storage/{$path}",
                'url' => Storage::disk('public')->url($path),
            ],
        ]);
    }
}
