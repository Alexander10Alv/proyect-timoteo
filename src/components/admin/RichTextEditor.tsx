'use client';

import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Heading2,
  Heading3,
  Link2,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder = 'Escribe el contenido aquí…', className }: RichTextEditorProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = React.useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-xl my-4 max-w-full h-auto' },
      }),
      Placeholder.configure({ placeholder }),
      Subscript,
      Superscript,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sincroniza el editor cuando el valor se resetea externamente
  // (nuevo artículo / edición) sin disparar onChange.
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className={cn('rounded-lg border border-dark-300 p-4 dark:border-dark-600', className)}>
        <div className="h-40 animate-pulse rounded bg-dark-100 dark:bg-dark-800" />
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'No se pudo subir la imagen.');
      editor.chain().focus().setImage({ src: data.url }).run();
      onChange(editor.getHTML());
    } catch (err) {
      console.error('[RichTextEditor] subida de imagen', err);
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLink = () => {
    const url = window.prompt('URL del enlace:');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const ToolbarButton = ({
    onClick,
    label,
    active,
    disabled,
    children,
  }: {
    onClick: () => void;
    label: string;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-dark-600 transition-colors hover:bg-dark-100 disabled:opacity-40 dark:text-dark-300 dark:hover:bg-dark-800',
        active && 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn('overflow-hidden rounded-lg border border-dark-300 dark:border-dark-600', className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-dark-200 bg-dark-50 px-2 py-1.5 dark:border-dark-700 dark:bg-dark-900">
        <ToolbarButton label="Deshacer" disabled={!editor.can().chain().focus().undo().run()}
          onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Rehacer" disabled={!editor.can().chain().focus().redo().run()}
          onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-dark-200 dark:bg-dark-700" aria-hidden="true" />

        <ToolbarButton label="Negrita" active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Cursiva" active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Título H2" active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Subtítulo H3" active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-dark-200 dark:bg-dark-700" aria-hidden="true" />

        <ToolbarButton label="Lista con viñetas" active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Lista numerada" active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Cita" active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Código" active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code2 className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Línea divisoria"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-dark-200 dark:bg-dark-700" aria-hidden="true" />

        <ToolbarButton label="Subíndice" active={editor.isActive('subscript')}
          onClick={() => editor.chain().focus().toggleSubscript().run()}>
          <SubscriptIcon className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Superíndice" active={editor.isActive('superscript')}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}>
          <SuperscriptIcon className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Enlace" active={editor.isActive('link')} onClick={handleLink}>
          <Link2 className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Subir imagen" disabled={imageUploading} onClick={() => fileInputRef.current?.click()}>
          {imageUploading
            ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-dark-300 border-t-primary-500" aria-hidden="true" />
            : <ImageIcon className="h-4 w-4" aria-hidden="true" />}
        </ToolbarButton>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageUpload} aria-label="Subir imagen al contenido" />
      </div>

      <EditorContent editor={editor} className="prose-custom min-h-[280px] px-4 py-3" />
    </div>
  );
}