export const spacing = {
  xxs: 2,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  pill: 999,
} as const;

export const typography = {
  title: 24,
  section: 17,
  body: 15,
  caption: 12,
} as const;

export const motion = {
  fast: 140,
  normal: 200,
} as const;

const light = {
  bg: '#f4f7f5',
  surface: '#ffffff',
  surfaceMuted: '#eef3ef',
  border: '#d4ddd6',
  text: '#1c2d24',
  textMuted: '#5d6f63',
  primary: '#2f7a4d',
  primaryStrong: '#23613d',
  danger: '#bf3b3b',
  success: '#2f7a4d',
  chip: '#eef5ef',
  inputBg: '#ffffff',
  overlay: 'rgba(16,22,18,0.35)',
  tabIdle: '#b2c2b5',
  chartEmpty: '#dce6de',
};

const dark = {
  bg: '#0e1511',
  surface: '#18211b',
  surfaceMuted: '#131b16',
  border: '#2d3a31',
  text: '#e4efe7',
  textMuted: '#a8b8ac',
  primary: '#74c08d',
  primaryStrong: '#62af7b',
  danger: '#f07d7d',
  success: '#8ad4a2',
  chip: '#212c24',
  inputBg: '#121914',
  overlay: 'rgba(5,9,7,0.55)',
  tabIdle: '#4f6255',
  chartEmpty: '#2f3d33',
};

export type ThemeColors = typeof light;

export function getThemeColors(darkMode?: boolean): ThemeColors {
  return darkMode ? dark : light;
}

// Backward compatibility for older imports
export const colors = {
  white: '#ffffff',
  danger: light.danger,
  screenDark: dark.bg,
  panelDark: dark.surface,
  borderDark: dark.border,
  textDark: dark.text,
  panelLight: light.surface,
  borderLight: light.border,
  borderInput: light.border,
  accentGreen: light.primary,
  textPrimary: light.text,
  textStrong: light.text,
  textStrongAlt: light.text,
  textSecondary: light.textMuted,
  separatorLight: light.border,
  tableBorderLight: light.border,
  tabDotIdle: light.tabIdle,
  chipBorder: light.border,
  chipBg: light.chip,
  placeholder: light.textMuted,
  chartEmptyLight: light.chartEmpty,
};
