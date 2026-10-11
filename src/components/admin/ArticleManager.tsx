'use client';

import * as React from 'react';
import { useAppStore } from '@/store';
import { Button, Card, Input, Select, Badge, Modal, ConfirmModal } from '@/components/ui';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { formatDate } from '@/lib/utils';
import type { Article, Category } from '@/types';
import { Plus, Pencil, Trash2, Newspaper, Save, Tag } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; variant: 'warning' | 'success' }> = {
  DRAFT: { label: 'Borrador', variant: 'warning' },
  PUBLISHED: { label: 'Publicado', variant: 'success' },
};

const EMPTY_FORM = (): ArticleFormState => ({
  title: '',
  content: '',
  excerpt: '',
  coverImage: '',
  status: 'DRAFT',
  categoryId: '',
  tags: '',
  editingId: null,
});

interface ArticleFormState {
  title: string;
  content: string;
  excerpt: string;
  coverImage: string;
  status: string;
  categoryId: string;
  tags: string;
  editingId: string | null;
}

export function ArticleManager() {
  const articles = useAppStore((s) => s.articles);
  const categories = useAppStore((s) => s.categories);
  const allCategories = useAppStore((s) => s.allCategories);
  const fetchArticles = useAppStore((s) => s.fetchArticles);
  const fetchCategories = useAppStore((s) => s.fetchCategories);
  const fetchAllCategories = useAppStore((s) => s.fetchAllCategories);
  const createArticle = useAppStore((s) => s.createArticle);
  const updateArticle = useAppStore((s) => s.updateArticle);
  const deleteArticle = useAppStore((s) => s.deleteArticle);
  const articlesLoading = useAppStore((s) => s.articlesLoading);
  const articlesError = useAppStore((s) => s.articlesError);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<ArticleFormState>(EMPTY_FORM());
  const [isSaving, setIsSaving] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  const [imageUploading, setImageUploading] = React.useState(false);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    void fetchArticles();
    void fetchCategories();
    void fetchAllCategories();
  }, [fetchArticles, fetchCategories, fetchAllCategories]);

  const editingArticle = editingId ? articles.find((a) => a.id === editingId) : null;

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM());
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (article: Article) => {
    setEditingId(article.id);
    setForm({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt ?? '',
      coverImage: article.coverImage ?? '',
      status: article.status,
      categoryId: article.categoryId ?? '',
      tags: article.tags.join(', '),
      editingId: article.id,
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
      setForm((f) => ({ ...f, coverImage: data.url as string }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
    } finally {
      setImageUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim() || form.title.length < 3) {
      setFormError('El título es requerido (mínimo 3 caracteres).');
      return;
    }
    if (!form.content.trim()) {
      setFormError('El contenido es requerido.');
      return;
    }

    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: form.title.trim(),
      content: form.content,
      excerpt: form.excerpt.trim() || null,
      coverImage: form.coverImage.trim() || null,
      status: form.status,
      categoryId: form.categoryId || null,
      tags,
    };

    setIsSaving(true);
    const result = editingId
      ? await updateArticle(editingId, payload)
      : await createArticle(payload);
    setIsSaving(false);

    if (!result || (result.article === undefined && !editingId)) {
      setFormError('No se pudo guardar el artículo.');
      return;
    }

    setFormOpen(false);
    setEditingId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    await deleteArticle(deletingId);
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
            Artículos
          </h2>
          <p className="text-body-sm text-dark-500 dark:text-dark-400">
            {articles.length} artículos · guardados en MySQL
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nuevo artículo
        </Button>
      </div>

      {articlesError && (
        <p role="alert" className="rounded-lg bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-body-sm text-amber-700 dark:text-amber-300">
          {articlesError}
        </p>
      )}

      <CategoryManager />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => (
          <Card key={article.id} variant="outlined" padding="md" className="flex flex-col">
            <div className="mb-3 flex items-center justify-between gap-2">
              <Badge variant={STATUS_LABELS[article.status]?.variant ?? 'outline'} size="sm">
                {STATUS_LABELS[article.status]?.label ?? article.status}
              </Badge>
              <time className="text-caption text-dark-400 dark:text-dark-500">
                {formatDate(article.updatedAt)}
              </time>
            </div>

            {article.coverImage && (
              <img src={article.coverImage} alt="" className="mb-3 h-36 w-full rounded-lg object-cover" loading="lazy" />
            )}

            <h3 className="font-serif text-heading-md font-semibold leading-snug text-dark-900 line-clamp-2 dark:text-dark-100">
              {article.title}
            </h3>
            <p className="mt-2 text-caption text-dark-500 line-clamp-2 dark:text-dark-400">
              {article.excerpt ?? 'Sin resumen.'}
            </p>

            <div className="mt-3 flex flex-wrap gap-1">
              {article.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-dark-100 px-2 py-0.5 text-caption text-dark-600 dark:bg-dark-800 dark:text-dark-400">
                  <Tag className="h-2.5 w-2.5" aria-hidden="true" />
                  {tag}
                </span>
              ))}
              {article.tags.length > 3 && (
                <span className="text-caption text-dark-400 dark:text-dark-500">+{article.tags.length - 3}</span>
              )}
            </div>

            <div className="mt-auto flex justify-end gap-2 border-t border-dark-100 pt-4 dark:border-dark-800">
              <Button variant="ghost" size="sm" onClick={() => openEdit(article)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Editar
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setDeletingId(article.id)}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Eliminar
              </Button>
            </div>
          </Card>
        ))}

        {!articlesLoading && articles.length === 0 && (
          <Card padding="lg" className="md:col-span-2 xl:col-span-3 text-center">
            <Newspaper className="mx-auto mb-3 h-10 w-10 text-dark-300 dark:text-dark-600" aria-hidden="true" />
            <p className="text-body-md text-dark-500 dark:text-dark-400">
              No hay artículos todavía. Crea el primero con «Nuevo artículo».
            </p>
          </Card>
        )}
      </div>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingArticle ? `Editar: ${editingArticle.title}` : 'Nuevo artículo'}
        description={editingArticle ? `Modificando «${editingArticle.title}»` : 'Escribe un artículo nuevo con portada, contenido enriquecido y categoría.'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <fieldset className="space-y-4">
            <legend className="font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">
              Información general
            </legend>

            <Input
              label="Título"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej. El evangelio entre los pueblos no alcanzados"
            />

            <Input
              label="Resumen (excerpt)"
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder="Breve descripción del artículo…"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Estado"
                options={[
                  { value: 'DRAFT', label: 'Borrador' },
                  { value: 'PUBLISHED', label: 'Publicado' },
                ]}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              />
              <Select
                label="Categoría"
                options={[
                  { value: '', label: 'Sin categoría' },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ...allCategories
                    .filter((c) => !c.active)
                    .map((c) => ({ value: c.id, label: `${c.name} (oculta)` })),
                ]}
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                helperText="Las categorías ocultas solo aparecen para reasignar; no se muestran en la web."
              />
            </div>

            <Input
              label="Tags (separados por comas)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="ej. misiones, evangelio, pueblos"
            />
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">
              Portada
            </legend>

            <div className="flex items-start gap-3">
              {form.coverImage && (
                <img src={form.coverImage} alt="Vista previa" className="h-24 w-24 shrink-0 rounded-lg border border-dark-200 object-cover dark:border-dark-700" />
              )}
              <div className="flex-1 space-y-2">
                <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleCoverUpload} aria-label="Subir imagen de portada desde mi PC" />
                {form.coverImage.startsWith('/api/uploads/') ? (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" loading={imageUploading} onClick={() => coverInputRef.current?.click()}>Reemplazar foto</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, coverImage: '' })}>Quitar</Button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" loading={imageUploading} onClick={() => coverInputRef.current?.click()}>Subir desde mi PC</Button>
                      {form.coverImage && <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, coverImage: '' })}>Quitar</Button>}
                    </div>
                    <Input label="" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="…o pega aquí el enlace de una imagen (https://…)" />
                  </>
                )}
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">
              Contenido {form.content.length > 0 && <span className="text-caption font-normal text-dark-400">({form.content.length} caracteres)</span>}
            </legend>

            <RichTextEditor
              value={form.content}
              onChange={(html) => setForm((f) => ({ ...f, content: html }))}
              placeholder="Escribe el contenido aquí… usa la barra superior para formato, enlaces, citas e imágenes."
            />
            <p className="text-caption text-dark-400 dark:text-dark-500">
              El contenido se guarda como HTML. El botón «Imagen» sube archivos a /public/uploads/ y los inserta en el texto.
            </p>
          </fieldset>

          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-body-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-dark-100 pt-4 dark:border-dark-800">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isSaving}>
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
              {editingId ? 'Guardar cambios' : 'Publicar artículo'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar artículo"
        message={`¿Seguro que deseas eliminar el artículo? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}