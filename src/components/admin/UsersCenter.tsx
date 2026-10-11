'use client';

import * as React from 'react';
import { useAppStore } from '@/store';
import { Button, Card, Select, Badge, Input } from '@/components/ui';
import { formatDate, getPostTypeLabel } from '@/lib/utils';
import { MessageCircle, Mail, Users, Send } from 'lucide-react';
import type { SubscriptionStatus, UserRole } from '@/types';
import { WhatsAppModal } from '@/components/modals/WhatsAppModal';
import { EmailModal } from '@/components/modals/EmailModal';

interface UserRow {
  userId: string;
  name: string;
  lastName?: string;
  email: string;
  phone?: string;
  country?: string;
  church?: string;
  role: UserRole;
  enrolledCourses: string[];
  receiveWhatsApp: boolean;
  receiveEmail: boolean;
  status: SubscriptionStatus;
  subscriptionId: string | null;
  memberSince: Date;
}

interface UsersCenterFilters {
  country: string;
  role: string;
  courseId: string;
  channel: string;
  status: string;
}

const EMPTY_FILTERS: UsersCenterFilters = {
  country: '',
  role: '',
  courseId: '',
  channel: '',
  status: '',
};

export function UsersCenter() {
  const users = useAppStore((s) => s.users);
  const subscriptions = useAppStore((s) => s.subscriptions);
  const courses = useAppStore((s) => s.courses);
  const countries = useAppStore((s) => s.countries);
  const updateSubscriptionStatus = useAppStore((s) => s.updateSubscriptionStatus);
  const fetchUsers = useAppStore((s) => s.fetchUsers);
  const usersLoading = useAppStore((s) => s.usersLoading);
  const usersError = useAppStore((s) => s.usersError);

  // Carga SIEMPRE datos reales de MySQL vía /api/users.
  React.useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const [filters, setFilters] = React.useState<UsersCenterFilters>(EMPTY_FILTERS);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [whatsappOpen, setWhatsappOpen] = React.useState(false);
  const [emailOpen, setEmailOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  // Une usuarios con sus suscripciones en una sola vista.
  const rows: UserRow[] = React.useMemo(
    () =>
      users.map((u) => {
        const sub = subscriptions.find((s) => s.userId === u.id);
        return {
          userId: u.id,
          name: u.name,
          lastName: u.lastName,
          email: u.email,
          phone: u.phone ?? sub?.phone,
          country: u.country,
          church: u.church,
          role: u.role,
          enrolledCourses: sub?.enrolledCourses ?? [],
          receiveWhatsApp: sub?.receiveWhatsApp ?? false,
          receiveEmail: sub?.receiveEmail ?? false,
          status: sub?.status ?? 'PENDING',
          subscriptionId: sub?.id ?? null,
          memberSince: u.createdAt,
        };
      }),
    [users, subscriptions]
  );

  const filtered = React.useMemo(() => {
    return rows.filter((r) => {
      if (filters.country && r.country !== filters.country) return false;
      if (filters.role && r.role !== filters.role) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.courseId && !r.enrolledCourses.includes(filters.courseId)) return false;
      if (filters.channel === 'WHATSAPP' && !r.receiveWhatsApp) return false;
      if (filters.channel === 'EMAIL' && !r.receiveEmail) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !r.name.toLowerCase().includes(q) &&
          !r.email.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [rows, filters, search]);

  // Candidatos para WhatsApp: todos los usuarios (el modal permite elegir todos o selectivo).
  const whatsappCandidates = React.useMemo(
    () => rows.map((r) => ({ userId: r.userId, name: r.name, phone: r.phone, email: r.email })),
    [rows]
  );
  const whatsappSelectable = whatsappCandidates.filter((c) => (c.phone ?? '').trim().length > 0).length;

  // Candidatos para correo: todos con email válido (el modal permite elegir todos o selectivo).
  const emailCandidates = React.useMemo(
    () => rows.map((r) => ({ userId: r.userId, name: r.name, email: r.email, phone: r.phone })),
    [rows]
  );
  const emailSelectable = emailCandidates.filter((c) => (c.email ?? '').trim().includes('@')).length;

  const allVisibleSelected = filtered.length > 0 && filtered.every((r) => selectedIds.has(r.userId));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filtered.forEach((r) => next.delete(r.userId));
      } else {
        filtered.forEach((r) => next.add(r.userId));
      }
      return next;
    });
  };

  const toggleOne = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const courseOptions = React.useMemo(
    () => [
      { value: '', label: 'Cualquiera' },
      ...courses.map((p) => ({ value: p.id, label: `${getPostTypeLabel(p.type)}: ${p.title.slice(0, 40)}${p.title.length > 40 ? '…' : ''}` })),
    ],
    [courses]
  );

  const hasActiveFilters = Object.values(filters).some((v) => v !== '') || search.trim() !== '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
            Usuarios y Notificaciones
          </h2>
          <p className="text-body-sm text-dark-500 dark:text-dark-400">
            {users.length} registrados · {subscriptions.filter((s) => s.receiveWhatsApp).length} activaron WhatsApp ·{' '}
            {filtered.length} visibles
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setEmailOpen(true)} disabled={emailSelectable === 0}>
            <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
            Enviar correo ({emailSelectable})
          </Button>
          <Button onClick={() => setWhatsappOpen(true)} disabled={whatsappSelectable === 0}>
            <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
            Enviar WhatsApp ({whatsappSelectable})
          </Button>
        </div>
      </div>

      {/* Filtros avanzados */}
      <Card padding="md">
        {usersError && (
          <p role="alert" className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-body-sm text-amber-700 dark:text-amber-300">
            {usersError}
          </p>
        )}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Users className="h-4 w-4 text-primary-500" aria-hidden="true" />
          <h3 className="text-body-sm font-semibold uppercase tracking-wide text-dark-500 dark:text-dark-400">
            Filtros avanzados
          </h3>
          {hasActiveFilters && (
            <button
              onClick={() => { setFilters(EMPTY_FILTERS); setSearch(''); }}
              className="ml-auto text-caption font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <Input
            label="Buscar"
            placeholder="Nombre o email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            label="País"
            options={[
              { value: '', label: 'Todos' },
              ...countries.map((c) => ({ value: c.code, label: c.name })),
            ]}
            value={filters.country}
            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
          />
          <Select
            label="Rol"
            options={[
              { value: '', label: 'Todos' },
              { value: 'ADMIN', label: 'Administrador' },
              { value: 'VISITOR', label: 'Visitante' },
            ]}
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          />
          <Select
            label="Curso/Boletín inscrito"
            options={courseOptions}
            value={filters.courseId}
            onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
          />
          <Select
            label="Canal de contacto"
            options={[
              { value: '', label: 'Cualquiera' },
              { value: 'WHATSAPP', label: 'WhatsApp habilitado' },
              { value: 'EMAIL', label: 'Email habilitado' },
            ]}
            value={filters.channel}
            onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
          />
          <Select
            label="Estado suscripción"
            options={[
              { value: '', label: 'Todos' },
              { value: 'ACTIVE', label: 'Activa' },
              { value: 'PENDING', label: 'Pendiente' },
              { value: 'INACTIVE', label: 'Inactiva' },
            ]}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          />
        </div>

        {selectedIds.size > 0 && (
          <p className="mt-4 border-t border-dark-100 pt-4 text-body-sm text-dark-600 dark:border-dark-800 dark:text-dark-300">
            <Send className="mr-1.5 inline h-3.5 w-3.5 text-primary-500" aria-hidden="true" />
            {selectedIds.size} usuario(s) seleccionado(s). El envío de WhatsApp usará tu selección; si no hay selección, se enviará a todo el grupo filtrado con WhatsApp habilitado.
            <button onClick={() => setSelectedIds(new Set())} className="ml-3 font-medium text-primary-600 hover:underline dark:text-primary-400">
              Deseleccionar todo
            </button>
          </p>
        )}
      </Card>

      {/* Tabla de usuarios */}
      <Card padding="none" className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="border-b border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800/50">
              <th scope="col" className="w-12 px-5 py-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAll}
                  aria-label="Seleccionar todos los usuarios visibles"
                  className="h-4 w-4 rounded border-dark-300 accent-[#c87a4a]"
                />
              </th>
              {['Usuario', 'Iglesia', 'Teléfono', 'País', 'Cursos inscritos', 'Canales', 'Estado', 'Miembro desde', ''].map((th) => (
                <th key={th} scope="col" className="whitespace-nowrap px-5 py-3 text-caption font-semibold uppercase tracking-wide text-dark-500 dark:text-dark-400">
                  {th}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.userId} className="border-b border-dark-100 last:border-0 hover:bg-dark-50/60 dark:border-dark-800 dark:hover:bg-dark-800/40">
                <td className="px-5 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r.userId)}
                    onChange={() => toggleOne(r.userId)}
                    aria-label={`Seleccionar a ${r.name}`}
                    className="h-4 w-4 rounded border-dark-300 accent-[#c87a4a]"
                  />
                </td>
                <td className="px-5 py-4">
                  <p className="text-body-sm font-medium text-dark-900 dark:text-dark-100">{r.name}{r.lastName ? ` ${r.lastName}` : ''}</p>
                  <p className="text-caption text-dark-400 dark:text-dark-500">{r.email}</p>
                </td>
                <td className="px-5 py-4 text-body-sm text-dark-600 dark:text-dark-300">{r.church ?? '—'}</td>
                <td className="px-5 py-4 font-mono text-body-sm text-dark-600 dark:text-dark-300">{r.phone ?? '—'}</td>
                <td className="px-5 py-4 text-body-sm text-dark-600 dark:text-dark-300">
                  {countries.find((c) => c.code === r.country)?.name ?? r.country ?? '—'}
                </td>
                <td className="max-w-[240px] px-5 py-4">
                  {r.enrolledCourses.length === 0 ? (
                    <span className="text-caption italic text-dark-400">Ninguno</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {r.enrolledCourses.slice(0, 2).map((id) => (
                        <Badge key={id} variant="primary" size="sm">
                          {courses.find((p) => p.id === id)?.title.slice(0, 24) ?? id}
                        </Badge>
                      ))}
                      {r.enrolledCourses.length > 2 && (
                        <Badge variant="outline" size="sm">+{r.enrolledCourses.length - 2}</Badge>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1">
                    {r.receiveWhatsApp && <Badge variant="success" size="sm">WA</Badge>}
                    {r.receiveEmail && <Badge variant="primary" size="sm">@</Badge>}
                    {!r.receiveWhatsApp && !r.receiveEmail && <span className="text-caption italic text-dark-400">—</span>}
                  </div>
                </td>
                <td className="px-5 py-4"><SubscriptionStatusBadge status={r.status} /></td>
                <td className="whitespace-nowrap px-5 py-4 text-caption text-dark-400 dark:text-dark-500">
                  {formatDate(r.memberSince)}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => {
                      if (!r.subscriptionId) return;
                      updateSubscriptionStatus(r.subscriptionId, r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
                    }}
                    disabled={!r.subscriptionId}
                    className="text-caption font-medium text-primary-600 hover:underline disabled:opacity-40 disabled:no-underline dark:text-primary-400"
                  >
                    {r.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {usersLoading ? (
          <p className="px-8 py-14 text-center text-body-md text-dark-500 dark:text-dark-400">
            Cargando usuarios desde la base de datos…
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-8 py-14 text-center text-body-md text-dark-500 dark:text-dark-400">
            {users.length === 0
              ? 'Aún no hay usuarios registrados en la base de datos.'
              : 'No hay usuarios que coincidan con los filtros actuales.'}
          </p>
        ) : null}
      </Card>

      <WhatsAppModal
        isOpen={whatsappOpen}
        onClose={() => setWhatsappOpen(false)}
        candidates={whatsappCandidates}
        preselectedIds={selectedIds.size > 0 ? Array.from(selectedIds) : undefined}
      />

      <EmailModal
        isOpen={emailOpen}
        onClose={() => setEmailOpen(false)}
        candidates={emailCandidates}
        preselectedIds={selectedIds.size > 0 ? Array.from(selectedIds) : undefined}
      />
    </div>
  );
}

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  const map: Record<SubscriptionStatus, { label: string; variant: 'success' | 'warning' | 'default' }> = {
    ACTIVE: { label: 'Activa', variant: 'success' },
    PENDING: { label: 'Pendiente', variant: 'warning' },
    INACTIVE: { label: 'Inactiva', variant: 'default' },
  };
  const cfg = map[status];
  return <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>;
}