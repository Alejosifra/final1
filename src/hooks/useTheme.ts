import { useEffect } from 'react';
import { useThemeStore, LIST_OF_THEMES } from '../stores/themeStore';

export function useTheme() {
  const {
    currentThemeId,
    borderRadius,
    brightnessMode,
    uiDensity,
    glowIntensity
  } = useThemeStore();

  useEffect(() => {
    const selectedTheme = LIST_OF_THEMES.find(t => t.id === currentThemeId) || LIST_OF_THEMES[0];
    const { colors } = selectedTheme;

    // Apply main colors to doc roots
    const root = document.documentElement;
    root.style.setProperty('--app-bg-primary', colors.bgPrimary);
    root.style.setProperty('--app-bg-secondary', colors.bgSecondary);
    root.style.setProperty('--app-bg-panel', colors.bgPanel);
    root.style.setProperty('--app-accent', colors.accent);
    root.style.setProperty('--app-accent-hover', colors.accentHover);
    root.style.setProperty('--app-accent-rgb', colors.accentRgb);
    root.style.setProperty('--app-text-primary', colors.textPrimary);
    root.style.setProperty('--app-text-secondary', colors.textSecondary);
    root.style.setProperty('--app-border-color', colors.borderColor);
    
    // Configurable glow intensity helper variables
    let finalGlow = colors.glowStrength;
    if (glowIntensity === 'subtle') {
      finalGlow = '6px';
    } else if (glowIntensity === 'none') {
      finalGlow = '0px';
    }
    root.style.setProperty('--app-glow-strength', finalGlow);
    root.style.setProperty('--app-mesh-gradient', colors.meshGradient);
    root.style.setProperty('--app-border-radius', `${borderRadius}px`);

    // Add or remove light mode body classes to support light/dark state
    if (!selectedTheme.isDark) {
      document.body.classList.add('light-theme-applied');
      document.body.classList.remove('dark-theme-applied');
    } else {
      document.body.classList.add('dark-theme-applied');
      document.body.classList.remove('light-theme-applied');
    }

    // Density tweaks
    if (uiDensity === 'compact') {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }

  }, [currentThemeId, borderRadius, brightnessMode, uiDensity, glowIntensity]);
}
