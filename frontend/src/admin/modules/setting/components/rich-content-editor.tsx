import { useEffect, useRef } from 'react';

type RichContentEditorProps = {
  value?: string | null;
  onChange: (value: string) => void;
  uploadImage: (file: File) => Promise<string>;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function insertHtml(html: string) {
  document.execCommand('insertHTML', false, html);
}

export function RichContentEditor({ value, onChange, uploadImage }: RichContentEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || editor.innerHTML === (value ?? '')) return;
    editor.innerHTML = value ?? '';
  }, [value]);

  return (
    <div
      ref={editorRef}
      className="rich-content-editor"
      contentEditable
      role="textbox"
      aria-label="Nội dung"
      onInput={(event) => onChange(event.currentTarget.innerHTML)}
      onPaste={async (event) => {
        const clipboardItems = Array.from(event.clipboardData.items);
        const imageItems = clipboardItems.filter((item) => item.type.startsWith('image/'));

        if (imageItems.length === 0) {
          const text = event.clipboardData.getData('text/plain');
          if (!text) return;

          event.preventDefault();
          insertHtml(escapeHtml(text).replace(/\n/g, '<br>'));
          onChange(editorRef.current?.innerHTML ?? '');
          return;
        }

        event.preventDefault();
        for (const item of imageItems) {
          const file = item.getAsFile();
          if (!file) continue;

          const imageUrl = await uploadImage(file);
          insertHtml(`<img src="${imageUrl}" alt="" />`);
        }
        onChange(editorRef.current?.innerHTML ?? '');
      }}
      suppressContentEditableWarning
    />
  );
}
