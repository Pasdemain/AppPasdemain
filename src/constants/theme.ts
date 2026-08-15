import { Platform } from 'react-native';

/**
 * Palette inspirée du balisage maritime : bleu marine, rouge bâbord, vert tribord.
 */
export type Theme = {
  text: string;
  textSecondary: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  primary: string;
  primaryText: string;
  accent: string;
  success: string;
  successSurface: string;
  danger: string;
  dangerSurface: string;
  warning: string;
};

export type ThemeColor = keyof Theme;

export const Colors: { light: Theme; dark: Theme } = {
  light: {
    text: '#0A1B2A',
    textSecondary: '#5A6B7B',
    background: '#F5F8FA',
    surface: '#FFFFFF',
    surfaceAlt: '#E8EFF4',
    border: '#D6E1E9',
    primary: '#0B3C5D',
    primaryText: '#FFFFFF',
    accent: '#1B94C4',
    success: '#1F8A4C',
    successSurface: '#E3F5EA',
    danger: '#C1272D',
    dangerSurface: '#FBE7E8',
    warning: '#C97A00',
  },
  dark: {
    text: '#EAF2F7',
    textSecondary: '#9BAEBD',
    background: '#07131D',
    surface: '#0F2231',
    surfaceAlt: '#16303F',
    border: '#1E3B4D',
    primary: '#1B94C4',
    primaryText: '#04121B',
    accent: '#4FC3E8',
    success: '#3FBF77',
    successSurface: '#0E2F1F',
    danger: '#E8626A',
    dangerSurface: '#331317',
    warning: '#E0A040',
  },
};

/** Couleurs du balisage, identiques en clair et en sombre (elles sont normalisées). */
export const BuoyColors = {
  babord: '#C1272D',
  tribord: '#1F8A4C',
  cardinale: '#F2C037',
  special: '#F2C037',
  danger: '#111111',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', rounded: 'normal', mono: 'monospace' },
  web: {
    sans: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    rounded: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
});

export const MaxContentWidth = 720;
