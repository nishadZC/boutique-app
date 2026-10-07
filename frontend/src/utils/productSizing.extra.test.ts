import { describe, it, expect } from 'vitest';
import { getGarmentType, getSizeOptions, productRequiresSize } from './productSizing';

describe('productSizing extra', () => {
  it.each([
    ['Silk Waistcoat', 'waistcoat'], ['Wool Vest', 'waistcoat'], ['Tuxedo', 'suit'], ['Linen Jacket', 'blazer'],
    ['Topcoat', 'coat'], ['Blouse', 'shirt'], ['Chinos', 'trousers'], ['Denim Jeans', 'trousers'],
    ['Leather Loafer', 'shoes'], ['Ballet Flats', 'shoes'], ['Hat', null],
  ])('%s -> %s', (name, t) => expect(getGarmentType({ name })).toBe(t));

  it('category-based detection', () => {
    expect(getGarmentType({ name: 'X', category: 'Suits & Waistcoats' })).toBe('suit');
    expect(getGarmentType({ name: 'X', category: 'Blazers' })).toBe('blazer');
    expect(getGarmentType({ name: 'X', category: 'Overcoats' })).toBe('coat');
    expect(getGarmentType({ name: 'X', category: 'Topwear' })).toBe('shirt');
    expect(getGarmentType({ name: 'X', category: 'Jeans' })).toBe('trousers');
    expect(getGarmentType({ name: 'X', category: 'Footwear' })).toBe('shoes');
  });

  it('size options per type', () => {
    expect(getSizeOptions({ name: 'Shirt' })).toContain('XXL');
    expect(getSizeOptions({ name: 'Trouser' })).toContain('42');
    expect(getSizeOptions({ name: 'Boot' })).toContain('12');
    expect(getSizeOptions({ name: 'Blazer' })).toEqual(['36', '38', '40', '42', '44', '46']);
    expect(getSizeOptions({ name: 'Evening Gown' })).toEqual(['XS', 'S', 'M', 'L', 'XL']);
    expect(getSizeOptions({ name: 'X', category: 'dresses' })).toEqual(['XS', 'S', 'M', 'L', 'XL']);
    expect(getSizeOptions({ name: 'Sunglasses' })).toEqual(['52 mm', '54 mm', '56 mm']);
    expect(getSizeOptions({ name: 'Gold Chain' })).toEqual(['16 in', '18 in', '20 in', '22 in']);
    expect(getSizeOptions({ name: 'Bracelet' })).toEqual(['Small', 'Medium', 'Large']);
    expect(getSizeOptions({ name: 'X', category: 'jewelry' })).toEqual(['Small', 'Medium', 'Large']);
    expect(getSizeOptions({ name: 'Wallet' })).toEqual(['One Size']);
    expect(productRequiresSize({ name: 'Wallet' })).toBe(false);
    expect(productRequiresSize({ name: 'Shirt' })).toBe(true);
  });
});
