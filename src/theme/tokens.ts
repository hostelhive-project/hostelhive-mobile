import type { TextStyle, ViewStyle } from 'react-native';

/**
 * HostelHive mobile design tokens.
 * Core brand values mirror hostelhive-web/src/index.css; mobile controls use
 * touch-friendly dimensions while preserving the same color and type system.
 */
export const palette = {
  ink: '#0b1220',
  inkSoft: '#19283d',
  text: '#152238',
  muted: '#596a80',
  subtle: '#708097',
  border: '#dce3eb',
  borderSoft: '#e8edf2',
  surface: '#ffffff',
  canvas: '#f5f7fa',
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  success: '#17835b',
  warning: '#a56408',
  danger: '#bb3541',
  info: '#285f9d',
  navyAction: '#263c58',
} as const;

export const semantic = {
  success: { foreground: '#047857', background: '#ecfdf5', border: '#cee5d9', icon: '#10b981' },
  warning: { foreground: '#b45309', background: '#fffbeb', border: '#ecdfc3', icon: '#d97706' },
  danger: { foreground: '#be123c', background: '#fff1f2', border: '#eed4d7', icon: '#e11d48' },
  info: { foreground: '#1d4ed8', background: '#eff6ff', border: '#dbeafe', icon: '#2563eb' },
  neutral: { foreground: '#475569', background: '#f1f5f9', border: '#e2e8f0', icon: '#64748b' },
} as const;

export const severity = {
  Low: semantic.neutral,
  Medium: semantic.warning,
  High: { foreground: '#c2410c', background: '#fff7ed', border: '#fed7aa', icon: '#ea580c' },
  Critical: semantic.danger,
} as const;

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  webControl: 7,
  webCard: 11,
  webDialog: 16,
  control: 12,
  card: 16,
  sheet: 24,
  pill: 999,
  full: 9999,
} as const;

export const motion = {
  quick: 140,
  standard: 160,
  deliberate: 220,
  easing: 'ease-out',
} as const;

/** Mobile adaptation of the approved web sidebar selection treatment. */
export const navigationTokens = {
  surface: palette.surface,
  border: palette.border,
  selectedSurface: '#edf2f7',
  selectedAccent: '#263c58',
  inactive: '#46566d',
  barHeight: 68,
  iconSize: 23,
  iconFrameWidth: 48,
  iconFrameHeight: 32,
  labelSize: 12,
  labelLineHeight: 16,
  minimumTarget: 48,
} as const;

export const shadows: Record<'none' | 'card' | 'overlay', ViewStyle> = {
  none: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  card: { shadowColor: '#0b1220', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.045, shadowRadius: 5, elevation: 1 },
  overlay: { shadowColor: '#0b1220', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 },
};

const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

const text = (fontFamily: string, fontSize: number, lineHeight: number, letterSpacing?: number): TextStyle => ({
  fontFamily,
  fontSize,
  lineHeight,
  ...(letterSpacing === undefined ? {} : { letterSpacing }),
});

export const typography: Record<string, TextStyle> = {
  display: text(font.bold, 26, 32, -0.5),
  h1: text(font.semibold, 22, 28, -0.35),
  h2: text(font.semibold, 18, 24, -0.2),
  h3: text(font.semibold, 16, 22, -0.1),
  h4: text(font.semibold, 14, 20),
  body: text(font.regular, 14, 20),
  bodyMedium: text(font.medium, 14, 20),
  bodySemiBold: text(font.semibold, 14, 20),
  bodyBold: text(font.bold, 14, 20),
  bodySmall: text(font.regular, 14, 20),
  caption: text(font.regular, 12, 17),
  captionMedium: text(font.medium, 12, 17),
  captionSemiBold: text(font.semibold, 12, 17),
  captionBold: text(font.bold, 12, 17),
  button: text(font.semibold, 15, 22),
  buttonSmall: text(font.semibold, 14, 20),
  smallBadge: text(font.semibold, 11, 15),
  micro: text(font.medium, 11, 15),
};

/** Backward-compatible names used by existing screens during the restyle. */
export const COLORS = {
  primary: palette.ink,
  primaryDark: palette.ink,
  primaryLight: palette.inkSoft,
  primaryMuted: palette.neutral[800],
  accent: palette.success,
  accentLight: '#e8f6ef',
  background: palette.canvas,
  surface: palette.surface,
  surfaceSubtle: palette.neutral[50],
  surfaceHover: palette.neutral[100],
  card: palette.surface,
  cardBorder: palette.border,
  border: palette.border,
  borderSoft: palette.borderSoft,
  cardBorderHover: palette.neutral[300],
  textPrimary: palette.text,
  textSecondary: palette.muted,
  textMuted: palette.subtle,
  textInverse: '#ffffff',
  success: palette.success,
  successLight: semantic.success.background,
  successBorder: semantic.success.border,
  successText: semantic.success.foreground,
  warning: palette.warning,
  warningLight: semantic.warning.background,
  warningBorder: semantic.warning.border,
  warningText: semantic.warning.foreground,
  danger: palette.danger,
  dangerLight: semantic.danger.background,
  dangerBorder: semantic.danger.border,
  dangerText: semantic.danger.foreground,
  error: palette.danger,
  errorLight: semantic.danger.background,
  errorBorder: semantic.danger.border,
  errorText: semantic.danger.foreground,
  info: palette.info,
  infoLight: semantic.info.background,
  infoBorder: semantic.info.border,
  infoText: semantic.info.foreground,
  purple: '#6d5bd0',
  purpleLight: '#f2f0ff',
  inputBg: palette.surface,
  inputBorder: palette.border,
  inputBorderFocus: palette.navyAction,
  disabled: palette.neutral[400],
  disabledBg: palette.neutral[100],
  placeholder: palette.subtle,
  backdrop: 'rgba(11, 18, 32, 0.42)',
  overlaySubtle: 'rgba(11, 18, 32, 0.04)',
  Low: severity.Low.foreground,
} as const;

export const SPACING = spacing;
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;
export const SHADOWS = {
  none: shadows.none,
  subtle: shadows.card,
  card: shadows.card,
  cardHover: shadows.card,
  floating: shadows.overlay,
  modal: shadows.overlay,
} as const;
export const TYPOGRAPHY = typography;
