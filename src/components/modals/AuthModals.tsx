'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAppStore } from '@/store';
import { PHONE_COUNTRIES } from '@/lib/phoneCountries';
import { Lock, Mail, User as UserIcon } from 'lucide-react';

export function LoginModal() {
  const { loginModal, closeLoginModal, login, register } = useAppStore();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [countryCode, setCountryCode] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [church, setChurch] = React.useState('');
  const [error, setError] = React.useState('');

  const isLogin = loginModal.mode === 'login';
  const isOpen = loginModal.isOpen;

  const resetForm = () => {
    setEmail(''); setPassword(''); setName(''); setLastName(''); setCountryCode(''); setPhone(''); setChurch(''); setError('');
  };

  const handleClose = () => {
    resetForm();
    closeLoginModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const ok = await login(email, password);
      if (!ok) {
        setError('Credenciales inválidas. Usa admin@heartcry.org / admin123');
      } else {
        handleClose();
      }
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
      // Solo cerramos si el usuario fue creado realmente en MySQL.
      if (!ok) {
        const serverError = useAppStore.getState().usersError;
        setError(serverError || 'No se pudo completar el registro. Verifica tu conexión con el servidor.');
      } else {
        handleClose();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
      description={
        isLogin
          ? 'Accede para desbloquear reuniones en vivo y grabaciones.'
          : 'Regístrate para acceder al contenido educativo protegido.'
      }
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {!isLogin && (
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
          helperText={isLogin ? undefined : 'Mínimo 8 caracteres'}
        />

        {!isLogin && (
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

        <Button type="submit" size="lg" className="w-full">
          {isLogin ? (
            <><Lock className="mr-2 h-4 w-4" aria-hidden="true" /> Entrar</>
          ) : (
            <><UserIcon className="mr-2 h-4 w-4" aria-hidden="true" /> Crear cuenta</>
          )}
        </Button>

        <div className="rounded-lg border border-dashed border-dark-300 dark:border-dark-600 bg-dark-50 dark:bg-dark-800/50 px-4 py-3">
          <p className="mb-1.5 text-caption font-semibold uppercase tracking-wide text-dark-500 dark:text-dark-400">
            Cuentas de demostración
          </p>
          <p className="text-caption text-dark-500 dark:text-dark-400">
            Admin: <code className="font-mono">admin@heartcry.org</code> / <code className="font-mono">admin123</code>
          </p>
          <p className="text-caption text-dark-500 dark:text-dark-400">
            Visitante: <code className="font-mono">visitor@heartcry.org</code> / <code className="font-mono">visitor123</code>
          </p>
        </div>

        <button
          type="button"
          onClick={() => useAppStore.setState({ loginModal: { ...loginModal, mode: isLogin ? 'register' : 'login' } })}
          className="w-full text-center text-body-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </form>
    </Modal>
  );
}