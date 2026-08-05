<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

class HtmlSanitizer
{
    /**
     * @var array<string, list<string>>
     */
    private const ALLOWED_ATTRIBUTES = [
        'a' => ['href', 'title', 'target', 'rel'],
        'img' => ['src', 'alt', 'title'],
        'blockquote' => ['cite'],
    ];

    /**
     * @var list<string>
     */
    private const ALLOWED_TAGS = [
        'a',
        'blockquote',
        'br',
        'div',
        'em',
        'h2',
        'h3',
        'h4',
        'img',
        'li',
        'ol',
        'p',
        'span',
        'strong',
        'ul',
    ];

    /**
     * @var list<string>
     */
    private const DROP_WITH_CONTENT_TAGS = ['iframe', 'script', 'style'];

    public static function clean(?string $html): ?string
    {
        if ($html === null || trim($html) === '') {
            return null;
        }

        $document = new DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);
        $document->loadHTML(
            '<?xml encoding="UTF-8"><div id="content-root">'.$html.'</div>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD,
        );
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $root = $document->getElementById('content-root');
        if (! $root) {
            return null;
        }

        self::sanitizeChildren($root);

        $clean = '';
        foreach ($root->childNodes as $child) {
            $clean .= $document->saveHTML($child);
        }

        return trim($clean) === '' ? null : trim($clean);
    }

    private static function sanitizeChildren(DOMNode $node): void
    {
        foreach (iterator_to_array($node->childNodes) as $child) {
            if ($child instanceof DOMElement) {
                self::sanitizeElement($child);
                continue;
            }

            self::sanitizeChildren($child);
        }
    }

    private static function sanitizeElement(DOMElement $element): void
    {
        $tag = strtolower($element->tagName);

        if (in_array($tag, self::DROP_WITH_CONTENT_TAGS, true)) {
            $element->parentNode?->removeChild($element);
            return;
        }

        if (! in_array($tag, self::ALLOWED_TAGS, true)) {
            self::unwrapElement($element);
            return;
        }

        self::sanitizeAttributes($element, $tag);
        self::sanitizeChildren($element);
    }

    private static function sanitizeAttributes(DOMElement $element, string $tag): void
    {
        $allowedAttributes = self::ALLOWED_ATTRIBUTES[$tag] ?? [];

        foreach (iterator_to_array($element->attributes) as $attribute) {
            $name = strtolower($attribute->name);
            $value = trim($attribute->value);

            if (! in_array($name, $allowedAttributes, true)) {
                $element->removeAttribute($attribute->name);
                continue;
            }

            if (in_array($name, ['href', 'src', 'cite'], true) && ! self::isAllowedUrl($value)) {
                $element->removeAttribute($attribute->name);
            }
        }

        if ($tag === 'a' && $element->hasAttribute('href')) {
            $element->setAttribute('rel', 'noopener noreferrer');
        }
    }

    private static function isAllowedUrl(string $url): bool
    {
        $normalized = strtolower($url);

        if (str_starts_with($normalized, 'javascript:') || str_starts_with($normalized, 'data:')) {
            return false;
        }

        if (str_starts_with($normalized, 'https://')) {
            return filter_var($url, FILTER_VALIDATE_URL) !== false;
        }

        return str_starts_with($url, '/storage/') || preg_match('/\A[A-Za-z0-9][A-Za-z0-9._~\/-]*\z/', $url) === 1;
    }

    private static function unwrapElement(DOMElement $element): void
    {
        $parent = $element->parentNode;
        if (! $parent) {
            return;
        }

        while ($element->firstChild) {
            $parent->insertBefore($element->firstChild, $element);
        }

        $parent->removeChild($element);
    }
}
