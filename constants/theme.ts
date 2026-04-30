export const COLORS = {
  // Core palette — warm, sophisticated, automotive-inspired
  primary: '#007AFF',
  primaryLight: '#5AC8FA',
  accent: '#FF9500',
  accentSoft: '#FFB340',
  success: '#34C759',
  warning: '#FFCC00',
  error: '#FF3B30',
  
  // Light mode — airy, premium showroom feel
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: 'rgba(255, 255, 255, 0.72)',
  cardSolid: '#FFFFFF',
  
  // Dark mode — deep, refined, like a luxury interior
  backgroundDark: '#000000',
  surfaceDark: '#1C1C1E',
  surfaceElevatedDark: '#2C2C2E',
  cardDark: 'rgba(28, 28, 30, 0.72)',
  cardSolidDark: '#1C1C1E',
  
  // Text — high contrast, refined
  text: '#000000',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',
  textDark: '#FFFFFF',
  textSecondaryDark: '#8E8E93',
  textTertiaryDark: '#48484A',
  
  // Borders & dividers — subtle, almost invisible
  border: 'rgba(120, 120, 128, 0.16)',
  borderDark: 'rgba(120, 120, 128, 0.24)',
  divider: 'rgba(120, 120, 128, 0.12)',
  
  // Glassmorphism effects
  glassLight: 'rgba(255, 255, 255, 0.65)',
  glassLightBorder: 'rgba(255, 255, 255, 0.4)',
  glassDark: 'rgba(28, 28, 30, 0.65)',
  glassDarkBorder: 'rgba(255, 255, 255, 0.08)',
  blurLight: 'rgba(242, 242, 247, 0.85)',
  blurDark: 'rgba(0, 0, 0, 0.75)',
  
  // Gradients
  gradientStart: '#007AFF',
  gradientEnd: '#5AC8FA',
  gradientWarmStart: '#FF9500',
  gradientWarmEnd: '#FFB340',
};

export const FONTS = {
  // Display — large, tight, confident
  display: 40,
  displaySmall: 32,
  h1: 28,
  h2: 22,
  h3: 18,
  h4: 16,
  body: 15,
  bodySmall: 13,
  caption: 11,
  tiny: 10,
  
  // Weights — refined scale
  black: '900' as const,
  heavy: '800' as const,
  bold: '700' as const,
  semibold: '600' as const,
  medium: '500' as const,
  regular: '400' as const,
  
  // Letter spacing — automotive precision
  displayTight: -1.2,
  headingTight: -0.8,
  bodyNormal: -0.2,
  captionWide: 0.3,
  tinyWide: 0.5,
  
  // Line heights
  displayLine: 44,
  headingLine: 28,
  bodyLine: 22,
  captionLine: 16,
};

export const SPACING = {
  // 4px base grid
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  huge: 48,
  massive: 64,
};

export const RADIUS = {
  // iOS 18+ rounded aesthetic
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 9999,
  full: 9999,
};

export const SHADOWS = {
  // Subtle, layered shadows — like floating glass
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 40,
    elevation: 16,
  },
  // Glass-specific: colored ambient shadow
  glass: {
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 8,
  },
  glassWarm: {
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
};

// Glassmorphism style generator
export const getGlassStyle = (isDarkMode: boolean, intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
  const intensities = {
    light: isDarkMode ? 'rgba(28, 28, 30, 0.45)' : 'rgba(255, 255, 255, 0.45)',
    medium: isDarkMode ? 'rgba(28, 28, 30, 0.65)' : 'rgba(255, 255, 255, 0.65)',
    heavy: isDarkMode ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
  };
  
  return {
    backgroundColor: intensities[intensity],
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)',
    ...SHADOWS.md,
  };
};

// Modern gradient backgrounds
export const getGradientColors = (variant: 'primary' | 'warm' | 'cool' | 'dark' = 'primary') => {
  const variants = {
    primary: ['#007AFF', '#5AC8FA'],
    warm: ['#FF9500', '#FFB340'],
    cool: ['#5856D6', '#AF52DE'],
    dark: ['#1C1C1E', '#2C2C2E'],
  };
  return variants[variant];
};
