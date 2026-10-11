import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { requireAdmin } from '@/lib/session';

/**
 * POST /api/admin/upload
 * Sube una imagen (jpg/png/webp, máx 5 MB) desde el computador para el CRUD
 * Joshua Project (banderas de países / fotos de grupos étnicos).
 * Guarda en public/uploads/{flags|people-groups|countries} y devuelve la ruta
 * estática (/uploads/...). Protegido por sesión admin (requireAdmin).
 */

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const FOLDERS = {
  flags: path.join(process.cwd(), 'public', 'uploads', 'flags'),
  'people-groups': path.join(process.cwd(), 'public', 'uploads', 'people-groups'),
  countries: path.join(process.cwd(), 'public', 'uploads', 'countries'),
} as const;

type FolderKey = keyof typeof FOLDERS;

const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folder = String(formData.get('folder') ?? '');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
    }
    if (folder !== 'flags' && folder !== 'people-groups' && folder !== 'countries') {
      return NextResponse.json({ error: 'Carpeta destino inválida.' }, { status: 400 });
    }

    let ext = IMAGE_TYPES[file.type];
    if (!ext) {
      const nameExt = path.extname(String(file.name ?? '')).toLowerCase();
      if (Object.values(IMAGE_TYPES).includes(nameExt)) ext = nameExt;
    }
    if (!ext) {
      return NextResponse.json({ error: 'Formato no permitido. Usa JPG, PNG o WebP.' }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'La imagen supera el límite de 5 MB.' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    const originalBase = path.basename(String(file.name ?? ''), path.extname(String(file.name ?? ''))) || 'imagen';
    const baseName = originalBase.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40);
    const filename = `${Date.now()}-${baseName}${ext}`;

    const dir = FOLDERS[folder as FolderKey];
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);

    return NextResponse.json({ url: `/uploads/${folder}/${filename}` }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/upload]', error);
    return NextResponse.json({ error: 'Error interno al subir la imagen.' }, { status: 500 });
  }
}