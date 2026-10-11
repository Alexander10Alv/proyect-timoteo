'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRequireRole, AccessDenied } from '@/hooks/useRequireRole';
import { useAppStore } from '@/store';
import { CourseManager } from '@/components/admin/CourseManager';
import { DonationsTable } from '@/components/admin/DonationsTable';
import { UsersCenter } from '@/components/admin/UsersCenter';
import { ArticleManager } from '@/components/admin/ArticleManager';
import { SubscribersManager } from '@/components/admin/SubscribersManager';
import { MissionaryManager } from '@/components/admin/MissionaryManager';
import { SiteManager } from '@/components/admin/SiteManager';
import { Badge } from '@/components/ui';
import { BookOpen, HeartHandshake, Users, Bell, MapPin, Newspaper, Mail, Compass, Settings } from 'lucide-react';
import type { NotificationLogEntry } from '@/types';

type TabId = 'site' | 'wall' | 'donations' | 'users' | 'articles' | 'subscribers' | 'missionaries';

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: 'site', label: 'Inicio / Sitio', icon: Settings },
  { id: 'wall', label: 'Muro Educativo', icon: BookOpen },
  { id: 'articles', label: 'Artículos', icon: Newspaper },
  { id: 'missionaries', label: 'Misioneros', icon: Compass },
  { id: 'subscribers', label: 'Boletín', icon: Mail },
  { id: 'donations', label: 'Donaciones', icon: HeartHandshake },
  { id: 'users', label: 'Usuarios & WhatsApp', icon: Users },
];

export default function AdminPage() {
  const { isReady, isAuthorized, user } = useRequireRole('ADMIN');
  const [activeTab, setActiveTab] = React.useState<TabId>('wall');

  if (!isReady) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24">
        <div className="mx-auto h-8 w-48 animate-pulse rounded bg-dark-200 dark:bg-dark-700" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <AccessDenied />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <header className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-caption uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">
            Panel de Administración
          </p>
          <h1 className="mt-2 font-serif text-display-md font-semibold text-dark-900 dark:text-dark-100">
            Centro de Control
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/paises"
            className="inline-flex items-center gap-2 rounded-lg border-2 border-dark-300 px-4 py-2 text-body-sm font-medium text-dark-700 transition-colors hover:bg-dark-100 dark:border-dark-600 dark:text-dark-300 dark:hover:bg-dark-800"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Gestión de Países/Mapa
          </Link>
          <Badge variant="primary">{user?.role === 'ADMIN' ? 'Administrador' : 'Visitante'}</Badge>
          <span className="text-body-sm text-dark-500 dark:text-dark-400">{user?.email}</span>
        </div>
      </header>

      {/* Pestañas */}
      <div role="tablist" aria-label="Secciones del panel" className="mb-8 flex flex-wrap gap-2 border-b border-dark-200 dark:border-dark-800">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={
              activeTab === id
                ? '-mb-px flex items-center gap-2 border-b-2 border-primary-500 px-5 py-3 text-body-sm font-medium text-primary-700 dark:text-primary-300'
                : '-mb-px flex items-center gap-2 border-b-2 border-transparent px-5 py-3 text-body-sm font-medium text-dark-500 hover:text-dark-800 dark:text-dark-400 dark:hover:text-dark-200'
            }
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Contenido de la pestaña */}
      <section role="tabpanel" aria-label={TABS.find((t) => t.id === activeTab)?.label}>
      {activeTab === 'site' && <SiteManager />}
      {activeTab === 'wall' && <CourseManager />}
      {activeTab === 'articles' && <ArticleManager />}
      {activeTab === 'missionaries' && <MissionaryManager />}
      {activeTab === 'subscribers' && <SubscribersManager />}
      {activeTab === 'donations' && <DonationsTable />}
      {activeTab === 'users' && (
        <div className="space-y-10">
          <UsersCenter />
          <NotificationHistory />
        </div>
      )}
      </section>
    </div>
  );
}

/** Historial de envíos realizados desde este navegador (auditoría simple). */
function NotificationHistory() {
  const logs = useAppStore((s) => s.notificationLogs);

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-dark-300 px-8 py-12 text-center dark:border-dark-600">
        <Bell className="mx-auto mb-3 h-8 w-8 text-dark-300 dark:text-dark-600" aria-hidden="true" />
        <p className="text-body-md text-dark-500 dark:text-dark-400">
          Aún no se han enviado notificaciones en esta sesión.
        </p>
        <p className="mt-1 text-caption text-dark-400 dark:text-dark-500">
          Cada envío de WhatsApp/Email quedará registrado aquí con su resumen de entrega.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Historial de notificaciones enviadas">
      <h2 className="mb-4 font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
        Historial de Notificaciones
      </h2>
      <ul role="list" className="space-y-3">
        {logs.map((log: NotificationLogEntry) => (
          <li
            key={log.id}
            className="flex flex-col gap-1 rounded-lg border border-dark-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-dark-700"
          >
            <div>
              <p className="text-body-sm font-medium text-dark-900 dark:text-dark-100">
                {log.channel === 'WHATSAPP' ? 'WhatsApp' : 'Email'} · plantilla «{log.templateId}» →{' '}
                {log.recipientCount} destinatario(s)
              </p>
              <p className="mt-0.5 truncate text-caption text-dark-400 dark:text-dark-500">{log.message}</p>
            </div>
            <div className="flex items-center gap-3 text-caption text-dark-500 dark:text-dark-400">
              <span className="font-medium text-green-600 dark:text-green-400">✓ {log.totalSent}</span>
              {log.totalFailed > 0 && (
                <span className="font-medium text-red-500">✗ {log.totalFailed}</span>
              )}
              <Badge variant={log.mode === 'mock' ? 'warning' : 'success'} size="sm">{log.mode}</Badge>
              <time dateTime={new Date(log.createdAt).toISOString()}>
                {new Date(log.createdAt).toLocaleTimeString('es-ES')}
              </time>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}