'use client';

import * as React from 'react';
import { Button, Card, Input, Select, Textarea, Modal, ConfirmModal, Badge } from '@/components/ui';
import { getInitials, formatDate, formatDateShort } from '@/lib/utils';
import { compressVideoIfNeeded } from '@/lib/videoCompress';
import type { Missionary, MissionaryStory } from '@/types';
import { Plus, Pencil, Trash2, BookOpen, Compass, UserRound } from 'lucide-react';

interface CountryOption {
  countryCode: string;
  countryName: string;
}

interface PeopleGroupOption {
  peopCode: string;
  peopleName: string;
}

interface FormState {
  name: string;
  role: string;
  status: string;
  bio: string;
  photoUrl: string;
  videoUrl: string;
  countryCode: string;
  peopCode: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  role: '',
  status: 'ACTIVE',
  bio: '',
  photoUrl: '',
  videoUrl: '',
  countryCode: '',
  peopCode: '',
};

interface StoryFormState {
  title: string;
  body: string;
  storyDate: string;
  order: string;
}

const EMPTY_STORY: StoryFormState = { title: '', body: '', storyDate: '', order: '' };

const STATUS_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'outline' }> = {
  ACTIVE: { label: 'Activo', variant: 'success' },
  INACTIVE: { label: 'Inactivo', variant: 'warning' },
};

