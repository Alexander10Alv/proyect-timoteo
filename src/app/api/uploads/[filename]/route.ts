import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * GET /api/uploads/[filename]
 * Sirve las imágenes subidas desde el directorio del servidor (UPLOAD_DIR).
 * Funciona en desarrollo y producción sin depender del rebuild de /public.
 */

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

interface RouteParams {
  params: { filename: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    // Solo nombres seguros: evita path traversal (.., /, \).
    const filename = params.filename;
    if (!/^[A-Za-z0-9._-]+$/.test(filename) || filename.includes('..')) {
      return NextResponse.json({ error: 'Nombre de archivo inválido.' }, { status: 400 });
    }

    const ext = path.extname(filename).toLowerCase();
    const contentType = CONTENT_TYPES[ext];
    if (!contentType) {
      return NextResponse.json({ error: 'Tipo de archivo no soportado.' }, { status: 400 });
    }

    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    const data = await readFile(path.join(uploadDir, filename));

    // ?download=1 fuerza la descarga (documentos); por defecto inline (portadas).
    const url = new URL(_request.url);
    const forceDownload = url.searchParams.get('download') === '1';

    // ?name=... define el nombre con el que se descarga el archivo
    // (si no trae extensión, se toma la del archivo almacenado).
    const rawName = url.searchParams.get('name')?.trim() ?? '';
    let downloadName = rawName.replace(/[\\/:*?"<>|\x00-\x1F]/g, '').trim();
    if (!downloadName) downloadName = filename;
    if (!path.extname(downloadName)) downloadName += ext;

    const asciiFallback = downloadName.replace(/[^\x20-\x7E]/g, '_');

    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${forceDownload ? 'attachment' : 'inline'}; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Imagen no encontrada.' }, { status: 404 });
  }
}