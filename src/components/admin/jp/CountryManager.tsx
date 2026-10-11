'use client';

import * as React from 'react';
import { Button, Card, Input, Modal, ConfirmModal, Badge } from '@/components/ui';
import { Plus, Pencil, Trash2, Flag, Users, Building2, Church, Search } from 'lucide-react';
import { ImageUploader } from './ImageUploader';

interface CountryRow {
  countryCode: string;
  countryName: string;
  totalPeopleGroups: number;
  unreachedPeopleGroups: number;
  unreachedPct: number;
  frontierPeopleGroups: number;
  frontierPct: number;
  totalPopulation: number;
  unreachedPopulation: number;
  frontierPopulation: number;
  christianAdherentsPct: number;
  evangelicalPct: number;
  flagUrl?: string;
  heroImage?: string;
  peopleGroupsCount: number;
  provincesCount: number;
  ministriesCount: number;
}

interface FormState {
  countryCode: string;
  countryName: string;
  flagUrl: string;
  heroImage: string;
  totalPeopleGroups: string;
  unreachedPeopleGroups: string;
  unreachedPct: string;
  frontierPeopleGroups: string;
  frontierPct: string;
  totalPopulation: string;
  unreachedPopulation: string;
  frontierPopulation: string;
  christianAdherentsPct: string;
  evangelicalPct: string;
}

const EMPTY_FORM: FormState = {
  countryCode: '',
  countryName: '',
  flagUrl: '',
  heroImage: '',
  totalPeopleGroups: '',
  unreachedPeopleGroups: '',
  unreachedPct: '',
  frontierPeopleGroups: '',
  frontierPct: '',
  totalPopulation: '',
  unreachedPopulation: '',
  frontierPopulation: '',
  christianAdherentsPct: '',
  evangelicalPct: '',
};

