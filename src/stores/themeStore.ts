import { create } from 'zustand';

export type VisualThemeId = 
  | 'dark-premium'
  | 'light-elegant'
  | 'emerald-gastro'
  | 'midnight-modern';

export interface VisualThemeDefinition {
  id: VisualThemeId;
  name: string;
  isDark: boolean;
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    bgPanel: string;
    accent: string;
    accentHover: string;
    accentRgb: string; // "0, 242, 255" for instance
    textPrimary: string;
    textSecondary: string;
    borderColor: string;
    glowStrength: string; // shadow size, e.g. "12px" or "0px"
    meshGradient: string; // complex subtle CSS gradient background
  };
}

export const LIST_OF_THEMES: VisualThemeDefinition[] = [
  {
    id: 'dark-premium',
    name: 'Dark Premium',
    isDark: true,
    colors: {
      bgPrimary: '#050608',
      bgSecondary: '#0c0e12',
      bgPanel: 'rgba(12, 14, 18, 0.45)',
      accent: '#00f2ff',
      accentHover: '#00d6e0',
      accentRgb: '0, 242, 255',
      textPrimary: '#ffffff',
      textSecondary: '#94a3b8',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      glowStrength: '12px',
      meshGradient: 'radial-gradient(circle at top right, rgba(0, 242, 255, 0.05), transparent 45%), radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.03), transparent 40%)'
    }
  },
  {
    id: 'light-elegant',
    name: 'Light Elegant',
    isDark: false,
    colors: {
      bgPrimary: '#f8fafc',
      bgSecondary: '#ffffff',
      bgPanel: '#ffffff',
      accent: '#2563eb',
      accentHover: '#1d4ed8',
      accentRgb: '37, 99, 235',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      borderColor: '#e2e8f0',
      glowStrength: '0px',
      meshGradient: 'none'
    }
  },
  {
    id: 'emerald-gastro',
    name: 'Emerald Gastro',
    isDark: true,
    colors: {
      bgPrimary: '#020d09',
      bgSecondary: '#041c14',
      bgPanel: 'rgba(4, 28, 20, 0.45)',
      accent: '#10b981',
      accentHover: '#059669',
      accentRgb: '16, 185, 129',
      textPrimary: '#ffffff',
      textSecondary: '#a7f3d0',
      borderColor: 'rgba(16, 185, 129, 0.12)',
      glowStrength: '10px',
      meshGradient: 'radial-gradient(circle at top, rgba(16, 185, 129, 0.05), transparent 50%)'
    }
  },
  {
    id: 'midnight-modern',
    name: 'Midnight Modern',
    isDark: true,
    colors: {
      bgPrimary: '#030511',
      bgSecondary: '#090d26',
      bgPanel: 'rgba(10, 15, 35, 0.5)',
      accent: '#8b5cf6',
      accentHover: '#7c3aed',
      accentRgb: '139, 92, 246',
      textPrimary: '#ffffff',
      textSecondary: '#c084fc',
      borderColor: 'rgba(139, 92, 246, 0.14)',
      glowStrength: '14px',
      meshGradient: 'radial-gradient(circle at top, rgba(139, 92, 246, 0.06), transparent 50%)'
    }
  }
];

interface ThemeStoreState {
  currentThemeId: VisualThemeId;
  borderRadius: number; // Border radius in pixels
  brightnessMode: 'auto' | 'dark' | 'light';
  uiDensity: 'compact' | 'standard';
  glowIntensity: 'default' | 'subtle' | 'none';
  setTheme: (themeId: VisualThemeId) => void;
  setBorderRadius: (radius: number) => void;
  setBrightnessMode: (mode: 'auto' | 'dark' | 'light') => void;
  setUiDensity: (density: 'compact' | 'standard') => void;
  setGlowIntensity: (intensity: 'default' | 'subtle' | 'none') => void;
  loadFromLocal: () => void;
}

export const useThemeStore = create<ThemeStoreState>((set) => ({
  currentThemeId: 'dark-premium',
  borderRadius: 24,
  brightnessMode: 'dark',
  uiDensity: 'standard',
  glowIntensity: 'default',

  setTheme: (themeId) => set(() => {
    localStorage.setItem('lual_theme_id', themeId);
    return { currentThemeId: themeId };
  }),

  setBorderRadius: (radius) => set(() => {
    localStorage.setItem('lual_theme_border_radius', String(radius));
    return { borderRadius: radius };
  }),

  setBrightnessMode: (mode) => set(() => {
    localStorage.setItem('lual_theme_brightness_mode', mode);
    return { brightnessMode: mode };
  }),

  setUiDensity: (density) => set(() => {
    localStorage.setItem('lual_theme_ui_density', density);
    return { uiDensity: density };
  }),

  setGlowIntensity: (intensity) => set(() => {
    localStorage.setItem('lual_theme_glow_intensity', intensity);
    return { glowIntensity: intensity };
  }),

  loadFromLocal: () => {
    try {
      const storedTheme = localStorage.getItem('lual_theme_id') as VisualThemeId;
      const storedRadius = localStorage.getItem('lual_theme_border_radius');
      const storedBrightness = localStorage.getItem('lual_theme_brightness_mode') as 'auto' | 'dark' | 'light';
      const storedDensity = localStorage.getItem('lual_theme_ui_density') as 'compact' | 'standard';
      const storedGlow = localStorage.getItem('lual_theme_glow_intensity') as 'default' | 'subtle' | 'none';

      // Ensure stored theme is one of the 4 defined themes
      const validThemeIds: VisualThemeId[] = ['dark-premium', 'light-elegant', 'emerald-gastro', 'midnight-modern'];
      if (storedTheme && validThemeIds.includes(storedTheme)) {
        set({ currentThemeId: storedTheme });
      } else {
        set({ currentThemeId: 'dark-premium' });
      }

      if (storedRadius) set({ borderRadius: Number(storedRadius) });
      if (storedBrightness) set({ brightnessMode: storedBrightness });
      if (storedDensity) set({ uiDensity: storedDensity });
      if (storedGlow) set({ glowIntensity: storedGlow });
    } catch (e) {
      console.error('Failed to restore theme system variables:', e);
    }
  }
}));
