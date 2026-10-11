import type { Metadata } from 'next';
import { MissionaryPageContent } from './MissionaryPageContent';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const base = apiUrl ?? `http://localhost:${process.env.PORT ?? '3000'}`;

  try {
    const res = await fetch(`${base}/api/missionaries/${params.slug}`, { cache: 'no-store' });
    if (!res.ok) {
      return { title: 'Misionero no encontrado · Proyecto Timoteo' };
    }
    const data = (await res.json()) as { missionary: { name: string; role?: string | null } };
    return {
      title: `${data.missionary.name} · Proyecto Timoteo`,
      description: data.missionary.role ?? undefined,
    };
  } catch {
    return { title: 'Misionero · Proyecto Timoteo' };
  }
}

export default function MisioneroDetallePage({ params }: PageProps) {
  return <MissionaryPageContent slug={params.slug} />;
}