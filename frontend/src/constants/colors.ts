// Brand palette tokens — use these instead of magic hex strings
export const BRAND = {
  GOLD: '#d4af37',
  GOLD_DARK: '#b8941f',
  GOLD_LIGHT: '#f4e5c2',
  GOLD_MUTED: '#f4e5a0',
  DARK: '#1a1a1a',
  DARK_DEEP: '#000000',
  DARK_SOFT: '#424242',
  WHITE: '#ffffff',
  SURFACE: '#fafafa',
  SURFACE_MUTED: '#f8f8f8',
  SURFACE_WARM: '#f8f5ef',
  TEXT_SECONDARY: '#666666',
  TEXT_TERTIARY: '#999999',
  BORDER: '#f0f0f0',
  AUTH_BG: '#171512',
} as const;

// Product color swatches (CSS color values keyed by display name)
export const CSS_COLORS: Record<string, string> = {
  'White': '#FFFFFF',
  'Light Blue': '#ADD8E6',
  'Navy Blue': '#001F5B',
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
  'Yellow': '#FFEB3B',
  'Gold': '#FFD700',
  'Turquoise Blue': '#00CED1',
};

export const getHex = (name: string): string => CSS_COLORS[name] || '#888';

export const LIGHT_COLORS = new Set([
  'White', 'Cream', 'Beige', 'Peach', 'Lavender', 'Light Blue', 'Pink', 'Mustard',
]);