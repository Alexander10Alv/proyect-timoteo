'use client';

import * as React from 'react';
import { Button, Card, Input, Select, Modal, ConfirmModal, Badge } from '@/components/ui';
import { Plus, Pencil, Trash2, Languages, Search } from 'lucide-react';

type BibleStatus = 'FULL_BIBLE' | 'NEW_TESTAMENT' | 'PORTIONS' | 'NONE' | 'UNSPECIFIED';

interface LanguageRow {
  languageCode: string;
  languageName: string;
  primaryGroupsCount: number;
  unreachedGroupsCount: number;
  bibleStatus: BibleStatus;
}

interface FormState {
  languageCode: string;
  languageName: string;
  primaryGroupsCount: string;
  unreachedGroupsCount: string;
  bibleStatus: string;
}

const EMPTY_FORM: FormState = {
  languageCode: '',
  languageName: '',
  primaryGroupsCount: '0',
  unreachedGroupsCount: '0',
  bibleStatus: 'UNSPECIFIED',
};

const BIBLE_STATUS_LABELS: Record<BibleStatus, string> = {
  FULL_BIBLE: 'Biblia completa',
  NEW_TESTAMENT: 'Nuevo Testamento',
  PORTIONS: 'Porciones',
  NONE: 'Ninguna',
  UNSPECIFIED: 'Sin especificar',
};

const STATUS_VARIANT: Record<BibleStatus, 'success' | 'primary' | 'warning' | 'danger' | 'outline'> = {
  FULL_BIBLE: 'success',
  NEW_TESTAMENT: 'primary',
  PORTIONS: 'warning',
  NONE: 'danger',
  UNSPECIFIED: 'outline',
};

const STATUS_OPTIONS = (Object.keys(BIBLE_STATUS_LABELS) as BibleStatus[]).map((v) => ({
  value: v,
  label: BIBLE_STATUS_LABELS[v],
}));

