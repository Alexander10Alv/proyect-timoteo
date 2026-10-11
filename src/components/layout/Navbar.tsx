'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { Separator } from '@/components/ui/Separator';
import { Menu, X, Globe, BookOpen, MapPin, Heart, Newspaper, LogIn, User, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store';
import { Logo } from './Logo';

const navigation = [
  { name: 'Nosotros', href: '/#nosotros', icon: BookOpen },
  { name: 'Misioneros', href: '/#misioneros', icon: Heart },
  { name: 'Eventos', href: '/educacion', icon: BookOpen },
  { name: 'Artículos', href: '/articulos', icon: Newspaper },
  { name: 'Mapa Global', href: '/#mapa', icon: Globe },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, openLoginModal } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!userMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [userMenuOpen]);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    // Borra la cookie httpOnly de sesión en el server además del estado local.
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
    logout();
    setUserMenuOpen(false);
  };

  return (
    <header className={cn('fixed top-0 left-0 right-0 z-40 border-b border-white/10 transition-all duration-300', scrolled ? 'bg-black/20 backdrop-blur-xl backdrop-saturate-150 shadow-none' : 'navbar-solid shadow-lg shadow-sky-950/30')}>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Navegación principal">
        <div className="flex h-20 items-center justify-between gap-4">
          <div className="flex shrink-0 items-center">
            <Logo boxClassName="h-12 w-12 md:h-16 md:w-16" iconClassName="h-6 w-6 md:h-8 md:w-8" textClassName="text-xl md:text-2xl text-black" />
          </div>

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-2 md:flex">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'nav-draw flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                    isActive
                      ? 'bg-sky-400/20 text-sky-100'
                      : 'text-sky-100/80 hover:text-white hover:bg-sky-400/10'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 md:gap-4">
            <div className="hidden md:flex md:items-center md:gap-3">
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full border-2 border-transparent text-sm font-medium text-sky-100/80 hover:border-[#f9c075] hover:text-white hover:bg-sky-400/10 hover:ring-[3px] hover:ring-white/25"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-400/20 text-sky-100">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block">{user?.name}</span>
                  <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', userMenuOpen && 'rotate-180')} aria-hidden="true" />
                </button>

                {userMenuOpen && (
                  <div className="relative z-20 absolute right-0 mt-[4.5rem] w-64 overflow-hidden rounded-2xl border border-white/15 bg-white/90 p-1.5 shadow-[0_24px_60px_-20px_rgba(30,27,75,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0e1b33]/85 dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
                    <div className="mb-1 rounded-xl bg-gradient-to-br from-sky-500/10 via-transparent to-amber-400/10 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                      <p className="mt-0.5 break-all text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                      <span
                        className={cn(
                          'mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                          user?.role === 'ADMIN'
                            ? 'bg-gradient-to-r from-sky-500 to-sky-400 text-white shadow-sm shadow-sky-500/40'
                            : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/15'
                        )}
                      >
                        {user?.role === 'ADMIN' ? 'Administrador' : 'Visitante'}
                      </span>
                    </div>
                    {user?.role === 'ADMIN' && (
                      <>
                        <Link
                          href="/admin"
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-sky-500/10 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-sky-400/10 dark:hover:text-sky-200"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4 text-sky-500" aria-hidden="true" />
                          Panel de Admin
                        </Link>
                        <Link
                          href="/admin/paises"
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-sky-500/10 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-sky-400/10 dark:hover:text-sky-200"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <MapPin className="h-4 w-4 text-sky-500" aria-hidden="true" />
                          Gestión de Países
                        </Link>
                      </>
                    )}
                    <div className="my-1 h-px bg-gradient-to-r from-transparent via-sky-200/70 to-transparent dark:via-sky-500/25" />
                    <Link
                      href="/educacion"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-sky-500/10 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-sky-400/10 dark:hover:text-sky-200"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <BookOpen className="h-4 w-4 text-sky-500" aria-hidden="true" />
                      Mis Cursos
                    </Link>
                    <div className="my-1 h-px bg-gradient-to-r from-transparent via-rose-200/70 to-transparent dark:via-rose-500/25" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <LogIn className="h-4 w-4" aria-hidden="true" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="rounded-full border-2 border-transparent text-sky-100/90 hover:border-[#f9c075] hover:text-white hover:bg-sky-400/10 hover:ring-[3px] hover:ring-white/25" onClick={() => openLoginModal('login')}>
                  <LogIn className="h-5 w-5 mr-1.5" aria-hidden="true" />
                  Iniciar Sesión
                </Button>
                <Button size="sm" className="rounded-full border-2 border-transparent bg-sky-500 text-white shadow-md shadow-sky-500/30 hover:border-[#f9c075] hover:bg-sky-400 hover:ring-[3px] hover:ring-white/25" onClick={() => openLoginModal('register')}>
                  <User className="h-5 w-5 mr-1.5" aria-hidden="true" />
                  Registrarse
                </Button>
              </div>
            )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-sky-100/80 hover:bg-sky-400/10 hover:text-white"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden max-h-[calc(100vh-4rem)] overflow-y-auto py-4 border-t border-sky-300/20">
            <div className="flex flex-col gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-sky-100/80 hover:text-white hover:bg-sky-400/10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {item.name}
                </Link>
              ))}
              <Separator className="my-3" />
              {isAuthenticated ? (
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-sky-200/80">{user?.email}</p>
                  <button
                    onClick={handleLogout}
                    className="mt-2 flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium text-sky-100/80 hover:text-white hover:bg-sky-400/10"
                  >
                    <LogIn className="h-5 w-5" aria-hidden="true" />
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-3">
                  <Button variant="outline" className="w-full justify-start" onClick={() => { openLoginModal('login'); setMobileMenuOpen(false); }}>
                    <LogIn className="h-4 w-4 mr-2" aria-hidden="true" />
                    Iniciar Sesión
                  </Button>
                  <Button className="w-full justify-start bg-sky-500 text-white hover:bg-sky-400" onClick={() => { openLoginModal('register'); setMobileMenuOpen(false); }}>
                    <User className="h-4 w-4 mr-2" aria-hidden="true" />
                    Registrarse
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}