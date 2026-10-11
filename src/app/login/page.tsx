'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAppStore } from '@/store';
import { Button, Input, Card, Select } from '@/components/ui';
import { PHONE_COUNTRIES } from '@/lib/phoneCountries';
import { Lock, Mail, User as UserIcon, Globe, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  // Lectura tolerante a prerender: evita useSearchParams() y su requisito de Suspense.
  const [isForbidden, setIsForbidden] = React.useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsForbidden(new URLSearchParams(window.location.search).get('error') === 'forbidden');
    }
  }, []);

  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const user = useAppStore((s) => s.user);
  const login = useAppStore((s) => s.login);
  const register = useAppStore((s) => s.register);
  const isLoading = useAppStore((s) => s.isLoading);

  const [mode, setMode] = React.useState<'login' | 'register'>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [countryCode, setCountryCode] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [church, setChurch] = React.useState('');
  const [error, setError] = React.useState('');

  useEffect(() => {
    if (isAuthenticated) router.push(user?.role === 'ADMIN' ? '/admin' : '/');
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      const ok = await login(email, password);
      if (!ok) setError('Credenciales inválidas. Prueba con admin@heartcry.org / admin123');
      else router.push('/admin');
    } else {
      if (!name.trim() || name.trim().length < 2) {
        setError('El nombre es requerido (mínimo 2 caracteres).');
        return;
      }
      if (!lastName.trim() || lastName.trim().length < 2) {
        setError('El apellido es requerido (mínimo 2 caracteres).');
        return;
      }
      if (!countryCode) {
        setError('Selecciona tu país para el código del celular.');
        return;
      }
      if (!/^[0-9 ]{6,15}$/.test(phone.trim())) {
        setError('El número de celular debe contener solo dígitos (entre 6 y 15).');
        return;
      }
      if (password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      const ok = await register({
        name: name.trim(),
        lastName: lastName.trim(),
        email,
        password,
        countryCode,
        phone: phone.trim(),
        church: church.trim() || undefined,
      });
      // Solo navegamos si el usuario fue creado realmente en MySQL.
      if (!ok) {
        const serverError = useAppStore.getState().usersError;
        setError(serverError || 'No se pudo completar el registro. Verifica tu conexión con el servidor.');
      } else {
        router.push('/');
      }
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-dark-50 px-4 py-16 dark:bg-dark-900/40">
      <Card padding="lg" className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
            <Globe className="h-6 w-6 text-white" aria-hidden="true" />
          </span>
          <h1 className="font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
            {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h1>
          <p className="mt-2 text-body-sm text-dark-500 dark:text-dark-400">
            {mode === 'login'
              ? 'Accede para desbloquear el contenido educativo'
              : 'Regístrate gratis para acceder a cursos y grabaciones'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {isForbidden && (
            <p role="alert" className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-body-sm text-amber-700 dark:text-amber-300">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              El panel de administración es exclusivo del rol admin. Inicia sesión con una cuenta autorizada.
            </p>
          )}
          {mode === 'register' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Nombre"
                required
                autoComplete="given-name"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Apellido"
                required
                autoComplete="family-name"
                placeholder="Tu apellido"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          )}

          <Input
            label="Correo electrónico"
            type="email"
            required
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Contraseña"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {mode === 'register' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="País (código)"
                  required
                  options={[
                    { value: '', label: 'Código' },
                    ...PHONE_COUNTRIES.map((c) => ({ value: c.code, label: `${c.dial} · ${c.name}` })),
                  ]}
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                />
                <Input
                  label="Celular"
                  required
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="999 888 777"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <Input
                label="Iglesia (opcional)"
                placeholder="Nombre de tu iglesia"
                value={church}
                onChange={(e) => setChurch(e.target.value)}
              />
            </>
          )}

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-body-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" loading={isLoading}>
            {mode === 'login' ? (
              <><Lock className="mr-2 h-4 w-4" aria-hidden="true" /> Iniciar sesión</>
            ) : (
              <><UserIcon className="mr-2 h-4 w-4" aria-hidden="true" /> Crear cuenta</>
            )}
          </Button>
        </form>

        <div className="mt-6 rounded-lg border border-dashed border-dark-300 dark:border-dark-600 bg-dark-50 dark:bg-dark-800/50 px-4 py-3">
          <p className="mb-1.5 text-caption font-semibold uppercase tracking-wide text-dark-500 dark:text-dark-400">
            Cuentas demo
          </p>
          <p className="text-caption font-mono text-dark-500 dark:text-dark-400">admin@heartcry.org / admin123</p>
          <p className="text-caption font-mono text-dark-500 dark:text-dark-400">visitor@heartcry.org / visitor123</p>
        </div>

        <button
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          className="mt-6 w-full text-center text-body-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </Card>
    </div>
  );
}