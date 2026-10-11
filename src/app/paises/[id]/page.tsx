import type { Metadata } from 'next';
import { CountryPageContent } from './CountryPageContent';

interface PageProps {
  params: { id: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  const decoded = decodeURIComponent(params.id);
  return {
    title: `Perfil de ${decoded}`,
    description: 'Perfil misionero del país según datos del Joshua Project',
  };
}

export default function CountryPage({ params }: PageProps) {
  return <CountryPageContent countryId={params.id} />;
}