export function CountryManager() {
  const [items, setItems] = React.useState<CountryRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingCode, setEditingCode] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<CountryRow | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [flash, setFlash] = React.useState('');
  const [query, setQuery] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/admin/countries', { credentials: 'same-origin' });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setLoadError(err?.error ?? `Error HTTP ${res.status}.`);
        setItems([]);
        return;
      }
      const data = (await res.json()) as { countries: CountryRow[] };
      setItems(data.countries ?? []);
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
    setEditingCode(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (c: CountryRow) => {
    setEditingCode(c.countryCode);
    setForm({
      countryCode: c.countryCode,
      countryName: c.countryName,
      flagUrl: c.flagUrl ?? '',
      heroImage: c.heroImage ?? '',
      totalPeopleGroups: String(c.totalPeopleGroups),
      unreachedPeopleGroups: String(c.unreachedPeopleGroups),
      unreachedPct: String(c.unreachedPct),
      frontierPeopleGroups: String(c.frontierPeopleGroups),
      frontierPct: String(c.frontierPct),
      totalPopulation: String(c.totalPopulation),
      unreachedPopulation: String(c.unreachedPopulation),
      frontierPopulation: String(c.frontierPopulation),
      christianAdherentsPct: String(c.christianAdherentsPct),
      evangelicalPct: String(c.evangelicalPct),
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.countryName || form.countryName.length < 2) {
      setFormError('El nombre del país es obligatorio (mínimo 2 caracteres).');
      return;
    }
    if (!/^[A-Z]{2}$/.test(form.countryCode)) {
      setFormError('Código ISO-2 inválido (ej. "PE", "IN").');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        countryCode: form.countryCode.toUpperCase(),
      };
      const res = await fetch(editingCode ? `/api/admin/countries/${editingCode}` : '/api/admin/countries', {
        method: editingCode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setFormError(err?.error ?? 'Error al guardar el país.');
        return;
      }
      setFormOpen(false);
      setFlash(editingCode ? `País ${form.countryName} actualizado.` : `País ${form.countryName} creado.`);
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
      const res = await fetch(`/api/admin/countries/${deleting.countryCode}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setFlash(err?.error ?? 'Error al eliminar el país.');
        setDeleting(null);
        setDeleteLoading(false);
        return;
      }
      setFlash(`País ${deleting.countryName} eliminado.`);
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

  const filteredItems = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return items.filter(
      (c) => norm(c.countryName).includes(norm(q)) || c.countryCode.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-caption uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">Países</p>
          <h3 className="mt-1 font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
            Gestión de Países
          </h3>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo País
        </Button>
      </div>

      <div className="mb-5 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar país por nombre o código (ej. Perú, PE)…"
            aria-label="Buscar país"
            className="w-full rounded-lg border border-dark-300 bg-white py-2.5 pl-10 pr-4 text-dark-900 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-900 dark:text-dark-100 dark:placeholder-dark-500"
          />
        </div>
        <p className="mt-1.5 text-caption text-dark-500 dark:text-dark-400">
          {query.trim()
            ? `${filteredItems.length} de ${items.length} países`
            : `${items.length} países`}
        </p>
      </div>

      {flash && (
        <p role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-body-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
          {flash}
        </p>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-dark-200/60 dark:bg-dark-700/60" />
          ))}
        </div>
      ) : loadError ? (
        <Card className="p-6">
          <p role="alert" className="text-body-sm text-red-600 dark:text-red-400">{loadError}</p>
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center">
          <Flag className="mx-auto mb-3 h-8 w-8 text-dark-300 dark:text-dark-600" aria-hidden="true" />
          <p className="text-body-md text-dark-500 dark:text-dark-400">Aún no hay países registrados.</p>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="p-10 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-dark-300 dark:text-dark-600" aria-hidden="true" />
          <p className="text-body-md text-dark-500 dark:text-dark-400">
            No se encontraron países para «{query.trim()}».
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((c) => (
            <Card key={c.countryCode} className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-body-sm font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                    {c.countryCode}
                  </div>
                  <div>
                    <p className="font-serif text-body-lg font-semibold text-dark-900 dark:text-dark-100">{c.countryName}</p>
                    <p className="text-caption text-dark-400 dark:text-dark-500">
                      Población: {formatNum(c.totalPopulation)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)} aria-label={`Editar ${c.countryName}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(c)} aria-label={`Eliminar ${c.countryName}`}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge variant="outline" className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" aria-hidden="true" /> {c.peopleGroupsCount} grupos
                </Badge>
                <Badge variant="outline" className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" aria-hidden="true" /> {c.provincesCount} prov.
                </Badge>
                <Badge variant="outline" className="inline-flex items-center gap-1">
                  <Church className="h-3 w-3" aria-hidden="true" /> {c.ministriesCount} min.
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-dark-100 pt-3 text-caption text-dark-500 dark:border-dark-800 dark:text-dark-400">
                <span>Alcanzables: {c.unreachedPeopleGroups} ({c.unreachedPct}%)</span>
                <span>Cristianos: {c.christianAdherentsPct}%</span>
                <span>Frontera: {c.frontierPeopleGroups} ({c.frontierPct}%)</span>
                <span>Evangélicos: {c.evangelicalPct}%</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingCode ? `Editar ${form.countryName}` : 'Nuevo País'}
        description="Datos oficiales del país (estructura Joshua Project)."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Código ISO-2"
              value={form.countryCode}
              onChange={(e) => setForm({ ...form, countryCode: e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase() })}
              maxLength={2}
              disabled={!!editingCode}
              required
              placeholder="PE"
            />
            <Input
              label="Nombre del país"
              value={form.countryName}
              onChange={(e) => setForm({ ...form, countryName: e.target.value })}
              required
              placeholder="Perú"
            />
          </div>

          <ImageUploader
            label="Bandera"
            folder="flags"
            value={form.flagUrl}
            onChange={(url) => setForm({ ...form, flagUrl: url })}
          />

          <ImageUploader
            label="Imagen principal del país (banner)"
            folder="countries"
            value={form.heroImage}
            onChange={(url) => setForm({ ...form, heroImage: url })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Total de grupos étnicos" type="number" value={form.totalPeopleGroups} onChange={(e) => setForm({ ...form, totalPeopleGroups: e.target.value })} />
            <Input label="Grupos no alcanzados" type="number" value={form.unreachedPeopleGroups} onChange={(e) => setForm({ ...form, unreachedPeopleGroups: e.target.value })} />
            <Input label="% No alcanzados" type="number" step="0.1" value={form.unreachedPct} onChange={(e) => setForm({ ...form, unreachedPct: e.target.value })} />
            <Input label="Grupos frontera" type="number" value={form.frontierPeopleGroups} onChange={(e) => setForm({ ...form, frontierPeopleGroups: e.target.value })} />
            <Input label="% Frontera" type="number" step="0.1" value={form.frontierPct} onChange={(e) => setForm({ ...form, frontierPct: e.target.value })} />
            <Input label="% Adherentes cristianos" type="number" step="0.1" value={form.christianAdherentsPct} onChange={(e) => setForm({ ...form, christianAdherentsPct: e.target.value })} />
            <Input label="% Evangélicos" type="number" step="0.1" value={form.evangelicalPct} onChange={(e) => setForm({ ...form, evangelicalPct: e.target.value })} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Población total" type="number" value={form.totalPopulation} onChange={(e) => setForm({ ...form, totalPopulation: e.target.value })} />
            <Input label="Población no alcanzada" type="number" value={form.unreachedPopulation} onChange={(e) => setForm({ ...form, unreachedPopulation: e.target.value })} />
            <Input label="Población frontera" type="number" value={form.frontierPopulation} onChange={(e) => setForm({ ...form, frontierPopulation: e.target.value })} />
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
              {editingCode ? 'Guardar cambios' : 'Crear país'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar país"
        message={`¿Eliminar ${deleting?.countryName}? Se eliminarán también sus ${deleting?.peopleGroupsCount} grupos étnicos y ${deleting?.provincesCount} provincias asociadas. Esta acción no se puede deshacer.`}
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