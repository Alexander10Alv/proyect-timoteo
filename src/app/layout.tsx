import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond, Sora } from 'next/font/google';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AppInit } from '@/components/layout/AppInit';
import { LoginModal, GlobalCountryModal, GlobalDonationModal } from '@/components/modals';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Proyecto Timoteo — Plataforma Ministerial y Educativa',
    template: '%s | Proyecto Timoteo',
  },
  description:
    'Plataforma ministerial y educativa de alcance global: doctrina, formación teológica, mapa de pueblos no alcanzados y donaciones.',
  icons: {
    icon: '/favicon-64.png',
    shortcut: '/favicon-64.png',
    apple: '/favicon-192.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${cormorant.variable} ${sora.variable} scroll-smooth`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <AppInit>
          <Navbar />
          <main className="flex-1 pt-20">{children}</main>
          <Footer />
          <LoginModal />
          <GlobalCountryModal />
          <GlobalDonationModal />
        </AppInit>
      </body>
    </html>
  );
}