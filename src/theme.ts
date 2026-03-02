// PatchPoint Design System
export const Colors = {
  // Backgrounds
  bg: '#0A0E1A',
  bgCard: '#111827',
  bgSurface: '#1A2235',
  bgSurfaceAlt: '#1E2D45',

  // Accent / Brand
  cyan: '#00D4FF',
  cyanDim: 'rgba(0,212,255,0.15)',
  cyanGlow: 'rgba(0,212,255,0.4)',

  // Status
  danger: '#FF4757',
  dangerDim: 'rgba(255,71,87,0.15)',
  warning: '#FFA502',
  warningDim: 'rgba(255,165,2,0.15)',
  success: '#2ED573',
  successDim: 'rgba(46,213,115,0.15)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8BA3C7',
  textMuted: '#4A6080',

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderAccent: 'rgba(0,212,255,0.3)',

  // Confidence markers
  highConfidence: '#FF4757',
  medConfidence: '#FFA502',
  lowConfidence: '#00D4FF',
};

export const Typography = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadow = {
  cyan: {
    shadowColor: Colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};