export function MissionaryManager() {
  const [items, setItems] = React.useState<Missionary[]>([]);
  const [countries, setCountries] = React.useState<CountryOption[]>([]);
  const [groups, setGroups] = React.useState<PeopleGroupOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');
  const [flash, setFlash] = React.useState('');

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [imageUploading, setImageUploading] = React.useState(false);
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const [videoUploading, setVideoUploading] = React.useState(false);
  const [compressingVideo, setCompressingVideo] = React.useState(false);
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const [deleting, setDeleting] = React.useState<Missionary | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const [storiesFor, setStoriesFor] = React.useState<Missionary | null>(null);
  const [storyFormOpen, setStoryFormOpen] = React.useState(false);
  const [storyEditingId, setStoryEditingId] = React.useState<number | null>(null);
  const [storyForm, setStoryForm] = React.useState<StoryFormState>(EMPTY_STORY);
  const [storyError, setStoryError] = React.useState('');
  const [storySaving, setStorySaving] = React.useState(false);
  const [storyDeleting, setStoryDeleting] = React.useState<MissionaryStory | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [mRes, cRes, gRes] = await Promise.all([
        fetch('/api/admin/missionaries', { credentials: 'same-origin' }),
        fetch('/api/admin/countries', { credentials: 'same-origin' }),
        fetch('/api/admin/people-groups', { credentials: 'same-origin' }),
      ]);
      if (!mRes.ok || !cRes.ok || !gRes.ok) {
        setLoadError('Error cargando datos.');
        setItems([]);
        return;
      }
      const mData = (await mRes.json()) as { missionaries: Missionary[] };
      const cData = (await cRes.json()) as { countries: CountryOption[] };
      const gData = (await gRes.json()) as { peopleGroups: PeopleGroupOption[] };
      setItems(mData.missionaries ?? []);
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

  React.useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(''), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (m: Missionary) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      role: m.role ?? '',
      status: m.status,
      bio: m.bio ?? '',
      photoUrl: m.photoUrl ?? '',
      videoUrl: m.videoUrl ?? '',
      countryCode: m.countryCode ?? '',
      peopCode: m.peopCode ?? '',
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setFormError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Error al subir la imagen.');
      setForm((f) => ({ ...f, photoUrl: data.url as string }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
    } finally {
      setImageUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUploading(true);
    setFormError('');
    try {
      const ready = await compressVideoIfNeeded(file, () => setCompressingVideo(true));
      setCompressingVideo(false);
      const fd = new FormData();
      fd.append('file', ready);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Error al subir el video.');
      setForm((f) => ({ ...f, videoUrl: data.url as string }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo subir el video.');
    } finally {
      setVideoUploading(false);
      setCompressingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || form.name.trim().length < 2) {
      setFormError('El nombre es requerido (mínimo 2 caracteres).');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        role: form.role.trim() || null,
        status: form.status,
        bio: form.bio.trim() || null,
        photoUrl: form.photoUrl.trim() || null,
        videoUrl: form.videoUrl.trim() || null,
        countryCode: form.countryCode || null,
        peopCode: form.peopCode || null,
      };
      const res = await fetch(editingId != null ? `/api/admin/missionaries/${editingId}` : '/api/admin/missionaries', {
        method: editingId != null ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { missionary?: Missionary; error?: string };
      if (!res.ok || !data.missionary) {
        setFormError(data.error ?? 'Error al guardar el misionero.');
        return;
      }
      setFormOpen(false);
      setFlash(editingId != null ? `Misionero ${form.name.trim()} actualizado.` : `Misionero ${form.name.trim()} creado.`);
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
      const res = await fetch(`/api/admin/missionaries/${deleting.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setFlash(err?.error ?? 'Error al eliminar el misionero.');
        setDeleting(null);
        setDeleteLoading(false);
        return;
      }
      setFlash(`Misionero ${deleting.name} eliminado.`);
      setDeleting(null);
      void load();
    } catch {
      setFlash('Error de conexión al eliminar.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Historias ─────────────────────────────────────────
  const openStories = (m: Missionary) => {
    setStoriesFor(m);
    setStoryFormOpen(false);
    setStoryEditingId(null);
    setStoryForm(EMPTY_STORY);
    setStoryError('');
  };

  const closeStories = () => {
    setStoriesFor(null);
    setStoryDeleting(null);
    setStoryFormOpen(false);
  };

  const startAddStory = () => {
    setStoryFormOpen(true);
    setStoryEditingId(null);
    setStoryForm(EMPTY_STORY);
    setStoryError('');
  };

  const startEditStory = (s: MissionaryStory) => {
    setStoryFormOpen(true);
    setStoryEditingId(s.id);
    setStoryForm({
      title: s.title,
      body: s.body,
      storyDate: s.storyDate ? s.storyDate.slice(0, 10) : '',
      order: String(s.order),
    });
    setStoryError('');
  };

  const saveStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storiesFor) return;
    if (!storyForm.title.trim() || !storyForm.body.trim()) {
      setStoryError('El título y el contenido de la historia son obligatorios.');
      return;
    }
    setStorySaving(true);
    setStoryError('');
    try {
      const payload = { title: storyForm.title.trim(), body: storyForm.body, storyDate: storyForm.storyDate || null };
      const order = storyForm.order.trim() ? storyForm.order.trim() : null;
      const url =
        storyEditingId != null
          ? `/api/admin/missionaries/${storiesFor.id}/stories/${storyEditingId}`
          : `/api/admin/missionaries/${storiesFor.id}/stories`;
      const res = await fetch(url, {
        method: storyEditingId != null ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(order != null ? { ...payload, order } : payload),
      });
      const data = (await res.json()) as { story?: MissionaryStory; error?: string };
      if (!res.ok || !data.story) {
        setStoryError(data.error ?? 'Error al guardar la historia.');
        return;
      }
      setStoriesFor((prev) =>
        prev
          ? { ...prev, stories: prev.stories.filter((s) => s.id !== data.story!.id).concat(data.story!).sort((a, b) => a.order - b.order) }
          : prev
      );
      startAddStory();
    } catch {
      setStoryError('Error de conexión con el servidor.');
    } finally {
      setStorySaving(false);
    }
  };

  const deleteStory = async () => {
    if (!storiesFor || !storyDeleting) return;
    try {
      const res = await fetch(`/api/admin/missionaries/${storiesFor.id}/stories/${storyDeleting.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setStoryError(err?.error ?? 'Error al eliminar la historia.');
        setStoryDeleting(null);
        return;
      }
      setStoriesFor((prev) => (prev ? { ...prev, stories: prev.stories.filter((s) => s.id !== storyDeleting.id) } : prev));
      if (storyEditingId === storyDeleting.id) startAddStory();
      setStoryDeleting(null);
    } catch {
      setStoryError('Error de conexión al eliminar.');
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-caption uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">Misioneros</p>
          <h3 className="mt-1 font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
            Gestión de Misioneros
          </h3>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo misionero
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
          <Compass className="mx-auto mb-3 h-8 w-8 text-dark-300 dark:text-dark-600" aria-hidden="true" />
          <p className="text-body-md text-dark-500 dark:text-dark-400">Aún no hay misioneros registrados.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-dark-200 dark:border-dark-700">
          <table className="w-full min-w-[760px] text-left text-body-sm">
            <thead className="bg-dark-50 text-dark-500 dark:bg-dark-800/60 dark:text-dark-400">
              <tr>
                <th className="px-4 py-3 font-medium">Misionero</th>
                <th className="px-4 py-3 font-medium">País</th>
                <th className="px-4 py-3 font-medium">Grupo étnico</th>
                <th className="px-4 py-3 font-medium">Historias</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100 dark:divide-dark-800">
              {items.map((m) => (
                <tr key={m.id} className="hover:bg-dark-50 dark:hover:bg-dark-800/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 font-serif text-sm font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                          {getInitials(m.name)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-dark-900 dark:text-dark-100">{m.name}</p>
                        {m.role && <p className="text-caption text-dark-400 dark:text-dark-500">{m.role}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-dark-600 dark:text-dark-300">
                    {m.countryCode ? `${m.countryCode} — ${m.countryName ?? ''}` : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-dark-500 dark:text-dark-400">{m.peopCode ?? '—'}</td>
                  <td className="px-4 py-3 text-dark-600 dark:text-dark-300">{m.stories.length}</td>
                  <td className="px-4 py-3">
                    <Badge size="sm" variant={STATUS_LABELS[m.status]?.variant ?? 'outline'}>
                      {STATUS_LABELS[m.status]?.label ?? m.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openStories(m)} aria-label={`Testimonios de ${m.name}`} title="Testimonios y historias">
                        <BookOpen className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(m)} aria-label={`Editar ${m.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleting(m)} aria-label={`Eliminar ${m.name}`}>
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

      {/* Modal misionero */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId != null ? `Editar ${form.name}` : 'Nuevo misionero'}
        description="Persona individual: nombre, rol, país, grupo étnico, biografía y foto."
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <fieldset className="space-y-4">
            <legend className="font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">
              Información general
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nombre"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej. Juan Pérez"
              />
              <Input
                label="Rol / cargo"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Ej. Plantador de iglesias"
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
            <Select
              label="Estado"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'Activo' },
                { value: 'INACTIVE', label: 'Inactivo' },
              ]}
            />
            <Textarea
              label="Biografía (opcional)"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              placeholder="Breve presentación del obrero y su campo…"
            />
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">Foto</legend>
            <div className="flex items-start gap-3">
              {form.photoUrl ? (
                <img src={form.photoUrl} alt="Vista previa" className="h-24 w-24 shrink-0 rounded-full border border-dark-200 object-cover dark:border-dark-700" />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary-100 font-serif text-lg font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  {form.name ? getInitials(form.name) : <UserRound className="h-6 w-6" aria-hidden="true" />}
                </div>
              )}
              <div className="flex-1 space-y-2">
                <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleCoverUpload} aria-label="Subir foto del misionero" />
                {form.photoUrl.startsWith('/api/uploads/') ? (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" loading={imageUploading} onClick={() => photoInputRef.current?.click()}>Reemplazar foto</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, photoUrl: '' })}>Quitar</Button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" loading={imageUploading} onClick={() => photoInputRef.current?.click()}>Subir desde mi PC</Button>
                      {form.photoUrl && <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, photoUrl: '' })}>Quitar</Button>}
                    </div>
                    <Input label="" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} placeholder="…o pega aquí el enlace de una imagen (https://…)" />
                  </>
                )}
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">
              Video de presentación (opcional)
            </legend>
            <div className="flex items-start gap-3">
              {form.videoUrl ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={form.videoUrl}
                  controls
                  playsInline
                  className="h-28 w-48 shrink-0 rounded-lg border border-dark-200 bg-black object-cover dark:border-dark-700"
                />
              ) : (
                <div className="flex h-28 w-48 shrink-0 items-center justify-center rounded-lg border border-dashed border-dark-300 bg-dark-50 text-caption text-dark-400 dark:border-dark-600 dark:bg-dark-800">
                  Sin video
                </div>
              )}
              <div className="flex-1 space-y-2">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/*"
                  className="hidden"
                  onChange={handleVideoUpload}
                  aria-label="Subir video de presentación MP4"
                />
                {form.videoUrl.startsWith('/api/uploads/') ? (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" loading={videoUploading} onClick={() => videoInputRef.current?.click()}>
                      Reemplazar video
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, videoUrl: '' })}>
                      Quitar
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" loading={videoUploading} onClick={() => videoInputRef.current?.click()}>
                        Subir MP4 desde mi PC
                      </Button>
                      {form.videoUrl && <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, videoUrl: '' })}>Quitar</Button>}
                    </div>
                    <Input
                      label=""
                      value={form.videoUrl}
                      onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                      placeholder="…o pega aquí el enlace de un video MP4 (https://…)"
                    />
                  </>
                )}
                {compressingVideo && (
                  <p className="text-body-sm font-medium text-primary-600 dark:text-primary-300">
                    Comprimiendo video en tu navegador… (archivo grande, puede tardar 1-3 minutos)
                  </p>
                )}
                <p className="text-caption text-dark-400 dark:text-dark-500">
                  MP4 corto de presentación (máx. 65 MB). Se publicará en la página del misionero.
                </p>
              </div>
            </div>
          </fieldset>

          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-body-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-dark-100 pt-4 dark:border-dark-800">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editingId != null ? 'Guardar cambios' : 'Crear misionero'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal historias */}
      <Modal
        isOpen={!!storiesFor}
        onClose={closeStories}
        title={`Historias y testimonios de ${storiesFor?.name ?? ''}`}
        description="Testimonios y relatos de este misionero. Añade, edita o elimina desde aquí; se publican en su página pública."
        size="lg"
      >
        <div className="space-y-6">
          {storiesFor && storiesFor.stories.length > 0 && (
            <ul role="list" className="space-y-3">
              {storiesFor.stories.map((s) => (
                <li key={s.id} className="rounded-lg border border-dark-200 p-4 dark:border-dark-700">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-dark-900 dark:text-dark-100">{s.title}</p>
                      <p className="mt-0.5 text-caption text-dark-400 dark:text-dark-500">
                        {s.storyDate ? formatDateShort(s.storyDate) : 'Sin fecha'} · orden {s.order}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEditStory(s)} aria-label={`Editar ${s.title}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setStoryDeleting(s)} aria-label={`Eliminar ${s.title}`}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-body-sm text-dark-500 line-clamp-3 dark:text-dark-400">{s.body}</p>
                </li>
              ))}
            </ul>
          )}

          {!storyFormOpen && (
            <Button type="button" variant="outline" onClick={startAddStory}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Añadir historia
            </Button>
          )}

          {storyFormOpen && (
            <form onSubmit={saveStory} className="space-y-4 rounded-lg border border-dashed border-dark-300 p-4 dark:border-dark-600">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Input
                    label="Título"
                    value={storyForm.title}
                    onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                    placeholder="Ej. Un puente en la selva"
                  />
                </div>
                <Input
                  label="Fecha (opcional)"
                  type="date"
                  value={storyForm.storyDate}
                  onChange={(e) => setStoryForm({ ...storyForm, storyDate: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Textarea
                    label="Testimonio"
                    value={storyForm.body}
                    onChange={(e) => setStoryForm({ ...storyForm, body: e.target.value })}
                    rows={3}
                    placeholder="Escribe el testimonio o historia…"
                  />
                </div>
                <Input
                  label="Orden"
                  type="number"
                  min={0}
                  value={storyForm.order}
                  onChange={(e) => setStoryForm({ ...storyForm, order: e.target.value })}
                  placeholder="0"
                />
              </div>

              {storyError && (
                <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-body-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {storyError}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => setStoryFormOpen(false)} disabled={storySaving}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" loading={storySaving}>
                  {storyEditingId != null ? 'Guardar historia' : 'Añadir historia'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar misionero"
        message={`¿Eliminar a ${deleting?.name}? Sus historias se eliminarán también. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        loading={deleteLoading}
      />

      <ConfirmModal
        isOpen={!!storyDeleting}
        onClose={() => setStoryDeleting(null)}
        onConfirm={deleteStory}
        title="Eliminar historia"
        message={`¿Eliminar la historia «${storyDeleting?.title}»?`}
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}