import type { Metadata } from 'next';
import { ArticlePageContent } from './ArticlePageContent';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const base = apiUrl ?? `http://localhost:${process.env.PORT ?? '3000'}`;

  try {
    const res = await fetch(`${base}/api/articles/slug/${params.slug}`, { cache: 'no-store' });
    if (!res.ok) {
      return { title: 'Artículo no encontrado · Proyecto Timoteo' };
    }
    const data = (await res.json()) as { article: { title: string; excerpt?: string | null } };
    return {
      title: `${data.article.title} · Proyecto Timoteo`,
      description: data.article.excerpt ?? undefined,
    };
  } catch {
    return { title: 'Artículo · Proyecto Timoteo' };
  }
}

export default function ArticuloDetallePage({ params }: PageProps) {
  return <ArticlePageContent slug={params.slug} />;
}