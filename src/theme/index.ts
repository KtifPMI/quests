export const colors = {
  primary: '#20E3C2',
  primaryLight: '#5FF0DC',
  primaryDark: '#0FAE98',
  secondary: '#2EC8E0',
  background: '#0B0F14',
  surface: '#141A22',
  surfaceAlt: '#1B232E',
  text: '#E6EDF5',
  textLight: '#A5B1BF',
  textMuted: '#5D6B7A',
  danger: '#FF5C73',
  success: '#2ED47A',
  warning: '#FFB84D',
  border: '#232C38',
  white: '#FFFFFF',
  black: '#000000',
  mapPin: '#20E3C2',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700', color: colors.text } as const,
  h2: { fontSize: 22, fontWeight: '700', color: colors.text } as const,
  h3: { fontSize: 18, fontWeight: '600', color: colors.text } as const,
  body: { fontSize: 16, fontWeight: '400', color: colors.text } as const,
  bodySmall: { fontSize: 14, fontWeight: '400', color: colors.textLight } as const,
  caption: { fontSize: 12, fontWeight: '400', color: colors.textMuted } as const,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  } as const,
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  } as const,
};