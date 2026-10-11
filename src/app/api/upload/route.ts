import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * POST /api/upload
 * Recibe un archivo (multipart/form-data, campo "file") — imágenes de portada
 * o documentos descargables (PDF, PPT, DOC) — lo guarda en el servidor y
 * devuelve la ruta pública para guardarla en la BD.
 *
 * Directorio destino configurable con UPLOAD_DIR en .env
 * (por defecto: <proyecto>/uploads). Sirve igual en desarrollo y producción.
 */

const MAX_SIZE_BYTES = 65 * 1024 * 1024; // 65 MB

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'application/pdf': '.pdf',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
    }

    let ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      // Fallback por extensión del nombre (algunos navegadores no envían MIME correcto).
      const nameExt = path.extname(file.name).toLowerCase();
      if (Object.values(ALLOWED_TYPES).includes(nameExt)) ext = nameExt;
    }
    if (!ext) {
      return NextResponse.json(
        { error: 'Formato no permitido. Usa JPG, PNG, WebP, GIF, MP4, PDF, PPT o DOC.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'El archivo supera el límite de 65 MB.' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;

    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), bytes);

    // Ruta pública servida por /api/uploads/[filename] — persiste en producción.
    return NextResponse.json({ url: `/api/uploads/${filename}` }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/upload]', error);
    return NextResponse.json({ error: 'Error interno al subir la imagen.' }, { status: 500 });
  }
}