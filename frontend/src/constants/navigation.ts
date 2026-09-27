import { ROUTES } from './routes';

// Storefront categories surfaced in the header, footer and home page. `category`
// must match the category name returned by the product API. `tileImage` is an
// optional curated home-page tile photo; otherwise a product photo is used.
export const SHOP_CATEGORIES: readonly { label: string; category: string; tileImage?: string }[] = [
  { label: 'Suits',    category: 'Suits & Waistcoats', tileImage: '/images/categories/suits.jpg' },
  { label: 'Blazers',  category: 'Blazers' },
  { label: 'Coats',    category: 'Coats & Overcoats', tileImage: '/images/categories/coats.jpg' },
  { label: 'Shirts',   category: 'Formal Shirts', tileImage: '/images/categories/shirts.jpg' },
  { label: 'Trousers', category: 'Trousers & Pants', tileImage: '/images/categories/trousers.jpg' },
  { label: 'Shoes',    category: 'Formal Shoes', tileImage: '/images/categories/shoes.jpg' },
];

export const productsUrl = (params: { category?: string; q?: string; sort?: string; handcrafted?: boolean } = {}): string => {
  const search = new URLSearchParams(
    Object.entries(params)
      .map(([key, value]): [string, string] => [key, value === true ? '1' : value ? String(value) : ''])
      .filter(([, value]) => !!value),
  ).toString();
  return search ? `${ROUTES.PRODUCTS}?${search}` : ROUTES.PRODUCTS;
};

export const NEW_IN_URL = productsUrl({ sort: 'newest' });

/** Pieces made by hand in the atelier. */
export const HANDCRAFTED_URL = productsUrl({ handcrafted: true });

export const ANNOUNCEMENTS = [
  'Free shipping on orders over ₹500',
  'Complimentary styling with our Style Advisor',
  'Easy returns within 30 days',
] as const;
