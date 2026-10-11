/**
 * Convierte URLs de video (YouTube, Google Drive, MP4 directo) en
 * la forma correcta para reproducir dentro de la vista de curso.
 */

export type VideoKind = 'youtube' | 'drive' | 'mp4' | 'link';

export interface VideoSource {
  kind: VideoKind;
  embedSrc?: string;
  originalUrl: string;
  canEmbed: boolean;
}

export function resolveVideoSource(rawUrl: string): VideoSource {
  const url = rawUrl.trim();
  const lower = url.toLowerCase();

  // ── YouTube ──
  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    return {
      kind: 'youtube',
      embedSrc: `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`,
      originalUrl: url,
      canEmbed: true,
    };
  }

  // ── Google Drive (/file/d/{id}/view u open?id={id}) ──
  const driveId = extractDriveId(url);
  if (driveId) {
    return {
      kind: 'drive',
      embedSrc: `https://drive.google.com/file/d/${driveId}/preview`,
      originalUrl: url,
      canEmbed: true,
    };
  }

  // ── Video directo (MP4/WebM/Ogg) ──
  if (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/.test(lower)) {
    return { kind: 'mp4', embedSrc: url, originalUrl: url, canEmbed: true };
  }

  // Mega, Vimeo privado, Zoom, etc.: no se puede embeber → abrir externo.
  return { kind: 'link', originalUrl: url, canEmbed: false };
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/i,
    /(?:youtu\.be\/)([\w-]{11})/i,
    /(?:youtube\.com\/embed\/)([\w-]{11})/i,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/i,
    /(?:youtube\.com\/live\/)([\w-]{11})/i,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(url);
    if (match) return match[1];
  }
  return null;
}

function extractDriveId(url: string): string | null {
  const patterns = [
    /drive\.google\.com\/file\/d\/([\w-]+)/i,
    /drive\.google\.com\/open\?id=([\w-]+)/i,
    /drive\.google\.com\/uc\?id=([\w-]+)/i,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(url);
    if (match) return match[1];
  }
  return null;
}

/** Formatea segundos a "1 h 23 min" o "12:45". */
export function formatDuration(totalSeconds?: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours} h ${minutes} min`;
  }
  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')} min`;
  }
  return `${seconds} s`;
}