'use client';

import * as React from 'react';
import { useAppStore } from '@/store';
import { Button, Card, Input, Textarea, Select, Badge, Modal, ConfirmModal } from '@/components/ui';
import { CoursePaymentsModal } from '@/components/admin/CoursePaymentsModal';
import { formatDate, getPostTypeLabel } from '@/lib/utils';
import type { Course, CourseLesson, PostType } from '@/types';
import {
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  Mic2,
  CalendarClock,
  PlaySquare,
  ArrowUp,
  ArrowDown,
  FileText,
  RefreshCw,
  Users,
} from 'lucide-react';

const EMPTY_LESSON = (): CourseLesson => ({
  title: '',
  description: '',
  videoUrl: '',
  resourcesUrl: '',
  durationSeconds: undefined,
  order: 0,
  resources: [],
});

interface CourseFormState {
  title: string;
  type: PostType;
  description: string;
  coverImage: string;
  lessons: CourseLesson[];
  modality: '' | 'VIRTUAL' | 'IN_PERSON' | 'HYBRID';
  location: string;
  eventDate: string;
  meetingLink: string;
  recordingLink: string;
  pricePEN: string;
  priceUSD: string;
  capacity: string;
}

const EMPTY_FORM = (): CourseFormState => ({
  title: '',
  type: 'COURSE',
  description: '',
  coverImage: '',
  lessons: [EMPTY_LESSON()],
  modality: '',
  location: '',
  eventDate: '',
  meetingLink: '',
  recordingLink: '',
  pricePEN: '',
  priceUSD: '',
  capacity: '',
});

