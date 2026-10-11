'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, selectIsAdmin } from '@/store';
import { ShieldAlert } from 'lucide-react';
import type { UserRole } from '@/types';

/**
 * Hook de protección de rutas por rol.
 * - `requireRole='ADMIN'` restringe el contenido a administradores.
 * - `requireRole='VISITOR'` exige sesión iniciada (cualquier rol).
 *
 * Devuelve `isReady` cuando la hidratación del store terminó para evitar
 * parpadeos de redirección en SSR.
 */
export function useRequireRole(requireRole: UserRole = 'VISITOR') {
  const router = useRouter();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const user = useAppStore((s) => s.user);
  const isAdmin = useAppStore(selectIsAdmin);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    // Espera a la rehidratación de Zustand/persist antes de decidir.
    const unsub = useAppStore.persist.onFinishHydration(() => setIsReady(true));
    if (useAppStore.persist.hasHydrated()) setIsReady(true);
    return () => {
      unsub();
    };
  }, []);

  React.useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (requireRole === 'ADMIN' && !isAdmin) {
      router.replace('/login?error=forbidden');
    }
  }, [isReady, isAuthenticated, isAdmin, requireRole, router]);

  return {
    isReady,
    isAuthorized: isAuthenticated && (requireRole === 'VISITOR' || isAdmin),
    user,
  };
}

/** Pantalla de acceso denegado reutilizable. */
export function AccessDenied({ message }: { message?: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <span className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <ShieldAlert className="h-7 w-7 text-red-600 dark:text-red-400" aria-hidden="true" />
      </span>
      <h1 className="font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
        Acceso denegado
      </h1>
      <p className="mt-3 text-body-md text-dark-500 dark:text-dark-400">
        {message ?? 'No tienes permisos para acceder a esta sección. Esta área está reservada para administradores.'}
      </p>
    </div>
  );
}