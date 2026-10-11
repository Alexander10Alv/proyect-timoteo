import { create } from 'zustand';
import { normalizeSections, normalizeTheme, normalizeFooter } from '@/lib/siteConfig';
import type { ThemeConfig, FooterConfig, HomeSection } from '@/lib/siteConfig';

interface SiteState {
  siteName: string;
  theme: ThemeConfig;
  sections: Record<string, HomeSection>;
  footer: FooterConfig;
  loaded: boolean;
  fetchSite: () => Promise<void>;
  apply: (data: {
    siteName?: string;
    theme?: unknown;
    sections?: unknown;
    footer?: unknown;
  }) => void;
}

export const useSiteStore = create<SiteState>((set, get) => ({
  siteName: 'Proyecto Timoteo',
  theme: normalizeTheme(undefined),
  sections: normalizeSections(undefined),
  footer: normalizeFooter(undefined),
  loaded: false,

  fetchSite: async () => {
    try {
      const res = await fetch('/api/site');
      if (!res.ok) return;
      const data = await res.json();
      set({
        siteName: data.siteName ?? 'Proyecto Timoteo',
        theme: normalizeTheme(data.theme),
        sections: normalizeSections(data.sections),
        footer: normalizeFooter(data.footer),
        loaded: true,
      });
    } catch {
      /* mantiene defaults */
    }
  },

  apply: (data) => {
    const state = get();
    set({
      siteName: data.siteName ?? state.siteName,
      theme: data.theme ? normalizeTheme(data.theme) : state.theme,
      sections: data.sections ? normalizeSections(data.sections) : state.sections,
      footer: data.footer ? normalizeFooter(data.footer) : state.footer,
    });
  },
}));
