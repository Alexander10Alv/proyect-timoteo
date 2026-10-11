import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="font-serif text-display-xl font-semibold text-primary-500">404</p>
      <h1 className="mt-4 font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
        Página no encontrada
      </h1>
      <p className="mt-3 text-body-md text-dark-500 dark:text-dark-400">
        La página que buscas no existe o fue movida.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white hover:bg-primary-700"
      >
        Volver al inicio
      </Link>
    </div>
  );
}