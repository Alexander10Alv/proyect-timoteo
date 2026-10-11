'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRequireRole, AccessDenied } from '@/hooks/useRequireRole';
import { useAppStore } from '@/store';
import { Badge } from '@/components/ui';
import { CountryManager } from '@/components/admin/jp/CountryManager';
import { PeopleGroupManager } from '@/components/admin/jp/PeopleGroupManager';
import { ProvinceManager } from '@/components/admin/jp/ProvinceManager';
import { MinistryManager } from '@/components/admin/jp/MinistryManager';
import { LanguageManager } from '@/components/admin/jp/LanguageManager';
import { Flag, Users, Building2, Church, Languages, ArrowLeft } from 'lucide-react';

type TabId = 'countries' | 'groups' | 'provinces' | 'ministries' | 'languages';

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: 'countries', label: 'Países', icon: Flag },
  { id: 'groups', label: 'Grupos Étnicos', icon: Users },
  { id: 'languages', label: 'Idiomas', icon: Languages },
  { id: 'provinces', label: 'Provincias', icon: Building2 },
  { id: 'ministries', label: 'Ministerios', icon: Church },
];

export default function AdminPaisesPage() {
  const { isReady, isAuthorized, user } = useRequireRole('ADMIN');
  const [activeTab, setActiveTab] = React.useState<TabId>('countries');
  const userEmail = useAppStore((s) => s.user?.email);

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
      <header className="mb-8">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-dark-500 transition-colors hover:text-primary-600 dark:text-dark-400 dark:hover:text-primary-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al Panel de Admin
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-caption uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">
              Joshua Project · Estructura Mundial
            </p>
            <h1 className="mt-2 font-serif text-display-md font-semibold text-dark-900 dark:text-dark-100">
              Gestión de Países y Grupos
            </h1>
            <p className="mt-2 max-w-2xl text-body-sm text-dark-500 dark:text-dark-400">
              CRUD de la estructura Joshua Project (países, grupos étnicos, provincias y ministerios).
              Esta página es solo de administración: el mapa del home y la página pública /paises
              siguen siendo 100% públicos.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="primary">Administrador</Badge>
            <span className="text-body-sm text-dark-500 dark:text-dark-400">{userEmail ?? user?.email}</span>
          </div>
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Entidades administrativas"
        className="mb-8 flex flex-wrap gap-2 border-b border-dark-200 dark:border-dark-800"
      >
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

      <section role="tabpanel" aria-label={TABS.find((t) => t.id === activeTab)?.label}>
        {activeTab === 'countries' && <CountryManager />}
        {activeTab === 'groups' && <PeopleGroupManager />}
        {activeTab === 'languages' && <LanguageManager />}
        {activeTab === 'provinces' && <ProvinceManager />}
        {activeTab === 'ministries' && <MinistryManager />}
      </section>
    </div>
  );
}