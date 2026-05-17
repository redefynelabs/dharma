import { Dimensions } from 'react-native';
import { useThemeStore } from '@/store/themeStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Dark Theme Colors ─────────────────────────────────────────────────────────
export const DarkColors = {
  // Backgrounds (darkest → lightest)
  bg0:   '#080705',
  bg1:   '#0f0d09',
  bg2:   '#1a1610',
  bg3:   '#252018',
  bg4:   '#2e2a1f',

  // Gold accent
  gold:       '#c8892a',
  goldDim:    '#8b6914',
  goldBright: '#e8a83a',
  goldFaint:  'rgba(200,137,42,0.08)',
  goldBorder: 'rgba(200,137,42,0.18)',
  goldGlow:   'rgba(200,137,42,0.35)',

  // Text
  text0: '#f0e8d8',  // primary
  text1: '#c4b48a',  // secondary
  text2: '#7a6a4a',  // muted

  // Semantic
  success: '#27ae60',
  danger:  '#c0392b',
  info:    '#2980b9',

  // Scripture accents
  gitaAccent:        '#c8892a',
  ramayanaAccent:    '#2e7d5e',
  mahabharataAccent: '#8b3a3a',

  // Transparent overlays
  overlay:      'rgba(8,7,5,0.85)',
  overlayLight: 'rgba(8,7,5,0.5)',
} as const;

// ── Light Theme Colors ────────────────────────────────────────────────────────
export const LightColors = {
  // Backgrounds (lightest → darker)
  bg0:   '#FDFAF3',
  bg1:   '#F8F2E4',
  bg2:   '#F0E8D2',
  bg3:   '#E8DBBD',
  bg4:   '#DCCFA8',

  // Gold accent (deeper for legibility on light bg)
  gold:       '#9A6B0A',
  goldDim:    '#C4920E',
  goldBright: '#B8820E',
  goldFaint:  'rgba(154,107,10,0.08)',
  goldBorder: 'rgba(154,107,10,0.28)',
  goldGlow:   'rgba(154,107,10,0.4)',

  // Text
  text0: '#1A1200',  // primary (near-black)
  text1: '#4A2E00',  // secondary (dark brown)
  text2: '#7A5C20',  // muted (medium brown)

  // Semantic
  success: '#15803D',
  danger:  '#B91C1C',
  info:    '#1D5FA8',

  // Scripture accents
  gitaAccent:        '#9A6B0A',
  ramayanaAccent:    '#1B6B50',
  mahabharataAccent: '#9B2335',

  // Transparent overlays
  overlay:      'rgba(253,250,243,0.88)',
  overlayLight: 'rgba(253,250,243,0.25)',
} as const;

// Default export kept as DarkColors for screens that haven't migrated to the hook yet
export const Colors = DarkColors;

export type ThemeColors = {
  bg0: string; bg1: string; bg2: string; bg3: string; bg4: string;
  gold: string; goldDim: string; goldBright: string;
  goldFaint: string; goldBorder: string; goldGlow: string;
  text0: string; text1: string; text2: string;
  success: string; danger: string; info: string;
  gitaAccent: string; ramayanaAccent: string; mahabharataAccent: string;
  overlay: string; overlayLight: string;
};

/** Returns the correct color palette based on the current theme preference. */
export function useThemeColors(): ThemeColors {
  const isDark = useThemeStore((s) => s.isDark);
  return isDark ? DarkColors : LightColors;
}

// ── Typography ────────────────────────────────────────────────────────────────
export const Fonts = {
  cinzel:         'Cinzel_400Regular',
  cinzelBold:     'Cinzel_600SemiBold',
  garamond:       'EBGaramond_400Regular',
  garamondItalic: 'EBGaramond_400Regular_Italic',
  garamondMedium: 'EBGaramond_500Medium',
} as const;

export const FontSize = {
  xs:   11,
  sm:   13,
  md:   15,
  base: 16,
  lg:   18,
  xl:   22,
  xxl:  28,
  xxxl: 36,
  hero: 46,
} as const;

export const LineHeight = {
  tight:   1.3,
  normal:  1.6,
  relaxed: 1.75,
  loose:   1.9,
} as const;

// ── Spacing ───────────────────────────────────────────────────────────────────
export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  xxxl: 40,
} as const;

// ── Border Radius ─────────────────────────────────────────────────────────────
export const Radius = {
  sm:   3,
  md:   6,
  lg:   12,
  xl:   20,
  full: 999,
} as const;

// ── Shadows ───────────────────────────────────────────────────────────────────
export const Shadow = {
  gold: {
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// ── Layout ────────────────────────────────────────────────────────────────────
export const Layout = {
  screenWidth:  SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  maxWidth:     430,
  headerHeight: 56,
  tabBarHeight: 62,
  bottomInset:  20,
} as const;
