'use client';

import * as React from 'react';
import { Button, Card, Input, Textarea, Select, Modal, ConfirmModal, Badge } from '@/components/ui';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { ImageUploader } from './ImageUploader';

interface CountryOption {
  countryCode: string;
  countryName: string;
}

interface LanguageOption {
  languageCode: string;
  languageName: string;
}

interface PeopleGroupRow {
  id: string;
  peopCode: string;
  countryCode: string;
  countryName: string | null;
  peopleName: string;
  populationInCountry: number;
  populationGlobal?: number;
  isUnreached: boolean;
  isFrontier: boolean;
  isIndigenous: boolean;
  isDiaspora: boolean;
  primaryLanguage: string;
  primaryLanguageCode?: string | null;
  primaryReligion: string;
  evangelicalPct?: number | null;
  percentAdherents?: number | null;
  progressScale?: number | null;
  workersNeeded?: number | null;
  countOfCountries?: number | null;
  provinceRegion?: string | null;
  description?: string | null;
  photoUrl?: string | null;
}

interface FormState {
  peopCode: string;
  countryCode: string;
  peopleName: string;
  populationInCountry: string;
  populationGlobal: string;
  isUnreached: boolean;
  isFrontier: boolean;
  isIndigenous: boolean;
  isDiaspora: boolean;
  primaryLanguage: string;
  primaryLanguageCode: string;
  primaryReligion: string;
  evangelicalPct: string;
  percentAdherents: string;
  progressScale: string;
  workersNeeded: string;
  countOfCountries: string;
  provinceRegion: string;
  description: string;
  photoUrl: string;
}

const EMPTY_FORM: FormState = {
  peopCode: '',
  countryCode: '',
  peopleName: '',
  populationInCountry: '',
  populationGlobal: '',
  isUnreached: true,
  isFrontier: false,
  isIndigenous: true,
  isDiaspora: false,
  primaryLanguage: '',
  primaryLanguageCode: '',
  primaryReligion: '',
  evangelicalPct: '',
  percentAdherents: '',
  progressScale: '',
  workersNeeded: '',
  countOfCountries: '',
  provinceRegion: '',
  description: '',
  photoUrl: '',
};

