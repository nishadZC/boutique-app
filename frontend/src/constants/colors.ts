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

export const getHex = (name: string) => CSS_COLORS[name] || '#888';

export const LIGHT_COLORS = new Set([
  'White',
  'Cream',
  'Beige',
  'Peach',
  'Lavender',
  'Light Blue',
  'Pink',
  'Mustard',
]);