export function LanguageManager() {
  const [items, setItems] = React.useState<LanguageRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingCode, setEditingCode] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<LanguageRow | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [flash, setFlash] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/admin/languages', { credentials: 'same-origin' });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setLoadError(err?.error ?? `Error HTTP ${res.status}.`);
        setItems([]);
        return;
      }
      const data = (await res.json()) as { languages: LanguageRow[] };
      setItems(data.languages ?? []);
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

  const openEdit = (l: LanguageRow) => {
    setEditingCode(l.languageCode);
    setForm({
      languageCode: l.languageCode,
      languageName: l.languageName,
      primaryGroupsCount: String(l.primaryGroupsCount),
      unreachedGroupsCount: String(l.unreachedGroupsCount),
      bibleStatus: l.bibleStatus,
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.languageName || form.languageName.length < 2) {
      setFormError('El nombre del idioma es obligatorio (mínimo 2 caracteres).');
      return;
    }
    if (!editingCode && !/^[a-z]{2,5}$/.test(form.languageCode.trim().toLowerCase())) {
      setFormError('Código ISO 639-3 inválido (ej. "acu", "shp").');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form, languageCode: form.languageCode.trim().toLowerCase() };
      const url = editingCode ? `/api/admin/languages/${editingCode}` : '/api/admin/languages';
      const res = await fetch(url, {
        method: editingCode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setFormError(err?.error ?? 'Error al guardar el idioma.');
        return;
      }
      setFormOpen(false);
      setFlash(editingCode ? `Idioma ${form.languageName} actualizado.` : `Idioma ${form.languageName} creado.`);
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
      const res = await fetch(`/api/admin/languages/${deleting.languageCode}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setFlash(err?.error ?? 'Error al eliminar el idioma.');
        setDeleting(null);
        setDeleteLoading(false);
        return;
      }
      setFlash(`Idioma ${deleting.languageName} eliminado.`);
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

  const q = search.trim().toLowerCase();
  const filtered = items.filter(
    (l) => !q || l.languageCode.toLowerCase().includes(q) || l.languageName.toLowerCase().includes(q)
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-caption uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">Idiomas</p>
          <h3 className="mt-1 font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
            Gestión de Idiomas
          </h3>
          <p className="mt-1 text-body-sm text-dark-500 dark:text-dark-400">
            Catálogo de lenguas (pestaña Languages de joshuaproject.net). Es el idioma principal que los grupos étnicos
            seleccionan en su formulario.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo Idioma
        </Button>
      </div>

      {flash && (
        <p role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-body-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
          {flash}
        </p>
      )}

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-400 dark:text-dark-500" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código o nombre…"
            className="w-full rounded-lg border border-dark-300 bg-white py-2.5 pl-9 pr-4 text-body-sm text-dark-900 placeholder:text-dark-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-600 dark:bg-dark-900 dark:text-dark-100 dark:placeholder:text-dark-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-dark-200/60 dark:bg-dark-700/60" />
      ) : loadError ? (
        <Card className="p-6">
          <p role="alert" className="text-body-sm text-red-600 dark:text-red-400">{loadError}</p>
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center">
          <Languages className="mx-auto mb-3 h-8 w-8 text-dark-300 dark:text-dark-600" aria-hidden="true" />
          <p className="text-body-md text-dark-500 dark:text-dark-400">Aún no hay idiomas registrados. Crea el primero.</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-body-md text-dark-500 dark:text-dark-400">Sin resultados para “{search}”.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-dark-200 dark:border-dark-700">
          <table className="w-full min-w-[720px] text-left text-body-sm">
            <thead className="bg-dark-50 dark:bg-dark-800/60 text-dark-500 dark:text-dark-400">
              <tr>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Idioma</th>
                <th className="px-4 py-3 font-medium">Grupos (idioma principal)</th>
                <th className="px-4 py-3 font-medium">No alcanzados</th>
                <th className="px-4 py-3 font-medium">Escritura / Biblia</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100 dark:divide-dark-800">
              {filtered.map((l) => (
                <tr key={l.languageCode} className="hover:bg-dark-50 dark:hover:bg-dark-800/40">
                  <td className="px-4 py-3 font-mono text-xs text-dark-500 dark:text-dark-400">{l.languageCode}</td>
                  <td className="px-4 py-3 font-medium text-dark-900 dark:text-dark-100">{l.languageName}</td>
                  <td className="px-4 py-3 text-dark-600 dark:text-dark-300">{l.primaryGroupsCount}</td>
                  <td className="px-4 py-3 text-dark-600 dark:text-dark-300">{l.unreachedGroupsCount}</td>
                  <td className="px-4 py-3">
                    <Badge size="sm" variant={STATUS_VARIANT[l.bibleStatus] ?? 'outline'}>
                      {BIBLE_STATUS_LABELS[l.bibleStatus] ?? l.bibleStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(l)} aria-label={`Editar ${l.languageName}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleting(l)} aria-label={`Eliminar ${l.languageName}`}>
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
        title={editingCode ? `Editar ${form.languageName}` : 'Nuevo Idioma'}
        description="Lengua según joshuaproject.net (código, nombre, grupos y estado de la Escritura)."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Código ISO 639-3"
              value={form.languageCode}
              onChange={(e) => setForm({ ...form, languageCode: e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase() })}
              maxLength={5}
              disabled={!!editingCode}
              required={!editingCode}
              placeholder="acu"
              helperText={editingCode ? 'No editable.' : 'Ej. "acu", "shp", "quz".'}
            />
            <Input
              label="Nombre del idioma"
              value={form.languageName}
              onChange={(e) => setForm({ ...form, languageName: e.target.value })}
              required
              placeholder="Achuar-Shiwiar"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Grupos étnicos que lo hablan (principal)"
              type="number"
              min="0"
              value={form.primaryGroupsCount}
              onChange={(e) => setForm({ ...form, primaryGroupsCount: e.target.value })}
            />
            <Input
              label="Grupos no alcanzados con este idioma"
              type="number"
              min="0"
              value={form.unreachedGroupsCount}
              onChange={(e) => setForm({ ...form, unreachedGroupsCount: e.target.value })}
            />
          </div>

          <Select
            label="Estado de la Escritura / Biblia"
            value={form.bibleStatus}
            onChange={(e) => setForm({ ...form, bibleStatus: e.target.value })}
            options={STATUS_OPTIONS}
            placeholder="Selecciona el estado"
            required
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
              {editingCode ? 'Guardar cambios' : 'Crear idioma'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar idioma"
        message={`¿Eliminar ${deleting?.languageName} (${deleting?.languageCode})? Los grupos étnicos que lo usen perderán su idioma (quedará sin asignar). Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}