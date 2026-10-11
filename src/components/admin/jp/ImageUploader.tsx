'use client';

import * as React from 'react';
import { Button, Input } from '@/components/ui';
import { Upload } from 'lucide-react';

type Folder = 'flags' | 'people-groups' | 'countries';

interface ImageUploaderProps {
  label: string;
  folder: Folder;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

export function ImageUploader({ label, folder, value, onChange, placeholder = 'https://...' }: ImageUploaderProps) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('folder', folder);
      const res = await fetch('/api/admin/upload', { method: 'POST', body, credentials: 'same-origin' });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        setError(data?.error ?? `Error al subir la imagen (HTTP ${res.status}).`);
        return;
      }
      onChange(data.url);
    } catch {
      setError('Error de conexión al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const canPreview = value && /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" loading={uploading} onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" aria-hidden="true" />
          {uploading ? 'Subiendo…' : 'Subir imagen'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
          disabled={uploading}
        />
        <span className="text-xs text-dark-500 dark:text-dark-400">
          {label} · JPG, PNG o WebP · máx 5 MB<br />
          o pega la URL externa:
        </span>
      </div>

      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        </div>
        {canPreview && (
          <img
            src={value}
            alt={label}
            className="h-11 w-16 shrink-0 rounded-md border border-dark-200 object-cover dark:border-dark-700"
          />
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}