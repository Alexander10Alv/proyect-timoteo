'use client';

import * as React from 'react';
import { Button, Card, Input, Select, Modal, ConfirmModal } from '@/components/ui';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';

interface CountryOption {
  countryCode: string;
  countryName: string;
}

interface ProvinceRow {
  provinceId: string;
  provinceName: string;
  countryCode: string;
  countryName: string | null;
  population?: number;
  unreachedCount?: number | null;
}

interface FormState {
  provinceId: string;
  provinceName: string;
  countryCode: string;
  population: string;
  unreachedCount: string;
}

const EMPTY_FORM: FormState = {
  provinceId: '',
  provinceName: '',
  countryCode: '',
  population: '',
  unreachedCount: '',
};

export function ProvinceManager() {
  const [items, setItems] = React.useState<ProvinceRow[]>([]);
  const [countries, setCountries] = React.useState<CountryOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<ProvinceRow | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [flash, setFlash] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/admin/provinces', { credentials: 'same-origin' }),
        fetch('/api/admin/countries', { credentials: 'same-origin' }),
      ]);
      if (!pRes.ok || !cRes.ok) {
        setLoadError('Error cargando datos.');
        setItems([]);
        return;
      }
      const pData = (await pRes.json()) as { provinces: ProvinceRow[] };
      const cData = (await cRes.json()) as { countries: CountryOption[] };
      setItems(pData.provinces ?? []);
      setCountries((cData.countries ?? []).map((c) => ({ countryCode: c.countryCode, countryName: c.countryName })));
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
    setForm({ ...EMPTY_FORM, countryCode: countries[0]?.countryCode ?? '' });
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (p: ProvinceRow) => {
    setEditingId(p.provinceId);
    setForm({
      provinceId: p.provinceId,
      provinceName: p.provinceName,
      countryCode: p.countryCode,
      population: p.population != null ? String(p.population) : '',
      unreachedCount: p.unreachedCount != null ? String(p.unreachedCount) : '',
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.provinceName || !form.countryCode) {
      setFormError('El nombre de la provincia y el país son obligatorios.');
      return;
    }
    if (!editingId && !form.provinceId) {
      setFormError('El ID de provincia es obligatorio al crear (ej. "PE.UCY").');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const url = editingId ? `/api/admin/provinces/${encodeURIComponent(editingId)}` : '/api/admin/provinces';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setFormError(err?.error ?? 'Error al guardar la provincia.');
        return;
      }
      setFormOpen(false);
      setFlash(editingId ? `Provincia ${form.provinceName} actualizada.` : `Provincia ${form.provinceName} creada.`);
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
      const res = await fetch(`/api/admin/provinces/${encodeURIComponent(deleting.provinceId)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setFlash(err?.error ?? 'Error al eliminar la provincia.');
        setDeleting(null);
        setDeleteLoading(false);
        return;
      }
      setFlash(`Provincia ${deleting.provinceName} eliminada.`);
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
          <p className="text-caption uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">Provincias</p>
          <h3 className="mt-1 font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
            Gestión de Provincias
          </h3>
        </div>
        <Button onClick={openCreate} disabled={countries.length === 0}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nueva Provincia
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
          <Building2 className="mx-auto mb-3 h-8 w-8 text-dark-300 dark:text-dark-600" aria-hidden="true" />
          <p className="text-body-md text-dark-500 dark:text-dark-400">Aún no hay provincias registradas.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-dark-200 dark:border-dark-700">
          <table className="w-full min-w-[640px] text-left text-body-sm">
            <thead className="bg-dark-50 dark:bg-dark-800/60 text-dark-500 dark:text-dark-400">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Provincia</th>
                <th className="px-4 py-3 font-medium">País</th>
                <th className="px-4 py-3 font-medium">Población</th>
                <th className="px-4 py-3 font-medium">No alcanzados</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100 dark:divide-dark-800">
              {items.map((p) => (
                <tr key={p.provinceId} className="hover:bg-dark-50 dark:hover:bg-dark-800/40">
                  <td className="px-4 py-3 font-mono text-xs text-dark-500 dark:text-dark-400">{p.provinceId}</td>
                  <td className="px-4 py-3 font-medium text-dark-900 dark:text-dark-100">{p.provinceName}</td>
                  <td className="px-4 py-3 text-dark-600 dark:text-dark-300">
                    {p.countryCode} · {p.countryName ?? ''}
                  </td>
                  <td className="px-4 py-3 text-dark-600 dark:text-dark-300">
                    {p.population != null ? formatNum(p.population) : '—'}
                  </td>
                  <td className="px-4 py-3 text-dark-600 dark:text-dark-300">{p.unreachedCount ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)} aria-label={`Editar ${p.provinceName}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleting(p)} aria-label={`Eliminar ${p.provinceName}`}>
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
        title={editingId ? `Editar ${form.provinceName}` : 'Nueva Provincia'}
        description="Provincia/estado del país dentro de la estructura Joshua Project."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="ID de provincia"
              value={form.provinceId}
              onChange={(e) => setForm({ ...form, provinceId: e.target.value })}
              disabled={!!editingId}
              required={!editingId}
              placeholder="PE.UCY"
              helperText={editingId ? 'No editable.' : 'Formato: ISO-2 + punto + código (ej. IN.BR).'}
            />
            <Input
              label="Nombre de la provincia"
              value={form.provinceName}
              onChange={(e) => setForm({ ...form, provinceName: e.target.value })}
              required
              placeholder="Ucayali"
            />
          </div>

          <Select
            label="País (ISO-2)"
            value={form.countryCode}
            onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
            options={countries.map((c) => ({ value: c.countryCode, label: `${c.countryCode} — ${c.countryName}` }))}
            placeholder="Selecciona un país"
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Población" type="number" value={form.population} onChange={(e) => setForm({ ...form, population: e.target.value })} />
            <Input label="Grupos no alcanzados" type="number" value={form.unreachedCount} onChange={(e) => setForm({ ...form, unreachedCount: e.target.value })} />
          </div>

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
              {editingId ? 'Guardar cambios' : 'Crear provincia'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar provincia"
        message={`¿Eliminar la provincia ${deleting?.provinceName} (${deleting?.provinceId})? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}

function formatNum(n: number): string {
  return new Intl.NumberFormat('es-PE').format(n);
}