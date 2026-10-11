'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Ruta legada: /dashboard redirige a /admin. */
export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-body-md text-dark-500 dark:text-dark-400">Redirigiendo al panel de administración…</p>
    </div>
  );
}