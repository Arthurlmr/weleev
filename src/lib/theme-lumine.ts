/**
 * LUMINᵉ Brand Theme
 *
 * Palette officielle "Terre chaude" (recommandée)
 * Référence : design/brand-guidelines.md
 */

export const lumineTheme = {
  // Palette Terre chaude
  colors: {
    // Primaire
    primary: {
      DEFAULT: '#2B2621', // Noir chaud (chocolat profond)
      light: '#3a322b',
      dark: '#1a1614',
    },

    // Accent
    accent: {
      DEFAULT: '#D4A574', // Or rose / Terracotta doux
      light: '#e0b88a',
      dark: '#c79563',
    },

    // Neutre
    neutral: {
      DEFAULT: '#F5F1ED', // Blanc cassé (papier)
      50: '#FEFDFB',
      100: '#F5F1ED',
      200: '#EBE6E0',
      300: '#E0D9D1',
      400: '#D1C7BC',
      500: '#B8ACA0',
      600: '#9C8F83',
      700: '#6B6562', // Gris chaud (texte secondaire)
      800: '#4A4542',
      900: '#2B2621', // Primary
    },

    // Couleurs sémantiques
    success: '#A8B69C', // Sage (nature)
    warning: '#D4A574', // Accent
    error: '#C85A54',
    info: '#7B8BA3',
  },

  // Typographie
  typography: {
    fontFamily: {
      display: ['GT America', 'Suisse Int\'l', 'Circular', 'Söhne', 'system-ui', 'sans-serif'],
      body: ['Inter', 'system-ui', 'sans-serif'],
    },

    // Scale typographique (web/app)
    fontSize: {
      h1: ['48px', { lineHeight: '56px', fontWeight: '500' }],
      h2: ['32px', { lineHeight: '40px', fontWeight: '500' }],
      h3: ['24px', { lineHeight: '32px', fontWeight: '500' }],
      'body-large': ['18px', { lineHeight: '27px', fontWeight: '400' }],
      body: ['16px', { lineHeight: '24px', fontWeight: '400' }],
      small: ['14px', { lineHeight: '21px', fontWeight: '400' }],
    },
  },

  // Espacements (multiple de 8)
  spacing: {
    micro: '4px',
    xs: '8px',
    s: '16px',
    m: '24px',
    l: '32px',
    xl: '48px',
    xxl: '64px',
  },

  // Bordures et arrondis
  borderRadius: {
    standard: '8px',
    card: '12px',
    modal: '16px',
  },

  // Ombres (subtiles)
  boxShadow: {
    light: '0 2px 8px rgba(0,0,0,0.04)',
    medium: '0 4px 16px rgba(0,0,0,0.08)',
    strong: '0 8px 32px rgba(0,0,0,0.12)',
  },
} as const;

/**
 * Classe utilitaire pour générer des classes Tailwind dynamiques
 */
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Nom de marque avec exposant Unicode
 */
export const BRAND_NAME = 'LUMINᵉ';
export const BRAND_NAME_PLAIN = 'Lumine';
export const BRAND_TAGLINE = 'L\'immobilier en pleine lumière';

/**
 * Logo condensé pour espaces restreints
 */
export const BRAND_LOGO_CONDENSED = {
  single: 'L',
  double: 'LU',
  exponent: 'ᵉ',
};
