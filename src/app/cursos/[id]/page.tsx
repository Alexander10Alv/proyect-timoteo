import type { Metadata } from 'next';
import { CoursePageContent } from './CoursePageContent';

interface PageProps {
  params: { id: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  return {
    title: 'Reproductor de curso',
    description: 'Clases y grabaciones del curso en la plataforma Proyecto Timoteo',
  };
}

export default function CursoDetallePage({ params }: PageProps) {
  return <CoursePageContent courseId={params.id} />;
}