export function PeopleGroupManager() {
  const [items, setItems] = React.useState<PeopleGroupRow[]>([]);
  const [countries, setCountries] = React.useState<CountryOption[]>([]);
  const [languages, setLanguages] = React.useState<LanguageOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<PeopleGroupRow | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [flash, setFlash] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [groupsRes, countriesRes, languagesRes] = await Promise.all([
        fetch('/api/admin/people-groups', { credentials: 'same-origin' }),
        fetch('/api/admin/countries', { credentials: 'same-origin' }),
        fetch('/api/admin/languages', { credentials: 'same-origin' }),
      ]);
      if (!groupsRes.ok || !countriesRes.ok || !languagesRes.ok) {
        setLoadError('Error cargando datos.');
        setItems([]);
        return;
      }
      const groupsData = (await groupsRes.json()) as { peopleGroups: PeopleGroupRow[] };
      const countriesData = (await countriesRes.json()) as { countries: CountryOption[] };
      const languagesData = (await languagesRes.json()) as { languages: LanguageOption[] };
      setItems(groupsData.peopleGroups ?? []);
      setCountries((countriesData.countries ?? []).map((c) => ({ countryCode: c.countryCode, countryName: c.countryName })));
      setLanguages((languagesData.languages ?? []).map((l) => ({ languageCode: l.languageCode, languageName: l.languageName })));
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

  const openEdit = (g: PeopleGroupRow) => {
    setEditingId(g.id);
    setForm({
      peopCode: g.peopCode,
      countryCode: g.countryCode,
      peopleName: g.peopleName,
      populationInCountry: String(g.populationInCountry),
      populationGlobal: g.populationGlobal != null ? String(g.populationGlobal) : '',
      isUnreached: g.isUnreached,
      isFrontier: g.isFrontier,
      isIndigenous: g.isIndigenous,
      isDiaspora: g.isDiaspora,
      primaryLanguage: g.primaryLanguage,
      primaryLanguageCode: g.primaryLanguageCode ?? '',
      primaryReligion: g.primaryReligion,
      evangelicalPct: g.evangelicalPct != null ? String(g.evangelicalPct) : '',
      percentAdherents: g.percentAdherents != null ? String(g.percentAdherents) : '',
      progressScale: g.progressScale != null ? String(g.progressScale) : '',
      workersNeeded: g.workersNeeded != null ? String(g.workersNeeded) : '',
      countOfCountries: g.countOfCountries != null ? String(g.countOfCountries) : '',
      provinceRegion: g.provinceRegion ?? '',
      description: g.description ?? '',
      photoUrl: g.photoUrl ?? '',
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.peopleName || !form.primaryLanguage || !form.primaryReligion || !form.countryCode) {
      setFormError('Nombre, idioma, religión y país son obligatorios.');
      return;
    }
    if (!editingId && !form.peopCode) {
      setFormError('El código (peopCode) es obligatorio al crear.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form, peopCode: form.peopCode.trim().toUpperCase() };
      const url = editingId ? `/api/admin/people-groups/${editingId}` : '/api/admin/people-groups';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setFormError(err?.error ?? 'Error al guardar el grupo.');
        return;
      }
      setFormOpen(false);
      setFlash(editingId ? `Grupo ${form.peopleName} actualizado.` : `Grupo ${form.peopleName} creado.`);
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
      const res = await fetch(`/api/admin/people-groups/${deleting.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setFlash(err?.error ?? 'Error al eliminar el grupo.');
        setDeleting(null);
        setDeleteLoading(false);
        return;
      }
      setFlash(`Grupo ${deleting.peopleName} eliminado.`);
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
          <p className="text-caption uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">Grupos Étnicos</p>
          <h3 className="mt-1 font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
            Gestión de Grupos Étnicos
          </h3>
        </div>
        <Button onClick={openCreate} disabled={countries.length === 0}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo Grupo
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
          <Users className="mx-auto mb-3 h-8 w-8 text-dark-300 dark:text-dark-600" aria-hidden="true" />
          <p className="text-body-md text-dark-500 dark:text-dark-400">Aún no hay grupos étnicos. Crea el primero.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-dark-200 dark:border-dark-700">
          <table className="w-full min-w-[720px] text-left text-body-sm">
            <thead className="bg-dark-50 dark:bg-dark-800/60 text-dark-500 dark:text-dark-400">
              <tr>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Grupo étnico</th>
                <th className="px-4 py-3 font-medium">País</th>
                <th className="px-4 py-3 font-medium">Población</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Evang.</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100 dark:divide-dark-800">
              {items.map((g) => (
                <tr key={g.id} className="hover:bg-dark-50 dark:hover:bg-dark-800/40">
                  <td className="px-4 py-3 font-mono text-xs text-dark-500 dark:text-dark-400">{g.peopCode}</td>
                  <td className="px-4 py-3 font-medium text-dark-900 dark:text-dark-100">{g.peopleName}</td>
                  <td className="px-4 py-3 text-dark-600 dark:text-dark-300">
                    {g.countryCode} · {g.countryName ?? ''}
                  </td>
                  <td className="px-4 py-3 text-dark-600 dark:text-dark-300">{formatNum(g.populationInCountry)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {g.isUnreached && <Badge size="sm" variant="danger">No alcanzado</Badge>}
                      {g.isFrontier && <Badge size="sm" variant="warning">Frontera</Badge>}
                      {g.isIndigenous && <Badge size="sm" variant="primary">Indígena</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-dark-600 dark:text-dark-300">
                    {g.evangelicalPct != null ? `${g.evangelicalPct}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-dark-600 dark:text-dark-300">
                    {g.progressScale != null ? `${g.progressScale}/5` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(g)} aria-label={`Editar ${g.peopleName}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleting(g)} aria-label={`Eliminar ${g.peopleName}`}>
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
        title={editingId ? `Editar ${form.peopleName}` : 'Nuevo Grupo Étnico'}
        description="Datos demográficos y de avance de evangelización del grupo."
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Código (peopCode)"
              value={form.peopCode}
              onChange={(e) => setForm({ ...form, peopCode: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() })}
              maxLength={8}
              disabled={!!editingId}
              required={!editingId}
              placeholder="PEJ01"
              helperText={editingId ? 'No editable.' : 'Ej. PEJ01, INB21'}
            />
            <div className="sm:col-span-2">
              <Select
                label="País (ISO-2)"
                value={form.countryCode}
                onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                options={countries.map((c) => ({ value: c.countryCode, label: `${c.countryCode} — ${c.countryName}` }))}
                placeholder="Selecciona un país"
                required
              />
            </div>
          </div>

          <Input label="Nombre del grupo étnico" value={form.peopleName} onChange={(e) => setForm({ ...form, peopleName: e.target.value })} required placeholder="Shipibo-Conibo" />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Población en el país" type="number" value={form.populationInCountry} onChange={(e) => setForm({ ...form, populationInCountry: e.target.value })} />
            <Input label="Población global" type="number" value={form.populationGlobal} onChange={(e) => setForm({ ...form, populationGlobal: e.target.value })} />
            <Input label="Región / Provincia" value={form.provinceRegion} onChange={(e) => setForm({ ...form, provinceRegion: e.target.value })} placeholder="Ucayali" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Select
                label="Idioma principal"
                value={form.primaryLanguageCode}
                onChange={(e) => {
                  const code = e.target.value;
                  const lang = languages.find((l) => l.languageCode === code);
                  setForm({ ...form, primaryLanguage: lang?.languageName ?? '', primaryLanguageCode: code });
                }}
                options={languages
                  .slice()
                  .sort((a, b) => a.languageName.localeCompare(b.languageName))
                  .map((l) => ({ value: l.languageCode, label: `${l.languageCode} — ${l.languageName}` }))}
                placeholder={languages.length === 0 ? 'Primero crea idiomas en la pestaña Idiomas' : 'Selecciona un idioma…'}
                helperText="Cargado desde la tabla Language. Si falta tu idioma, créalo primero en la pestaña «Idiomas»."
                required
              />
            </div>
          </div>

          <Input label="Religión principal" value={form.primaryReligion} onChange={(e) => setForm({ ...form, primaryReligion: e.target.value })} required placeholder="Etnoreligión" />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="% Evangélicos" type="number" step="0.1" value={form.evangelicalPct} onChange={(e) => setForm({ ...form, evangelicalPct: e.target.value })} />
            <Input label="% Adherentes crist." type="number" step="0.1" value={form.percentAdherents} onChange={(e) => setForm({ ...form, percentAdherents: e.target.value })} />
            <Input label="ProgressScale (1-5)" type="number" step="0.1" min="0" max="5" value={form.progressScale} onChange={(e) => setForm({ ...form, progressScale: e.target.value })} />
            <Input label="Obreros necesarios" type="number" value={form.workersNeeded} onChange={(e) => setForm({ ...form, workersNeeded: e.target.value })} />
            <Input label="Países donde vive" type="number" value={form.countOfCountries} onChange={(e) => setForm({ ...form, countOfCountries: e.target.value })} />
          </div>

          <div className="flex flex-wrap gap-4">
            {([
              ['isUnreached', 'No alcanzado'],
              ['isFrontier', 'Frontera'],
              ['isIndigenous', 'Indígena'],
              ['isDiaspora', 'Diáspora'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-body-sm text-dark-700 dark:text-dark-300">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  className="h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
                />
                {label}
              </label>
            ))}
          </div>

          <Textarea label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />

          <ImageUploader
            label="Foto del grupo"
            folder="people-groups"
            value={form.photoUrl}
            onChange={(url) => setForm({ ...form, photoUrl: url })}
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
              {editingId ? 'Guardar cambios' : 'Crear grupo'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar grupo étnico"
        message={`¿Eliminar ${deleting?.peopleName} (${deleting?.peopCode})? Esta acción no se puede deshacer.`}
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