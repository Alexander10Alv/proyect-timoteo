export type UserRole = 'ADMIN' | 'VISITOR';

export interface User {
  id: string;
  name: string;
  lastName?: string;
  email: string;
  role: UserRole;
  country?: string;
  church?: string;
  phone?: string;
  createdAt: Date;
}

export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export interface Subscription {
  id: string;
  userId: string;
  email: string;
  phone?: string;
  receiveWhatsApp: boolean;
  receiveEmail: boolean;
  enrolledCourses: string[];
  status: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationLogEntry {
  id: string;
  channel: 'WHATSAPP' | 'EMAIL';
  templateId: string;
  message: string;
  totalSent: number;
  totalFailed: number;
  recipientCount: number;
  sentByUserId: string;
  mode: 'mock' | 'live';
  createdAt: Date;
}

export interface JoshuaProjectCountry {
  id: string;
  code: string;
  name: string;
  totalPopulation: number;
  ethnicGroupsCount: number;
  unreachedGroups: number;
  primaryLanguage: string;
  primaryReligion: string;
  christianPercentage: number;
  evangelicalPercentage: number;
  progressBarValue: number;
  overviewText?: string;
  flagUrl?: string;
  heroImage?: string;
  totalDonations?: number;
  donationCount?: number;
}

export type PostType = 'COURSE' | 'TALK' | 'EVENT';

export type Modality = 'VIRTUAL' | 'IN_PERSON' | 'HYBRID';

export interface Course {
  id: string;
  title: string;
  type: PostType;
  description: string;
  coverImage?: string;
  createdById: string;
  authorName?: string;
  authorEmail?: string;
  lessons: CourseLesson[];
  modality?: Modality;
  location?: string;
  eventDate?: Date;
  meetingLink?: string;
  recordingLink?: string;
  /** Precio en soles (S/). null/undefined = gratis */
  pricePEN?: number | null;
  /** Precio en dólares (US$). null/undefined = gratis */
  priceUSD?: number | null;
  capacity?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonResource {
  id?: string;
  name: string;
  url: string;
}

export interface CourseLesson {
  id?: string;
  courseId?: string;
  title: string;
  description?: string;
  videoUrl: string;
  resourcesUrl?: string;
  durationSeconds?: number;
  order: number;
  resources: LessonResource[];
}

export interface CourseInput {
  title: string;
  type: PostType;
  description: string;
  coverImage?: string;
  authorEmail: string;
  modality?: Modality;
  location?: string;
  eventDate?: string;
  meetingLink?: string;
  recordingLink?: string;
  pricePEN?: number | null;
  priceUSD?: number | null;
  capacity?: number | null;
  lessons: Array<{
    title: string;
    description?: string;
    videoUrl: string;
    resourcesUrl?: string;
    durationSeconds?: number;
    order: number;
    resources?: Array<{ name: string; url: string }>;
  }>;
}

export type DonationStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type PurchaseMethod = 'CARD' | 'PAYPAL' | 'MANUAL' | 'FREE';
export type PurchaseStatus = 'COMPLETED' | 'REFUNDED' | 'FAILED';

export interface CoursePurchase {
  id: string;
  courseId: string;
  userId?: string | null;
  name: string;
  email: string;
  amount: number;
  currency: string;
  method: PurchaseMethod;
  transactionId?: string | null;
  status: PurchaseStatus;
  attended: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Donation {
  id: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  targetCountryId?: string;
  targetCountry?: JoshuaProjectCountry;
  status: DonationStatus;
  method?: 'CARD' | 'PAYPAL';
  createdAt: Date;
  updatedAt: Date;
}

export interface CountryModalData {
  country: JoshuaProjectCountry;
  isOpen: boolean;
}

export interface DonationFormData {
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  targetCountryId?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  country?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface CourseFilters {
  type?: PostType;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ════════ JOSHUA PROJECT — estructura completa ════════

export interface JpCountry {
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
  primaryLanguage?: string;
  primaryReligion?: string;
}

export type PeopleGroupFlag = 'isUnreached' | 'isFrontier' | 'isIndigenous' | 'isDiaspora';

export interface JpPeopleGroup {
  id: string;
  peopCode: string;
  countryCode: string;
  peopleName: string;
  populationInCountry: number;
  populationGlobal?: number;
  isUnreached: boolean;
  isFrontier: boolean;
  isIndigenous: boolean;
  isDiaspora: boolean;
  primaryLanguage: string;
  primaryLanguageCode?: string;
  primaryReligion: string;
  evangelicalPct?: number;
  percentAdherents?: number;
  progressScale?: number;
  workersNeeded?: number;
  countOfCountries?: number;
  provinceRegion?: string;
  description?: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface JpProvince {
  provinceId: string;
  provinceName: string;
  countryCode: string;
  population?: number;
  unreachedCount?: number;
}

export interface JpMinistry {
  id: number;
  ministryName: string;
  ministryType?: string;
  countryCode?: string;
  peopCode?: string;
  contactInfo?: string;
}

export interface JpCountryProfile {
  country: JpCountry;
  peopleGroups: JpPeopleGroup[];
  provinces: JpProvince[];
  ministries: JpMinistry[];
}

export type ArticleStatus = 'DRAFT' | 'PUBLISHED';

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  content: string;
  status: ArticleStatus;
  publishedAt: string | null;
  createdById: string | null;
  createdBy: { name: string; email: string } | null;
  categoryId: string | null;
  category: Category | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  active?: boolean;
  articles?: Article[];
}

export type SubscriberStatus = 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED';

export interface Subscriber {
  id: string;
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  church: string | null;
  country: string | null;
  subscribedAt: string;
  status: SubscriberStatus;
  unsubscribedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MissionaryStatus = 'ACTIVE' | 'INACTIVE';

export interface MissionaryStory {
  id: number;
  missionaryId: number;
  title: string;
  body: string;
  storyDate: string | null;
  order: number;
}

export interface Missionary {
  id: number;
  name: string;
  role: string | null;
  slug: string;
  bio: string | null;
  photoUrl: string | null;
  videoUrl?: string | null;
  status: MissionaryStatus;
  countryCode: string | null;
  countryName: string | null;
  peopCode: string | null;
  peopleName: string | null;
  stories: MissionaryStory[];
  createdAt: string;
  updatedAt: string;
}