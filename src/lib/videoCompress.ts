export const VIDEO_UPLOAD_LIMIT_BYTES = 65 * 1024 * 1024;

/**
 * Devuelve el archivo tal cual si no es video o si no supera el umbral.
 * Si es video y supera el umbral, lo re-encodifica EN EL NAVEGADOR (ffmpeg.wasm)
 * a MP4 1080p (H.264 CRF 28) para que pese poco al guardarlo en el servidor.
 * onCompressStart se invoca justo antes de iniciar la compresión.
 */
export async function compressVideoIfNeeded(file: File, onCompressStart?: () => void): Promise<File> {
  if (!file.type.startsWith('video/') || file.size <= VIDEO_UPLOAD_LIMIT_BYTES) return file;
  onCompressStart?.();
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const { toBlobURL, fetchFile } = await import('@ffmpeg/util');
  const ffmpeg = new FFmpeg();
  const coreBase = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${coreBase}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${coreBase}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    await ffmpeg.writeFile('input.mp4', await fetchFile(file));
    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-vf',
      'scale=min(1920\\,iw):-2',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '28',
      '-c:a',
      'aac',
      '-b:a',
      '96k',
      '-movflags',
      '+faststart',
      'output.mp4',
    ]);
    const data = await ffmpeg.readFile('output.mp4');
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const copy = Uint8Array.from(bytes);
    const name = file.name.replace(/\.[^.]+$/, '').concat('.mp4');
    return new File([copy], name, { type: 'video/mp4' });
  } finally {
    ffmpeg.terminate();
  }
}