export function CourseManager() {
  const courses = useAppStore((s) => s.courses);
  const user = useAppStore((s) => s.user);
  const fetchCourses = useAppStore((s) => s.fetchCourses);
  const createCourse = useAppStore((s) => s.createCourse);
  const updateCourse = useAppStore((s) => s.updateCourse);
  const deleteCourse = useAppStore((s) => s.deleteCourse);
  const coursesError = useAppStore((s) => s.coursesError);
  const coursesLoading = useAppStore((s) => s.coursesLoading);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [paymentsCourse, setPaymentsCourse] = React.useState<Course | null>(null);
  const [form, setForm] = React.useState<CourseFormState>(EMPTY_FORM());
  const [isSaving, setIsSaving] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  const coverInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingCover, setIsUploadingCover] = React.useState(false);
  const resourceInputRef = React.useRef<HTMLInputElement>(null);
  const pendingResourceTarget = React.useRef<{ lesson: number; resource: number | null } | null>(null);
  const [isUploadingResource, setIsUploadingResource] = React.useState(false);

  /* ── Tipo de cambio SUNAT (Soles ↔ Dólares) ── */
  const [tipoCambio, setTipoCambio] = React.useState({ valor: 3.7, fuente: 'default' });
  const [tipoCambioCargando, setTipoCambioCargando] = React.useState(true);
  const [sugerencia, setSugerencia] = React.useState<{ destino: 'pen' | 'usd'; valor: number } | null>(null);

  const cargarTipoCambio = React.useCallback(async () => {
    setTipoCambioCargando(true);
    try {
      const response = await fetch('/api/site/tipo-cambio', { cache: 'no-store' });
      const data = (await response.json()) as { tipo_cambio?: number; fuente?: string };
      const valor = Number(data.tipo_cambio);
      if (response.ok && Number.isFinite(valor) && valor > 0) {
        setTipoCambio({ valor, fuente: data.fuente ?? 'default' });
      } else {
        setTipoCambio({ valor: 3.7, fuente: 'default' });
      }
    } catch {
      setTipoCambio({ valor: 3.7, fuente: 'default' });
    } finally {
      setTipoCambioCargando(false);
    }
  }, []);

  React.useEffect(() => {
    void cargarTipoCambio();
  }, [cargarTipoCambio]);

  const fuenteLabel = tipoCambio.fuente === 'sunat'
    ? 'SUNAT oficial'
    : tipoCambio.fuente === 'respaldo'
      ? 'proveedor de respaldo'
      : 'valor por defecto';

  const alEditarPrecio = (moneda: 'pen' | 'usd', valor: string) => {
    setForm((f) => ({ ...f, ...(moneda === 'pen' ? { pricePEN: valor } : { priceUSD: valor }) }));
    const num = parseFloat(valor.replace(',', '.'));
    if (!Number.isFinite(num) || num <= 0) {
      setSugerencia(null);
      return;
    }
    if (moneda === 'pen') {
      setSugerencia({ destino: 'usd', valor: Math.round((num / tipoCambio.valor) * 100) / 100 });
    } else {
      setSugerencia({ destino: 'pen', valor: Math.round(num * tipoCambio.valor * 100) / 100 });
    }
  };

  const aprobarSugerencia = () => {
    if (!sugerencia) return;
    const campo = sugerencia.destino === 'pen' ? 'pricePEN' : 'priceUSD';
    setForm((f) => ({ ...f, [campo]: sugerencia.valor.toString() }));
    setSugerencia(null);
  };

  React.useEffect(() => {
    void fetchCourses();
  }, [fetchCourses]);

  const editingCourse = editingId ? courses.find((c) => c.id === editingId) : null;

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM());
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditingId(course.id);
    setForm({
      title: course.title,
      type: course.type,
      description: course.description,
      coverImage: course.coverImage ?? '',
      lessons: [...course.lessons]
        .sort((a, b) => a.order - b.order)
        .map((l) => ({
          ...l,
          // El contenido del campo legado ya vive dentro de resources[]; se limpia
          // para que eliminar un recurso SÍ desaparezca al guardar.
          resourcesUrl: '',
          resources: l.resources.map((r) => ({ ...r })),
        })),
      modality: course.modality ?? '',
      location: course.location ?? '',
      eventDate: course.eventDate ? new Date(course.eventDate).toISOString().slice(0, 16) : '',
      meetingLink: course.meetingLink ?? '',
      recordingLink: course.recordingLink ?? '',
      pricePEN: course.pricePEN != null ? String(course.pricePEN) : '',
      priceUSD: course.priceUSD != null ? String(course.priceUSD) : '',
      capacity: course.capacity != null ? String(course.capacity) : '',
    });
    setFormError('');
    setFormOpen(true);
  };

  /* ── Editor de clases ── */
  const addLesson = () => {
    setForm((f) => ({ ...f, lessons: [...f.lessons, EMPTY_LESSON()] }));
  };

  const removeLesson = (index: number) => {
    setForm((f) => ({
      ...f,
      lessons: f.lessons.length > 1 ? f.lessons.filter((_, i) => i !== index) : f.lessons,
    }));
  };

  const moveLesson = (index: number, direction: -1 | 1) => {
    setForm((f) => {
      const next = [...f.lessons];
      const target = index + direction;
      if (target < 0 || target >= next.length) return f;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...f, lessons: next };
    });
  };

  const updateLesson = (index: number, patch: Partial<CourseLesson>) => {
    setForm((f) => ({
      ...f,
      lessons: f.lessons.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    }));
  };

  /* ── Subida de portada desde la PC ── */
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setFormError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? 'No se pudo subir la imagen.');
      }
      setForm((f) => ({ ...f, coverImage: data.url as string }));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo subir la imagen.');
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  /* ── Subida de documento para la lista de recursos de una clase ── */
  const openResourcePicker = (lessonIndex: number, resourceIndex: number | null) => {
    pendingResourceTarget.current = { lesson: lessonIndex, resource: resourceIndex };
    resourceInputRef.current?.click();
  };

  const handleResourceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = pendingResourceTarget.current;
    if (!file || !target) return;

    setIsUploadingResource(true);
    setFormError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? 'No se pudo subir el archivo.');
      }

      // Nombre legible a partir del archivo original (sin extensión).
      const friendlyName = file.name.replace(/\.[^.]+$/, '');

      setForm((f) => ({
        ...f,
        lessons: f.lessons.map((l, li) => {
          if (li !== target.lesson) return l;
          if (target.resource === null || !l.resources[target.resource]) {
            return { ...l, resources: [...l.resources, { name: friendlyName, url: data.url as string }] };
          }
          return {
            ...l,
            resources: l.resources.map((r, ri) =>
              ri === target.resource ? { ...r, url: data.url as string } : r
            ),
          };
        }),
      }));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo subir el archivo.');
    } finally {
      setIsUploadingResource(false);
      pendingResourceTarget.current = null;
      if (resourceInputRef.current) resourceInputRef.current.value = '';
    }
  };

  /* ── Edición de la lista de recursos ── */
  const addResourceRow = (lessonIndex: number) => {
    setForm((f) => ({
      ...f,
      lessons: f.lessons.map((l, i) =>
        i === lessonIndex ? { ...l, resources: [...l.resources, { name: '', url: '' }] } : l
      ),
    }));
  };

  const updateResource = (lessonIndex: number, resourceIndex: number, patch: Partial<{ name: string; url: string }>) => {
    setForm((f) => ({
      ...f,
      lessons: f.lessons.map((l, i) =>
        i === lessonIndex
          ? { ...l, resources: l.resources.map((r, ri) => (ri === resourceIndex ? { ...r, ...patch } : r)) }
          : l
      ),
    }));
  };

  const removeResource = (lessonIndex: number, resourceIndex: number) => {
    setForm((f) => ({
      ...f,
      lessons: f.lessons.map((l, i) =>
        i === lessonIndex ? { ...l, resources: l.resources.filter((_, ri) => ri !== resourceIndex) } : l
      ),
    }));
  };

  /* ── Guardado ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!user?.email) {
      setFormError('Debes iniciar sesión como administrador.');
      return;
    }
    if (form.title.trim().length < 3 || !form.description.trim()) {
      setFormError('Completa el título y la descripción del curso.');
      return;
    }

    setIsSaving(true);
    const payload = {
      title: form.title.trim(),
      type: form.type,
      description: form.description.trim(),
      coverImage: form.coverImage.trim() || undefined,
      authorEmail: user.email,
      lessons: form.lessons.map((l, i) => ({
        title: l.title.trim(),
        description: l.description?.trim() || undefined,
        videoUrl: l.videoUrl.trim(),
        resourcesUrl: l.resourcesUrl?.trim() || undefined,
        durationSeconds: l.durationSeconds && l.durationSeconds > 0 ? l.durationSeconds : undefined,
        order: i + 1,
        resources: l.resources
          .filter((r) => r.name.trim() && r.url.trim())
          .map((r) => ({ name: r.name.trim(), url: r.url.trim() })),
      })),
      ...(form.type !== 'COURSE'
        ? {
            modality: form.modality || undefined,
            location: form.location.trim() || undefined,
            eventDate: form.eventDate ? new Date(form.eventDate).toISOString() : undefined,
            meetingLink: form.meetingLink.trim() || undefined,
            recordingLink: form.recordingLink.trim() || undefined,
            pricePEN: form.pricePEN.trim() ? Number(form.pricePEN.replace(',', '.')) : null,
            priceUSD: form.priceUSD.trim() ? Number(form.priceUSD.replace(',', '.')) : null,
            capacity: form.capacity.trim() ? parseInt(form.capacity, 10) : null,
          }
        : {}),
    };

    const result = editingId
      ? await updateCourse(editingId, payload)
      : await createCourse(payload);
    setIsSaving(false);

    if (!result) {
      setFormError(useAppStore.getState().coursesError || 'No se pudo guardar el curso.');
      return;
    }

    setFormOpen(false);
    setEditingId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    await deleteCourse(deletingId);
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
            Cursos y Publicaciones
          </h2>
          <p className="text-body-sm text-dark-500 dark:text-dark-400">
            {courses.length} publicaciones · {courses.reduce((s, c) => s + c.lessons.length, 0)} clases en total · guardadas en MySQL
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nuevo curso
        </Button>
      </div>

      {coursesError && (
        <p role="alert" className="rounded-lg bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-body-sm text-amber-700 dark:text-amber-300">
          {coursesError}
        </p>
      )}

      {/* Lista de cursos */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} variant="outlined" padding="md" className="flex flex-col">
            <div className="mb-3 flex items-center justify-between gap-2">
              <Badge variant="outline" size="sm">{getPostTypeLabel(course.type)}</Badge>
              <time className="text-caption text-dark-400 dark:text-dark-500" dateTime={new Date(course.createdAt).toISOString()}>
                {formatDate(course.createdAt)}
              </time>
            </div>

            {course.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={course.coverImage} alt="" className="mb-3 h-28 w-full rounded-lg object-cover" loading="lazy" />
            )}

            <h3 className="font-serif text-heading-md font-semibold leading-snug text-dark-900 line-clamp-2 dark:text-dark-100">
              {course.title}
            </h3>
            <p className="mt-2 flex-1 text-body-sm text-dark-500 line-clamp-2 dark:text-dark-400">
              {course.description}
            </p>

            {/* Resumen de clases */}
            <ul role="list" className="mt-3 space-y-1 border-t border-dark-100 pt-3 dark:border-dark-800">
              {[...course.lessons].sort((a, b) => a.order - b.order).slice(0, 3).map((l) => (
                <li key={l.id ?? l.order} className="flex items-center gap-1.5 text-caption text-dark-400 dark:text-dark-500">
                  <PlaySquare className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{l.order}. {l.title}</span>
                </li>
              ))}
              {course.lessons.length > 3 && (
                <li className="text-caption font-medium text-primary-600 dark:text-primary-400">
                  +{course.lessons.length - 3} clases más…
                </li>
              )}
              {course.lessons.length === 0 && (
                <li className="text-caption italic text-dark-400">Sin clases aún</li>
              )}
            </ul>

            <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-dark-100 pt-4 dark:border-dark-800">
              {course.type !== 'COURSE' && (
                <Button variant="outline" size="sm" onClick={() => setPaymentsCourse(course)}>
                  <Users className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Pagos / lista
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => openEdit(course)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Editar
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setDeletingId(course.id)}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Eliminar
              </Button>
            </div>
          </Card>
        ))}

        {!coursesLoading && courses.length === 0 && (
          <Card padding="lg" className="md:col-span-2 xl:col-span-3 text-center">
            <p className="text-body-md text-dark-500 dark:text-dark-400">
              No hay cursos en la base de datos. Crea el primero con «Nuevo curso».
            </p>
          </Card>
        )}
      </div>

      {/* ═══ Formulario de curso con editor de clases ═══ */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingCourse ? 'Editar curso' : 'Nuevo curso'}
        description={
          editingCourse
            ? `Modificando «${editingCourse.title}» · ${editingCourse.lessons.length} clases actuales`
            : 'Crea un curso, charla o evento y agrega sus clases con videos y recursos.'
        }
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Información general */}
          <fieldset className="space-y-4">
            <legend className="font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">
              Información general
            </legend>

            <Input
              label="Título"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej. Fundamentos de la Fe Cristiana"
            />

            <div>
              <span className="mb-2 block text-sm font-medium text-dark-700 dark:text-dark-300">Tipo</span>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: 'COURSE', label: 'Curso', icon: GraduationCap },
                  { value: 'TALK', label: 'Charla', icon: Mic2 },
                  { value: 'EVENT', label: 'Evento', icon: CalendarClock },
                ] as const).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        type: value,
                        modality:
                          value === 'COURSE'
                            ? ''
                            : f.modality || ('VIRTUAL' as CourseFormState['modality']),
                      }))
                    }
                    aria-pressed={form.type === value}
                    className={
                      form.type === value
                        ? 'flex items-center justify-center gap-2 rounded-lg border-2 border-primary-500 bg-primary-50 px-3 py-3 dark:bg-primary-900/20'
                        : 'flex items-center justify-center gap-2 rounded-lg border border-dark-200 px-3 py-3 hover:border-primary-300 dark:border-dark-700'
                    }
                  >
                    <Icon className={form.type === value ? 'h-4 w-4 text-primary-600 dark:text-primary-300' : 'h-4 w-4 text-dark-400'} aria-hidden="true" />
                    <span className={form.type === value ? 'text-body-sm font-medium text-primary-700 dark:text-primary-300' : 'text-body-sm text-dark-600 dark:text-dark-300'}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              label="Descripción del curso"
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <div>
              <span className="mb-1.5 block text-sm font-medium text-dark-700 dark:text-dark-300">
                Imagen de portada
              </span>
              <div className="flex items-start gap-3">
                {form.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.coverImage}
                    alt="Vista previa de la portada"
                    className="h-20 w-20 shrink-0 rounded-lg border border-dark-200 object-cover dark:border-dark-700"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleCoverUpload} aria-label="Subir imagen desde mi PC" />

                  {form.coverImage.startsWith('/api/uploads/') ? (
                    /* Imagen subida al servidor: sin rutas técnicas visibles */
                    <>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" loading={isUploadingCover} onClick={() => coverInputRef.current?.click()}>
                          Reemplazar foto
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, coverImage: '' })}>
                          Quitar
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, coverImage: '' })}>
                          Usar enlace externo
                        </Button>
                      </div>
                      <p className="text-caption text-green-600 dark:text-green-400">
                        Imagen guardada en el servidor ✓
                      </p>
                    </>
                  ) : (
                    /* Sin imagen o con enlace externo pegado */
                    <>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" loading={isUploadingCover} onClick={() => coverInputRef.current?.click()}>
                          Subir desde mi PC
                        </Button>
                        {form.coverImage && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, coverImage: '' })}>
                            Quitar
                          </Button>
                        )}
                      </div>
                      <Input
                        label=""
                        value={form.coverImage}
                        onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                        placeholder="…o pega aquí el enlace de una imagen (https://…)"
                      />
                      <p className="text-caption text-dark-400 dark:text-dark-500">
                        JPG, PNG, WebP o GIF · máx. 5 MB. Nota: las URLs de Facebook (fbcdn) expiran y no se muestran; prefiere subir desde tu PC.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </fieldset>

          {/* Clases / grabaciones — SOLO para tipo Curso */}
          {form.type === 'COURSE' && (
          <fieldset>
            <input
              ref={resourceInputRef}
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx,image/*"
              className="hidden"
              onChange={handleResourceUpload}
              aria-label="Subir documento descargable desde mi PC"
            />
            <legend className="mb-1 font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">
              Clases y grabaciones
            </legend>
            <p className="mb-4 text-caption text-dark-400 dark:text-dark-500">
              Acepta YouTube (watch/youtu.be), Google Drive o MP4 directo. Usa las flechas para reordenar. En recursos puedes subir varios archivos con nombre (PDF, PPT, DOC, imagen · máx. 25 MB) o pegar links de Drive/Mega.
            </p>

            <div className="space-y-4">
              {form.lessons.map((lesson, i) => (
                <Card key={i} padding="md" variant="outlined">
                  <div className="mb-3 flex items-center justify-between">
                    <Badge variant="primary" size="sm">Clase {i + 1}</Badge>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveLesson(i, -1)}
                        disabled={i === 0}
                        aria-label={`Subir clase ${i + 1}`}
                        className="rounded p-1.5 text-dark-400 hover:bg-dark-100 disabled:opacity-30 dark:hover:bg-dark-700"
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveLesson(i, 1)}
                        disabled={i === form.lessons.length - 1}
                        aria-label={`Bajar clase ${i + 1}`}
                        className="rounded p-1.5 text-dark-400 hover:bg-dark-100 disabled:opacity-30 dark:hover:bg-dark-700"
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLesson(i)}
                        disabled={form.lessons.length === 1}
                        aria-label={`Eliminar clase ${i + 1}`}
                        className="rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Título de la clase"
                      required
                      value={lesson.title}
                      onChange={(e) => updateLesson(i, { title: e.target.value })}
                      placeholder="Ej. Sesión 1: La Trinidad"
                    />
                    <Input
                      label="Link del video (YouTube / Drive / MP4)"
                      required
                      value={lesson.videoUrl}
                      onChange={(e) => updateLesson(i, { videoUrl: e.target.value })}
                      placeholder="https://youtu.be/... o https://drive.google.com/file/d/..."
                    />
                    {/* Lista de recursos con nombre */}
                    <div className="sm:col-span-2">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-sm font-medium text-dark-700 dark:text-dark-300">
                          Recursos descargables
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          loading={isUploadingResource && pendingResourceTarget.current?.lesson === i}
                          onClick={() => openResourcePicker(i, null)}
                        >
                          Subir archivo
                        </Button>
                      </div>

                      {form.lessons[i]?.resources.map((resource, ri) => (
                        <div key={ri} className="mb-2 flex items-start gap-2">
                          <Input
                            label=""
                            value={resource.name}
                            onChange={(e) => updateResource(i, ri, { name: e.target.value })}
                            placeholder="Nombre del recurso (ej. Diapositivas sesión 1)"
                            aria-label={`Nombre del recurso ${ri + 1}`}
                          />
                          <Input
                            label=""
                            value={resource.url}
                            onChange={(e) => updateResource(i, ri, { url: e.target.value })}
                            placeholder="Link Drive/Mega…"
                            aria-label={`URL del recurso ${ri + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => openResourcePicker(i, ri)}
                            disabled={isUploadingResource}
                            aria-label={`Reemplazar archivo del recurso ${ri + 1}`}
                            title="Reemplazar por archivo del servidor"
                            className="mt-1 rounded-lg border border-dark-200 px-2.5 py-2.5 text-caption font-medium text-dark-600 hover:bg-dark-100 disabled:opacity-40 dark:border-dark-600 dark:text-dark-300 dark:hover:bg-dark-800"
                          >
                            Subir
                          </button>
                          <button
                            type="button"
                            onClick={() => removeResource(i, ri)}
                            aria-label={`Eliminar recurso ${ri + 1}`}
                            className="mt-1 rounded-lg p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      ))}

                      {form.lessons[i]?.resources.some((r) => r.url.startsWith('/api/uploads/')) && (
                        <p className="text-caption text-green-600 dark:text-green-400">
                          Archivos guardados en el servidor ✓ · el visitante podrá descargarlos individualmente o todos a la vez
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => addResourceRow(i)}
                        className="text-caption font-medium text-primary-600 hover:underline dark:text-primary-400"
                      >
                        + Agregar recurso (link de Drive/Mega)
                      </button>
                    </div>
                    <Input
                      label="Duración (minutos) — opcional"
                      type="number"
                      min={1}
                      step={1}
                      value={lesson.durationSeconds ? Math.round(lesson.durationSeconds / 60) : ''}
                      onChange={(e) =>
                        updateLesson(i, {
                          durationSeconds: e.target.value ? Number(e.target.value) * 60 : undefined,
                        })
                      }
                    />
                  </div>

                  <div className="mt-3">
                    <div className="relative">
                      <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-dark-300" aria-hidden="true" />
                      <textarea
                        rows={2}
                        aria-label={`Descripción de la clase ${i + 1}`}
                        placeholder="Descripción breve de esta clase (opcional)"
                        value={lesson.description ?? ''}
                        onChange={(e) => updateLesson(i, { description: e.target.value })}
                        className="w-full rounded-lg border border-dark-300 bg-white py-2.5 pl-9 pr-4 text-body-sm placeholder-dark-400 focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-dark-600 dark:bg-dark-900 dark:text-dark-100"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={addLesson}>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Agregar clase
            </Button>
          </fieldset>
          )}

          {/* Detalles del evento/reunión — SOLO para Charla o Evento */}
          {form.type !== 'COURSE' && (
            <fieldset className="space-y-4 rounded-xl border border-dark-200 p-5 dark:border-dark-700">
              <legend className="px-2 font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">
                Detalles del {form.type === 'TALK' ? 'charla' : 'evento'} / reunión
              </legend>

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Modalidad"
                  options={[
                    { value: 'VIRTUAL', label: 'Virtual' },
                    { value: 'IN_PERSON', label: 'Presencial' },
                    { value: 'HYBRID', label: 'Híbrido' },
                  ]}
                  value={form.modality || 'VIRTUAL'}
                  onChange={(e) => setForm({ ...form, modality: e.target.value as CourseFormState['modality'] })}
                />

                <Input
                  label="Fecha y hora del evento"
                  type="datetime-local"
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                />
              </div>

              {(form.modality === 'IN_PERSON' || form.modality === 'HYBRID') && (
                <Input
                  label="Dirección o lugar (local, auditorio…)"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Ej. Auditorio Central, Av. Principal 123"
                />
              )}

              {(form.modality === 'VIRTUAL' || form.modality === 'HYBRID') && (
                <Input
                  label="Enlace de reunión (Zoom / Meet / Teams)"
                  type="url"
                  value={form.meetingLink}
                  onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                />
              )}

              <Input
                label="Enlace de grabación post-evento (opcional)"
                type="url"
                value={form.recordingLink}
                onChange={(e) => setForm({ ...form, recordingLink: e.target.value })}
                placeholder="Pega aquí la grabación cuando finalice (YouTube/Drive/Mega)"
              />

              <p className="text-caption text-dark-400 dark:text-dark-500">
                Los campos mostrados dependen de la modalidad elegida. La grabación puede añadirse después del evento.
              </p>
            </fieldset>
          )}

          {/* Costo de inscripción — SOLO para Charla o Evento */}
          {form.type !== 'COURSE' && (
            <fieldset className="space-y-3 rounded-xl border border-primary-100 bg-primary-50/40 p-5 dark:border-primary-900/40 dark:bg-primary-900/10">
              <legend className="px-2 font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">
                Costo de inscripción
              </legend>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-body-sm text-dark-600 dark:text-dark-300">
                  Soles (S/) y Dólares (US$).
                </p>
                {tipoCambioCargando ? (
                  <span className="flex items-center gap-1.5 text-caption text-dark-400 dark:text-dark-500">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    Consultando tipo de cambio…
                  </span>
                ) : (
                  <button type="button" onClick={cargarTipoCambio} className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-caption font-medium text-primary-700 shadow-sm transition hover:bg-primary-50 dark:bg-dark-800 dark:text-primary-300 dark:hover:bg-dark-700">
                    <RefreshCw className="h-3 w-3" aria-hidden="true" />
                    US$1 = S/ {tipoCambio.valor.toFixed(2)} · {fuenteLabel}
                  </button>
                )}
              </div>

              <p className="text-caption text-dark-400 dark:text-dark-500">
                Escribe en Soles o Dólares y te sugerimos el equivalente con el tipo de cambio de SUNAT. El campo contrario
                <strong> no se rellena solo</strong>: si quieres, pulsa «Usar sugerencia» para aprobarlo, o deja tus precios personalizados.
                Si ambos quedan vacíos, el evento es Gratis.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Precio en Soles (S/)"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Ej. 56.00"
                  value={form.pricePEN}
                  onChange={(e) => alEditarPrecio('pen', e.target.value)}
                />
                <Input
                  label="Precio en Dólares (US$)"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Ej. 15.00"
                  value={form.priceUSD}
                  onChange={(e) => alEditarPrecio('usd', e.target.value)}
                />
              </div>

              {sugerencia && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-caption font-medium text-primary-700 dark:text-primary-300">
                    {sugerencia.destino === 'pen'
                      ? `Equivalente por SUNAT: S/ ${sugerencia.valor.toFixed(2)}`
                      : `Equivalente por SUNAT: US$ ${sugerencia.valor.toFixed(2)}`}
                  </span>
                  <button
                    type="button"
                    onClick={aprobarSugerencia}
                    className="rounded-lg bg-primary-600 px-3 py-1.5 text-caption font-semibold text-white transition hover:bg-primary-700"
                  >
                    Usar sugerencia
                  </button>
                </div>
              )}

              {!form.pricePEN.trim() && !form.priceUSD.trim() && (
                <p className="text-caption font-medium text-green-600 dark:text-green-400">
                  Evento Gratis (sin costo de inscripción)
                </p>
              )}

              <Input
                label="Cupo máximo de inscritos (capacidad) · opcional"
                type="number"
                min={0}
                step={1}
                placeholder="Ej. 40 — vacío = sin límite"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </fieldset>
          )}

          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-body-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-dark-100 pt-4 dark:border-dark-800">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSaving}>
              {editingCourse ? 'Guardar cambios' : 'Publicar curso'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmación de borrado */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar curso"
        message={`¿Seguro que deseas eliminar «${courses.find((c) => c.id === deletingId)?.title ?? ''}» y todas sus clases? Esta acción no se puede deshacer.`}
        confirmText="Eliminar todo"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Lista de pagos de un evento */}
      {paymentsCourse && (
        <CoursePaymentsModal course={paymentsCourse} onClose={() => setPaymentsCourse(null)} />
      )}
    </div>
  );
}