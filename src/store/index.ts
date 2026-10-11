import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  User,
  Course,
  CourseInput,
  JoshuaProjectCountry,
  JpCountry,
  Donation,
  Subscription,
  AuthState,
  NotificationLogEntry,
  SubscriptionStatus,
  Article,
  Category,
  Subscriber,
  Missionary,
} from '@/types';
import { alpha3FromAlpha2 } from '@/lib/isoAlpha3';

interface AppStore extends AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  users: User[];
  courses: Course[];
  countries: JoshuaProjectCountry[];
  donations: Donation[];
  subscriptions: Subscription[];
  notificationLogs: NotificationLogEntry[];
  articles: Article[];
  categories: Category[];
  allCategories: Category[];
  subscribers: Subscriber[];
  missionaries: Missionary[];
  missionariesLoading: boolean;
  articlesLoading: boolean;
  articlesError: string | null;
  subscribersLoading: boolean;

  countryModal: {
    isOpen: boolean;
    country: JoshuaProjectCountry | null;
  };

  loginModal: {
    isOpen: boolean;
    mode: 'login' | 'register';
  };

  donationModal: {
    isOpen: boolean;
    preselectedCountryId?: string;
  };

  login: (email: string, password: string) => Promise<boolean>;
  register: (data: {
    name: string;
    lastName: string;
    email: string;
    password: string;
    countryCode?: string;
    phone?: string;
    church?: string;
  }) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User | null) => void;
  fetchUsers: () => Promise<void>;
  usersLoading: boolean;
  usersError: string | null;

  fetchCountries: () => Promise<void>;
  countriesLoading: boolean;
  countriesError: string | null;

  fetchCourses: () => Promise<void>;
  createCourse: (input: CourseInput) => Promise<Course | null>;
  updateCourse: (id: string, input: CourseInput) => Promise<Course | null>;
  deleteCourse: (id: string) => Promise<boolean>;
  coursesLoading: boolean;
  coursesError: string | null;

  addDonation: (donation: Omit<Donation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSubscriptionStatus: (subscriptionId: string, status: SubscriptionStatus) => void;
  enrollInCourse: (courseId: string) => void;
  /** Marca el curso como inscrito sin toggle (nunca lo desinscribe). Tras un pago. */
  addEnrolledCourse: (courseId: string) => void;

  logNotification: (entry: Omit<NotificationLogEntry, 'id' | 'createdAt'>) => void;

  openCountryModal: (country: JoshuaProjectCountry) => void;
  closeCountryModal: () => void;

  openLoginModal: (mode?: 'login' | 'register') => void;
  closeLoginModal: () => void;

  openDonationModal: (countryId?: string) => void;
  closeDonationModal: () => void;

  fetchArticles: () => Promise<void>;
  fetchPublishedArticles: () => Promise<Article[]>;
  createArticle: (payload: Record<string, unknown>) => Promise<{ article: Article } | null>;
  updateArticle: (id: string, payload: Record<string, unknown>) => Promise<{ article: Article } | null>;
  deleteArticle: (id: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchAllCategories: () => Promise<void>;
  fetchSubscribers: () => Promise<void>;
  fetchMissionaries: () => Promise<void>;
  subscribe: (email: string) => Promise<{ subscriber: Subscriber; reactivated?: boolean }>;
}

const STORAGE_KEY = 'heartcry-storage';

/**
 * Convierte la estructura JpCountry (ISO-2, de MySQL) en el formato de vista
 * que consume el frontend (mapa/cards/ficheros). id = ISO-2 (PE), code =
 * Alpha-3 (PER) para cruzar con el TopoJSON del mapa.
 */
function toViewCountry(raw: JpCountry): JoshuaProjectCountry {
  const language = raw.primaryLanguage ?? 'No especificado';
  const religion = raw.primaryReligion ?? 'No especificado';
  return {
    id: raw.countryCode,
    code: alpha3FromAlpha2(raw.countryCode) ?? raw.countryCode.toUpperCase(),
    name: raw.countryName,
    totalPopulation: raw.totalPopulation,
    ethnicGroupsCount: raw.totalPeopleGroups,
    unreachedGroups: raw.unreachedPeopleGroups,
    primaryLanguage: language,
    primaryReligion: religion,
    christianPercentage: raw.christianAdherentsPct,
    evangelicalPercentage: raw.evangelicalPct,
    progressBarValue: Math.round(100 - raw.unreachedPct),
    flagUrl: raw.flagUrl,
    heroImage: raw.heroImage,
    overviewText: `En ${raw.countryName} se registran ${raw.totalPeopleGroups} grupos étnicos, de los cuales ${raw.unreachedPeopleGroups} permanecen sin alcanzar (${raw.unreachedPct}% del total). Con una población de ${raw.totalPopulation.toLocaleString('es')} habitantes y ${raw.frontierPeopleGroups} grupos considerados de frontera, el idioma predominante es ${language} y la religión principal, ${religion}.`,
    totalDonations: 0,
    donationCount: 0,
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      users: [],
      courses: [],
      countries: [],
      donations: [],
       subscriptions: [],
      notificationLogs: [],
      articles: [],
      categories: [],
      allCategories: [],
      subscribers: [],
      missionaries: [],
      missionariesLoading: false,
      articlesLoading: false,
      articlesError: null,
      subscribersLoading: false,

      usersLoading: false,
      usersError: null,

      countriesLoading: false,
      countriesError: null,

      coursesLoading: false,
      coursesError: null,

      countryModal: {
        isOpen: false,
        country: null,
      },

      loginModal: {
        isOpen: false,
        mode: 'login',
      },

      donationModal: {
        isOpen: false,
        preselectedCountryId: undefined,
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            set({ isLoading: false });
            return false;
          }

          const data = (await response.json()) as { user: User };
          const user: User = { ...data.user, createdAt: new Date(data.user.createdAt) };

          set({
            user,
            token: 'session-' + Date.now(),
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch {
          set({ isLoading: false });
          return false;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const err = (await response.json().catch(() => null)) as { error?: string } | null;
            set({
              isLoading: false,
              usersError: err?.error ?? 'No se pudo completar el registro.',
            });
            return false;
          }

          const resData = (await response.json()) as { user: User };
          const newUser: User = { ...resData.user, createdAt: new Date(resData.user.createdAt) };

          // El usuario recién creado ya existe en MySQL; lo incorporamos al estado local
          // y sincronizamos su suscripción vacía hasta el próximo fetchUsers().
          set((state) => {
            const alreadyListed = state.users.some((u) => u.id === newUser.id);
            return {
              users: alreadyListed
                ? state.users.map((u) => (u.id === newUser.id ? newUser : u))
                : [newUser, ...state.users],
            };
          });

          set({
            user: newUser,
            token: 'session-' + Date.now(),
            isAuthenticated: true,
            isLoading: false,
          });
          void get().fetchUsers();
          return true;
        } catch {
          set({ isLoading: false, usersError: 'Error de conexión con el servidor.' });
          return false;
        }
      },

      fetchUsers: async () => {
        set({ usersLoading: true, usersError: null });
        try {
          const response = await fetch('/api/users');
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const data = (await response.json()) as {
            users: Array<{
              id: string;
              name: string;
              lastName: string | null;
              email: string;
              role: 'ADMIN' | 'VISITOR';
              country: string | null;
              church: string | null;
              createdAt: string;
              subscription: {
                id: string;
                email: string;
                phone?: string | null;
                receiveWhatsApp: boolean;
                receiveEmail: boolean;
                enrolledCourses: string[];
                status: SubscriptionStatus;
                updatedAt: string;
              } | null;
            }>;
          };

          const users: User[] = data.users.map((u) => ({
            id: u.id,
            name: u.name,
            lastName: u.lastName ?? undefined,
            email: u.email,
            role: u.role,
            country: u.country ?? undefined,
            church: u.church ?? undefined,
            phone: u.subscription?.phone ?? undefined,
            createdAt: new Date(u.createdAt),
          }));

          const subscriptions: Subscription[] = data.users
            .filter((u) => u.subscription)
            .map((u) => ({
              id: u.subscription!.id,
              userId: u.id,
              email: u.subscription!.email,
              phone: u.subscription!.phone ?? undefined,
              receiveWhatsApp: u.subscription!.receiveWhatsApp,
              receiveEmail: u.subscription!.receiveEmail,
              enrolledCourses: u.subscription!.enrolledCourses,
              status: u.subscription!.status,
              createdAt: new Date(u.createdAt),
              updatedAt: new Date(u.subscription!.updatedAt),
            }));

          set({ users, subscriptions, usersLoading: false });
        } catch (error) {
          console.error('[fetchUsers]', error);
          set({
            usersLoading: false,
            usersError:
              'No se pudo cargar los usuarios desde la base de datos. Verifica que MySQL esté activo y `npx prisma db push` ejecutado.',
          });
        }
      },

      fetchCountries: async () => {
        if (get().countriesLoading) return;
        set({ countriesLoading: true, countriesError: null });
        try {
          const response = await fetch('/api/jp/countries');
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const data = (await response.json()) as { countries: JpCountry[] };
          set({ countries: data.countries.map(toViewCountry), countriesLoading: false });
        } catch (error) {
          console.error('[fetchCountries]', error);
          set({
            countriesLoading: false,
            countriesError:
              'No se pudo cargar los países desde la base de datos. Verifica que MySQL esté activo y `npm run db:seed` ejecutado.',
          });
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      fetchCourses: async () => {
        set({ coursesLoading: true, coursesError: null });
        try {
          const response = await fetch('/api/courses');
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const data = (await response.json()) as { courses: Course[] };
          const courses = data.courses.map((c) => ({
            ...c,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
            eventDate: c.eventDate ? new Date(c.eventDate) : undefined,
          }));

          set({ courses, coursesLoading: false });
        } catch (error) {
          console.error('[fetchCourses]', error);
          set({
            coursesLoading: false,
            coursesError:
              'No se pudo cargar los cursos desde la base de datos. Verifica que MySQL esté activo y ejecuta `npm run db:seed`.',
          });
        }
      },

      createCourse: async (input) => {
        try {
          const response = await fetch('/api/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
          });
          if (!response.ok) {
            const err = (await response.json().catch(() => null)) as { error?: string } | null;
            set({ coursesError: err?.error ?? 'No se pudo crear el curso.' });
            return null;
          }
          const data = (await response.json()) as { course: Course };
          const course: Course = {
            ...data.course,
            createdAt: new Date(data.course.createdAt),
            updatedAt: new Date(data.course.updatedAt),
            eventDate: data.course.eventDate ? new Date(data.course.eventDate) : undefined,
          };
          set((state) => ({ courses: [course, ...state.courses], coursesError: null }));
          return course;
        } catch {
          set({ coursesError: 'Error de conexión con el servidor.' });
          return null;
        }
      },

      updateCourse: async (id, input) => {
        try {
          const response = await fetch(`/api/courses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
          });
          if (!response.ok) {
            const err = (await response.json().catch(() => null)) as { error?: string } | null;
            set({ coursesError: err?.error ?? 'No se pudo actualizar el curso.' });
            return null;
          }
          const data = (await response.json()) as { course: Course };
          const updated: Course = {
            ...data.course,
            createdAt: new Date(data.course.createdAt),
            updatedAt: new Date(data.course.updatedAt),
            eventDate: data.course.eventDate ? new Date(data.course.eventDate) : undefined,
          };
          set((state) => ({
            courses: state.courses.map((c) => (c.id === id ? updated : c)),
            coursesError: null,
          }));
          return updated;
        } catch {
          set({ coursesError: 'Error de conexión con el servidor.' });
          return null;
        }
      },

      deleteCourse: async (id) => {
        try {
          const response = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
          if (!response.ok) {
            set({ coursesError: 'No se pudo eliminar el curso.' });
            return false;
          }
          set((state) => ({
            courses: state.courses.filter((c) => c.id !== id),
            coursesError: null,
          }));
          return true;
        } catch {
          set({ coursesError: 'Error de conexión con el servidor.' });
          return false;
        }
      },

      addDonation: (donationData) => {
        const newDonation: Donation = {
          ...donationData,
          id: 'donation-' + Date.now(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          donations: [newDonation, ...state.donations],
        }));

        if (donationData.targetCountryId) {
          set((state) => ({
            countries: state.countries.map((c) =>
              c.id === donationData.targetCountryId
                ? {
                    ...c,
                    totalDonations: (c.totalDonations || 0) + donationData.amount,
                    donationCount: (c.donationCount || 0) + 1,
                  }
                : c
            ),
          }));
        }
      },

      updateSubscriptionStatus: (subscriptionId, status) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === subscriptionId ? { ...s, status, updatedAt: new Date() } : s
          ),
        }));
      },

      enrollInCourse: (courseId) => {
        set((state) => {
          const user = state.user;
          if (!user) return {};

          const subscription = state.subscriptions.find((s) => s.userId === user.id);
          if (!subscription) {
            const created: Subscription = {
              id: 'sub-' + Date.now(),
              userId: user.id,
              email: user.email,
              phone: user.phone,
              receiveWhatsApp: false,
              receiveEmail: true,
              enrolledCourses: [courseId],
              status: 'ACTIVE',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            return { subscriptions: [...state.subscriptions, created] };
          }

          const isEnrolled = subscription.enrolledCourses.includes(courseId);
          const newEnrolled = isEnrolled
            ? subscription.enrolledCourses.filter((id) => id !== courseId)
            : [...subscription.enrolledCourses, courseId];

          return {
            subscriptions: state.subscriptions.map((s) =>
              s.id === subscription.id
                ? { ...s, enrolledCourses: newEnrolled, updatedAt: new Date() }
                : s
            ),
          };
        });
      },

      addEnrolledCourse: (courseId) => {
        set((state) => {
          const user = state.user;
          if (!user) return {};

          const subscription = state.subscriptions.find((s) => s.userId === user.id);
          if (!subscription) {
            const created: Subscription = {
              id: 'sub-' + Date.now(),
              userId: user.id,
              email: user.email,
              phone: user.phone,
              receiveWhatsApp: false,
              receiveEmail: true,
              enrolledCourses: [courseId],
              status: 'ACTIVE',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            return { subscriptions: [...state.subscriptions, created] };
          }

          if (subscription.enrolledCourses.includes(courseId)) return {};

          return {
            subscriptions: state.subscriptions.map((s) =>
              s.id === subscription.id
                ? { ...s, enrolledCourses: [...s.enrolledCourses, courseId], updatedAt: new Date() }
                : s
            ),
          };
        });
      },

      logNotification: (entry) => {
        set((state) => ({
          notificationLogs: [
            { ...entry, id: 'notif-' + Date.now(), createdAt: new Date() },
            ...state.notificationLogs,
          ].slice(0, 50),
        }));
      },

      openCountryModal: (country) => {
        set({ countryModal: { isOpen: true, country } });
      },

      closeCountryModal: () => {
        set({ countryModal: { isOpen: false, country: null } });
      },

      openLoginModal: (mode = 'login') => {
        set({ loginModal: { isOpen: true, mode } });
      },

      closeLoginModal: () => {
        set({ loginModal: { isOpen: false, mode: 'login' } });
      },

      openDonationModal: (countryId) => {
        set({ donationModal: { isOpen: true, preselectedCountryId: countryId } });
      },

      closeDonationModal: () => {
        set({ donationModal: { isOpen: false, preselectedCountryId: undefined } });
      },

      /* ── Artículos ── */
      fetchArticles: async () => {
        set({ articlesLoading: true, articlesError: null });
        try {
          const res = await fetch('/api/articles?limit=100');
          const data = (await res.json()) as { articles: Article[] };
          set({ articles: data.articles, articlesLoading: false });
        } catch {
          set({ articlesLoading: false, articlesError: 'No se pudieron cargar los artículos.' });
        }
      },

      fetchPublishedArticles: async () => {
        try {
          const res = await fetch('/api/articles?status=PUBLISHED&limit=100');
          const data = (await res.json()) as { articles: Article[] };
          return data.articles;
        } catch {
          return [];
        }
      },

      createArticle: async (payload: Record<string, unknown>) => {
        const res = await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { article: Article };
        if (res.ok) {
          set((state) => ({ articles: [...state.articles, data.article] }));
        }
        return data;
      },

      updateArticle: async (id: string, payload: Record<string, unknown>) => {
        const res = await fetch(`/api/articles/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { article: Article };
        if (res.ok) {
          set((state) => ({
            articles: state.articles.map((a) => (a.id === id ? data.article : a)),
          }));
        }
        return data;
      },

      deleteArticle: async (id: string) => {
        const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
        if (res.ok) {
          set((state) => ({ articles: state.articles.filter((a) => a.id !== id) }));
        }
      },

      fetchCategories: async () => {
        try {
          const res = await fetch('/api/categories');
          const data = (await res.json()) as { categories: Category[] };
          set({ categories: data.categories });
        } catch {
          /* silencioso */
        }
      },

      fetchAllCategories: async () => {
        try {
          const res = await fetch('/api/categories?all=true');
          const data = (await res.json()) as { categories: Category[] };
          set({ allCategories: data.categories });
        } catch {
          /* silencioso */
        }
      },

      fetchSubscribers: async () => {
        set({ subscribersLoading: true });
        try {
          const res = await fetch('/api/subscribers');
          const data = (await res.json()) as { subscribers: Subscriber[] };
          set({ subscribers: data.subscribers, subscribersLoading: false });
        } catch {
          set({ subscribersLoading: false });
        }
      },

      fetchMissionaries: async () => {
        set({ missionariesLoading: true });
        try {
          const res = await fetch('/api/missionaries');
          const data = (await res.json()) as { missionaries: Missionary[] };
          set({ missionaries: data.missionaries, missionariesLoading: false });
        } catch {
          set({ missionariesLoading: false });
        }
      },

      subscribe: async (email: string) => {
        const res = await fetch('/api/subscribers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        return (await res.json()) as { subscriber: Subscriber; reactivated?: boolean };
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Solo se persisten sesión y contenido creado en cliente.
      // Los usuarios/suscripciones provienen SIEMPRE de MySQL vía /api/users.
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        donations: state.donations,
        notificationLogs: state.notificationLogs,
      }),
    }
  )
);

// Selectores de autorización reutilizables
export const selectIsAdmin = (state: AppStore): boolean =>
  state.isAuthenticated && state.user?.role === 'ADMIN';