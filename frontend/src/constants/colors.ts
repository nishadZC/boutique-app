// Brand palette tokens — use these instead of magic hex strings
export const BRAND = {
  // Champagne gold accent (mirrored as CSS variables in index.css)
  GOLD: '#c8a46e',
  GOLD_DARK: '#a8844f',
  GOLD_LIGHT: '#e8d9bd',
  GOLD_MUTED: '#efe3cc',
  DARK: '#1a1a1a',
  DARK_DEEP: '#000000',
  DARK_SOFT: '#424242',
  // Dark storefront surfaces (header, footer, home page)
  INK: '#0e0e0e',
  INK_SOFT: '#171615',
  INK_LINE: '#2a2826',
  CREAM: '#f2ede4',
  MUTED_ON_DARK: '#9b958c',
  WHITE: '#ffffff',
  SURFACE: '#fafafa',
  SURFACE_MUTED: '#f8f8f8',
  SURFACE_WARM: '#f8f5ef',
  TEXT_SECONDARY: '#666666',
  TEXT_TERTIARY: '#999999',
  BORDER: '#f0f0f0',
  AUTH_BG: '#171512',
  // Saturated gold for chart marks: the champagne GOLD reads grey at chart scale.
  // Validated (dataviz validate_palette.js): chroma floor and >= 3:1 contrast on light and dark.
  CHART_GOLD: '#a8770f',
} as const;

// Product color swatches (CSS color values keyed by display name)
export const CSS_COLORS: Record<string, string> = {
  'White': '#FFFFFF',
  'Light Blue': '#ADD8E6',
  'Navy Blue': '#001F5B',
  'Navy': '#1B2A4A',
  'Blue': '#1E40AF',
  'Charcoal': '#374151',
  'Cream': '#FFFDD0',
  'Lavender': '#C8A2C8',
  'Burgundy': '#800020',
  'Olive': '#808000',
  'Pink': '#FFC0CB',
  'Peach': '#FFCBA4',
  'Teal': '#008080',
  'Mustard': '#FFDB58',
  'Coral': '#FF7F50',
  'Sea Green': '#2E8B57',
  'Grey': '#9CA3AF',
  'Black': '#111111',
  'Brown': '#8B4513',
  'Khaki': '#C3B091',
  'Beige': '#F5F5DC',
  'Tan': '#D2B48C',
  'Camel': '#C19A6B',
  'Ivory': '#F4EFE1',
  'Green': '#4F6F52',
  'Yellow': '#FFEB3B',
  'Gold': '#FFD700',
  'Turquoise Blue': '#00CED1',
};

export const getHex = (name: string): string => CSS_COLORS[name] || '#888';

export const LIGHT_COLORS = new Set([
  'White', 'Cream', 'Beige', 'Peach', 'Lavender', 'Light Blue', 'Pink', 'Mustard', 'Ivory',
]);