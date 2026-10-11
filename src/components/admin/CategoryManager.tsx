'use client';

import * as React from 'react';
import { useAppStore } from '@/store';
import { Button, Input, Badge, Modal, ConfirmModal } from '@/components/ui';
import type { Category } from '@/types';
import { Plus, Pencil, EyeOff, RotateCcw, Tag, Info } from 'lucide-react';

type CategoryWithCount = Category & { _count?: { articles: number } };

/**
 * Gestión de categorías de artículos.
 * - Crear: siempre queda activa (visible en la web).
 * - Renombrar: cambia nombre y slug.
 * - Ocultar (borrado suave): la categoría desaparece de la UI, pero los
 *   artículos NO se tocan; quedarán bajo «Todos» hasta que el usuario
 *   los reasigne desde el editor de artículos.
 */
export function CategoryManager() {
  const allCategories = useAppStore((s) => s.allCategories);
  const fetchAllCategories = useAppStore((s) => s.fetchAllCategories);
  const fetchCategories = useAppStore((s) => s.fetchCategories);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [name, setName] = React.useState('');
  const [hidingId, setHidingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const refresh = React.useCallback(() => {
    void fetchAllCategories();
    void fetchCategories();
  }, [fetchAllCategories, fetchCategories]);

  React.useEffect(() => {
    void fetchAllCategories();
  }, [fetchAllCategories]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setError('');
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('El nombre es requerido (mínimo 2 caracteres).');
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/categories/${editing.id}` : '/api/categories';
      const method = editing ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = (await response.json()) as { category?: Category; error?: string };
      if (!response.ok || !data.category) throw new Error(data.error ?? 'No se pudo guardar.');
      setModalOpen(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const hideCategory = async () => {
    if (!hidingId) return;
    setError('');
    try {
      const response = await fetch(`/api/categories/${hidingId}`, { method: 'DELETE' });
      const data = (await response.json()) as { category?: Category; error?: string };
      if (!response.ok || !data.category) throw new Error(data.error ?? 'No se pudo ocultar.');
      setHidingId(null);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ocultar.');
      setHidingId(null);
    }
  };

  const reactivate = async (c: Category) => {
    setError('');
    try {
      const response = await fetch(`/api/categories/${c.id}/reactivate`, { method: 'POST' });
      const data = (await response.json()) as { category?: Category; error?: string };
      if (!response.ok || !data.category) throw new Error(data.error ?? 'No se pudo reactivar.');
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reactivar.');
    }
  };

  const activeCount = allCategories.filter((c) => c.active).length;
  const cats = allCategories as CategoryWithCount[];

  return (
    <div className="rounded-xl border border-dark-200 p-5 dark:border-dark-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">
            <Tag className="h-5 w-5 text-primary-500" aria-hidden="true" />
            Categorías
            <Badge variant="outline" size="sm">{activeCount} activas · {allCategories.length - activeCount} ocultas</Badge>
          </h3>
          <p className="mt-1 text-caption text-dark-500 dark:text-dark-400">
            Se muestran como filtros en /articulos. Al ocultar una categoría sus artículos NO se borran: quedarán solo en «Todos» hasta que los reasignes a una activa.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Nueva categoría
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-4 py-2.5 text-body-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      {allCategories.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-dark-50 px-4 py-3 text-body-sm text-dark-500 dark:bg-dark-800/50 dark:text-dark-400">
          <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
          Aún no hay categorías. Crea «Libros», «Oraciones», etc. para que aparezcan los filtros en la web.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {cats.map((c) => (
            <li
              key={c.id}
              className={
                c.active
                  ? 'flex flex-col gap-2 rounded-lg border border-dark-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-dark-700'
                  : 'flex flex-col gap-2 rounded-lg border border-dashed border-dark-300 bg-dark-50/60 px-4 py-3 opacity-80 sm:flex-row sm:items-center sm:justify-between dark:border-dark-600 dark:bg-dark-800/40'
              }
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-body-sm font-medium text-dark-900 dark:text-dark-100">
                  {c.name}
                  {c.active ? (
                    <Badge variant="success" size="sm">Activa</Badge>
                  ) : (
                    <Badge variant="outline" size="sm">Oculta</Badge>
                  )}
                </p>
                <p className="mt-0.5 text-caption text-dark-400 dark:text-dark-500">
                  /{c.slug} · {typeof c._count?.articles === 'number' ? c._count.articles : 0} artículo(s)
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  Renombrar
                </Button>
                {c.active ? (
                  <Button variant="ghost" size="sm" className="text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20" onClick={() => setHidingId(c.id)}>
                    <EyeOff className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                    Ocultar
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20" onClick={() => reactivate(c)}>
                    <RotateCcw className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                    Mostrar de nuevo
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Renombrar categoría` : 'Nueva categoría'}
        description={editing ? `«${editing.name}» cambiará de nombre (y de slug).` : 'Esta categoría aparecerá de inmediato en los filtros de /articulos.'}
        size="md"
      >
        <form onSubmit={submit} className="space-y-5" noValidate>
          <Input
            label="Nombre"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Libros, Oraciones, Testimonios…"
          />
          {editing && (
            <p className="text-caption text-dark-400 dark:text-dark-500">
              Slug actual: /{editing.slug} → se regenerará automáticamente.
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-body-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-dark-100 pt-4 dark:border-dark-800">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!hidingId}
        onClose={() => setHidingId(null)}
        onConfirm={hideCategory}
        title="Ocultar categoría"
        message="La categoría desaparecerá de los filtros de la web. Sus artículos NO se eliminarán: quedarán solo bajo «Todos» hasta que los reasignes a una categoría activa desde el editor de artículos. ¿Continuar?"
        confirmText="Ocultar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}