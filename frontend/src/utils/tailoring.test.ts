import { describe, expect, it } from 'vitest';
import { getGarmentType, getSizeOptions } from './productSizing';
import { formatCustomSize, getTailoringFields, isValidMeasurement } from './measurements';

describe('getGarmentType', () => {
  it.each([
    [{ name: 'Grey Herringbone Topcoat', category: 'Coats & Overcoats' }, 'coat'],   // "topcoat" contains "top"
    [{ name: 'Ivory Linen Waistcoat', category: 'Suits & Waistcoats' }, 'waistcoat'], // not a coat or a suit
    [{ name: 'Black Shawl-Lapel Tuxedo', category: 'Suits & Waistcoats' }, 'suit'],
    [{ name: 'Burgundy Velvet Dinner Jacket', category: 'Blazers' }, 'blazer'],
    [{ name: 'Stone Double-Breasted Trench Coat', category: 'Coats & Overcoats' }, 'coat'],
    [{ name: 'Navy Blue Formal Shirt', category: 'Formal Shirts' }, 'shirt'],
    [{ name: 'Charcoal Formal Trousers', category: 'Trousers & Pants' }, 'trousers'],
    [{ name: 'Black Oxford Formal Shoes', category: 'Formal Shoes' }, 'shoes'],
  ])('classifies %o', (product, expected) => {
    expect(getGarmentType(product)).toBe(expected);
  });

  it('sizes tailoring by chest', () => {
    expect(getSizeOptions({ name: 'Navy Hopsack Blazer', category: 'Blazers' })).toEqual(['36', '38', '40', '42', '44', '46']);
  });
});

describe('tailoring measurements', () => {
  it('asks for the right measurements per garment', () => {
    expect(getTailoringFields('shirt')).toEqual(['shoulder', 'chest', 'sleeve', 'neck']);
    expect(getTailoringFields('coat')).toEqual(['chest', 'shoulder', 'sleeve', 'length']);
    expect(getTailoringFields('waistcoat')).toEqual(['chest', 'shoulder', 'length']);
    expect(getTailoringFields('shoes')).toEqual([]);
  });

  it('accepts a full-length coat but rejects nonsense lengths', () => {
    expect(isValidMeasurement('length', '105')).toBe(true);
    expect(isValidMeasurement('length', '12')).toBe(false);
    expect(isValidMeasurement('length', '76.555')).toBe(false);
  });

  it('records made-to-measure orders in the size', () => {
    expect(formatCustomSize(['chest', 'length'], { chest: '102', length: '76' }, true))
      .toBe('Made to measure (Chest: 102cm, Length: 76cm)');
    expect(formatCustomSize(['neck'], { neck: '40' })).toBe('Custom (Neck: 40cm)');
  });
});
