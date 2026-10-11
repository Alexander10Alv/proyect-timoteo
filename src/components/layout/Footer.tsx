'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Heart, BookOpen, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, ChevronUp, User2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Logo } from './Logo';
import { useSiteStore } from '@/store/siteStore';
import { useAppStore } from '@/store';

const footerLinks = {
  ministerio: [
    { name: 'Nosotros', href: '/#nosotros' },
    { name: 'Nuestro Enfoque', href: '#enfoque' },
    { name: 'Nuestra Esperanza', href: '#esperanza' },
    { name: 'Liderazgo', href: '#liderazgo' },
  ],
  recursos: [
    { name: 'Cursos', href: '/educacion?type=COURSE' },
    { name: 'Charlas', href: '/educacion?type=TALK' },
    { name: 'Eventos', href: '/educacion?type=EVENT' },
    { name: 'Mapa Global', href: '/#mapa' },
  ],
  involucrate: [
    { name: 'Donar', href: '/donar' },
    { name: 'Suscribirse', href: '#suscribirse' },
    { name: 'Voluntariado', href: '#voluntariado' },
    { name: 'Contacto', href: '#contacto' },
  ],
  legal: [
    { name: 'Privacidad', href: '#privacidad' },
    { name: 'Términos', href: '#terminos' },
    { name: 'Cookies', href: '#cookies' },
    { name: 'Accesibilidad', href: '#accesibilidad' },
  ],
};

const socialLinks = [
  { name: 'Facebook', href: 'https://facebook.com', icon: Facebook },
  { name: 'Twitter', href: 'https://twitter.com', icon: Twitter },
  { name: 'Instagram', href: 'https://instagram.com', icon: Instagram },
  { name: 'YouTube', href: 'https://youtube.com', icon: Youtube },
];

const contactInfo = {
  address: 'Calle Principal 123, Ciudad, País',
  phone: '+1 (555) 123-4567',
  email: 'contacto@proyectotimoteo.org',
};

export function Footer() {
  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const siteName = useSiteStore((s) => s.siteName);
  const tagline = useSiteStore((s) => s.footer.tagline);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > document.documentElement.scrollHeight * 0.45);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="navbar-solid text-dark-300" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-6">
            <Logo boxClassName="h-10 w-10" iconClassName="h-6 w-6" textClassName="text-heading-lg text-white" />
            
            <p className="text-body-md text-sky-200/80 max-w-xs">
              {tagline}
            </p>

            <NewsletterForm siteName={siteName} />

            <div className="flex flex-wrap gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-300/20 bg-sky-950/40 text-sky-200/90 hover:border-[#f9c075] hover:bg-sky-500/30 hover:text-white transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" aria-hidden="true" />
                </a>
              ))}
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-sky-200/80">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-sky-400" aria-hidden="true" />
                <span>{contactInfo.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-sky-400" aria-hidden="true" />
                <span>{contactInfo.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-sky-400" aria-hidden="true" />
                <span>{contactInfo.email}</span>
              </div>
            </div>
          </div>

          <nav aria-label="Enlaces del ministerio">
            <h3 className="text-heading-sm font-semibold text-white mb-4">Ministerio</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.ministerio.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-dark-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Recursos educativos">
            <h3 className="text-heading-sm font-semibold text-white mb-4">Recursos</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.recursos.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-dark-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Involúcrate">
            <h3 className="text-heading-sm font-semibold text-white mb-4">Involúcrate</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.involucrate.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-dark-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Información legal">
            <h3 className="text-heading-sm font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-dark-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 pt-8 border-t border-sky-300/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-body-sm text-sky-200/60">
              © {new Date().getFullYear()} {siteName}. Todos los derechos reservados.
            </p>
            
            <p className="text-body-sm text-sky-200/60">
              Desarrollado con propósito para la gloria de Dios.
            </p>
          </div>
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg hover:bg-sky-400 transition-all focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-dark-950"
          aria-label="Volver arriba"
        >
          <ChevronUp className="h-6 w-6" aria-hidden="true" />
        </button>
      )}
    </footer>
  );
}

/** Suscripción al boletín (solo para usuarios registrados, vía /api/subscribers). */
function NewsletterForm({ siteName }: { siteName: string }) {
  const { user, isAuthenticated, openLoginModal } = useAppStore();
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = React.useState('');

  const handleSubscribe = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribers', { method: 'POST' });
      const data = (await res.json().catch(() => null)) as { reactivated?: boolean; error?: string } | null;

      if (res.ok) {
        setStatus('success');
        setMessage(data?.reactivated ? '¡Bienvenido de nuevo! Reactivamos tu suscripción.' : '¡Gracias! Te suscribiste al boletín.');
      } else if (res.status === 409) {
        setStatus('error');
        setMessage(data?.error ?? 'Ya estás suscrito al boletín.');
      } else if (res.status === 401) {
        setStatus('error');
        setMessage('Debes iniciar sesión para suscribirte.');
      } else {
        setStatus('error');
        setMessage(data?.error ?? 'No pudimos procesar tu suscripción.');
      }
    } catch {
      setStatus('error');
      setMessage('Error de conexión. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="max-w-xs space-y-2">
      <h3 className="text-heading-sm font-semibold text-white mb-1">Boletín {siteName}</h3>
      <p className="text-caption text-sky-200/70 mb-3">
        Recibe reflexiones y novedades del ministerio. Solo para miembros registrados.
      </p>

      {isAuthenticated && user ? (
        <>
          <div className="rounded-lg border border-sky-300/30 bg-sky-950/40 px-3 py-2">
            <p className="text-caption text-white font-medium">{user.name} · {user.email}</p>
            <p className="text-caption text-sky-200/60 mt-0.5">
              Al suscribirte guardamos los datos de tu cuenta (celular, iglesia y país).
            </p>
          </div>
          <button
            onClick={() => void handleSubscribe()}
            disabled={status === 'loading'}
            className="inline-flex w-full items-center justify-center rounded-lg bg-sky-500 px-3 py-2 text-body-sm font-medium text-white shadow-md shadow-sky-950/30 transition-colors hover:border-[#f9c075] hover:bg-sky-400 disabled:opacity-60"
            aria-label="Suscribirme al boletín"
          >
            {status === 'loading' ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                Suscribirme al boletín
              </>
            )}
          </button>
        </>
      ) : (
        <>
          <p className="text-caption text-sky-200/70">
            Crea tu cuenta o inicia sesión para suscribirte. Te pediremos tus datos (nombre, celular e iglesia) para mantenerte al tanto.
          </p>
          <button
            onClick={() => openLoginModal('register')}
            className="inline-flex w-full items-center justify-center rounded-lg bg-sky-500 px-3 py-2 text-body-sm font-medium text-white shadow-md shadow-sky-950/30 transition-colors hover:border-[#f9c075] hover:bg-sky-400"
            aria-label="Crear cuenta o iniciar sesión"
          >
            <User2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Crear cuenta / Iniciar sesión
          </button>
        </>
      )}

      {status === 'success' && (
        <p className="mt-1.5 flex items-start gap-1.5 text-caption text-green-400" role="status">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {message}
        </p>
      )}
      {status === 'error' && (
        <p className="mt-1.5 flex items-start gap-1.5 text-caption text-amber-400" role="alert">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {message}
        </p>
      )}
    </div>
  );
}