'use client';

import * as React from 'react';
import { Button, Card, Input, Select, Modal, ConfirmModal, Badge } from '@/components/ui';
import { Plus, Pencil, Trash2, Church } from 'lucide-react';

interface CountryOption {
  countryCode: string;
  countryName: string;
}

interface PeopleGroupOption {
  peopCode: string;
  peopleName: string;
}

interface MinistryRow {
  id: number;
  ministryName: string;
  ministryType?: string | null;
  countryCode?: string | null;
  countryName?: string | null;
  peopCode?: string | null;
  contactInfo?: string | null;
}

interface FormState {
  ministryName: string;
  ministryType: string;
  countryCode: string;
  peopCode: string;
  contactInfo: string;
}

const EMPTY_FORM: FormState = {
  ministryName: '',
  ministryType: '',
  countryCode: '',
  peopCode: '',
  contactInfo: '',
};

export function MinistryManager() {
  const [items, setItems] = React.useState<MinistryRow[]>([]);
  const [countries, setCountries] = React.useState<CountryOption[]>([]);
  const [groups, setGroups] = React.useState<PeopleGroupOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<MinistryRow | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [flash, setFlash] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [mRes, cRes, gRes] = await Promise.all([
        fetch('/api/admin/ministries', { credentials: 'same-origin' }),
        fetch('/api/admin/countries', { credentials: 'same-origin' }),
        fetch('/api/admin/people-groups', { credentials: 'same-origin' }),
      ]);
      if (!mRes.ok || !cRes.ok || !gRes.ok) {
        setLoadError('Error cargando datos.');
        setItems([]);
        return;
      }
      const mData = (await mRes.json()) as { ministries: MinistryRow[] };
      const cData = (await cRes.json()) as { countries: CountryOption[] };
      const gData = (await gRes.json()) as { peopleGroups: PeopleGroupOption[] };
      setItems(mData.ministries ?? []);
      setCountries((cData.countries ?? []).map((c) => ({ countryCode: c.countryCode, countryName: c.countryName })));
      setGroups((gData.peopleGroups ?? []).map((g) => ({ peopCode: g.peopCode, peopleName: g.peopleName })));
    } catch {
      setLoadError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (m: MinistryRow) => {
    setEditingId(m.id);
    setForm({
      ministryName: m.ministryName,
      ministryType: m.ministryType ?? '',
      countryCode: m.countryCode ?? '',
      peopCode: m.peopCode ?? '',
      contactInfo: m.contactInfo ?? '',
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ministryName) {
      setFormError('El nombre del ministerio es obligatorio.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        countryCode: form.countryCode || null,
        peopCode: form.peopCode || null,
      };
      const url = editingId != null ? `/api/admin/ministries/${editingId}` : '/api/admin/ministries';
      const res = await fetch(url, {
        method: editingId != null ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setFormError(err?.error ?? 'Error al guardar el ministerio.');
        return;
      }
      setFormOpen(false);
      setFlash(editingId != null ? `Ministerio ${form.ministryName} actualizado.` : `Ministerio ${form.ministryName} creado.`);
      void load();
    } catch {
      setFormError('Error de conexión con el servidor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/ministries/${deleting.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setFlash(err?.error ?? 'Error al eliminar el ministerio.');
        setDeleting(null);
        setDeleteLoading(false);
        return;
      }
      setFlash(`Ministerio ${deleting.ministryName} eliminado.`);
      setDeleting(null);
      void load();
    } catch {
      setFlash('Error de conexión al eliminar.');
    } finally {
      setDeleteLoading(false);
    }
  };

  React.useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(''), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-caption uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">Ministerios</p>
          <h3 className="mt-1 font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
            Gestión de Ministerios
          </h3>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo Ministerio
        </Button>
      </div>

      {flash && (
        <p role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-body-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
          {flash}
        </p>
      )}

      {loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-dark-200/60 dark:bg-dark-700/60" />
      ) : loadError ? (
        <Card className="p-6">
          <p role="alert" className="text-body-sm text-red-600 dark:text-red-400">{loadError}</p>
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center">
          <Church className="mx-auto mb-3 h-8 w-8 text-dark-300 dark:text-dark-600" aria-hidden="true" />
          <p className="text-body-md text-dark-500 dark:text-dark-400">Aún no hay ministerios registrados.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-dark-200 dark:border-dark-700">
          <table className="w-full min-w-[640px] text-left text-body-sm">
            <thead className="bg-dark-50 dark:bg-dark-800/60 text-dark-500 dark:text-dark-400">
              <tr>
                <th className="px-4 py-3 font-medium">Ministerio</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">País</th>
                <th className="px-4 py-3 font-medium">Grupo étnico</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100 dark:divide-dark-800">
              {items.map((m) => (
                <tr key={m.id} className="hover:bg-dark-50 dark:hover:bg-dark-800/40">
                  <td className="px-4 py-3 font-medium text-dark-900 dark:text-dark-100">{m.ministryName}</td>
                  <td className="px-4 py-3 text-dark-600 dark:text-dark-300">
                    {m.ministryType ? <Badge size="sm" variant="outline">{m.ministryType}</Badge> : '—'}
                  </td>
                  <td className="px-4 py-3 text-dark-600 dark:text-dark-300">
                    {m.countryCode ? `${m.countryCode} — ${m.countryName ?? ''}` : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-dark-500 dark:text-dark-400">{m.peopCode ?? '—'}</td>
                  <td className="px-4 py-3 text-dark-600 dark:text-dark-300">{m.contactInfo ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(m)} aria-label={`Editar ${m.ministryName}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleting(m)} aria-label={`Eliminar ${m.ministryName}`}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId != null ? `Editar ${form.ministryName}` : 'Nuevo Ministerio'}
        description="Ministerio u obra misionera ligada opcionalmente a un país y a un grupo étnico."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombre del ministerio"
              value={form.ministryName}
              onChange={(e) => setForm({ ...form, ministryName: e.target.value })}
              required
              placeholder="Traducción bíblica Amazonía"
            />
            <Input
              label="Tipo (opcional)"
              value={form.ministryType}
              onChange={(e) => setForm({ ...form, ministryType: e.target.value })}
              placeholder="Traducción"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="País (opcional)"
              value={form.countryCode}
              onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
              options={[
                { value: '', label: 'Sin país' },
                ...countries.map((c) => ({ value: c.countryCode, label: `${c.countryCode} — ${c.countryName}` })),
              ]}
            />
            <Select
              label="Grupo étnico (opcional)"
              value={form.peopCode}
              onChange={(e) => setForm({ ...form, peopCode: e.target.value })}
              options={[
                { value: '', label: 'Sin grupo' },
                ...groups.map((g) => ({ value: g.peopCode, label: `${g.peopCode} — ${g.peopleName}` })),
              ]}
            />
          </div>

          <Input
            label="Contacto (opcional)"
            value={form.contactInfo}
            onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
            placeholder="amazonia@heartcry.org"
          />

          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-body-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editingId != null ? 'Guardar cambios' : 'Crear ministerio'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar ministerio"
        message={`¿Eliminar el ministerio ${deleting?.ministryName}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}