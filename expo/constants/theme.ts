export const colors = {
  background: '#0A0A0F',
  backgroundLight: '#12121A',
  surface: '#1A1A24',
  surfaceLight: '#22222E',
  accent: '#F5A623',
  accentDark: '#D4901E',
  accentLight: '#FFB94D',
  success: '#4CAF82',
  error: '#E05555',
  white: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B0',
  textMuted: '#6B6B7B',
  border: 'rgba(255, 255, 255, 0.10)',
  borderLight: 'rgba(255, 255, 255, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: 'rgba(0, 0, 0, 0.4)',
  locked: '#E05555',
  unlocked: '#4CAF82',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const typography = {
  headline: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textMuted,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: colors.textMuted,
  },
} as const;
