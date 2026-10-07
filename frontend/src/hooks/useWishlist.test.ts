import { describe, it, expect } from 'vitest';
import { useWishlist } from './useWishlist';
import { useWishlist as fromContext } from '../contexts/WishlistContext';

describe('useWishlist re-export', () => {
  it('re-exports the context hook', () => {
    expect(useWishlist).toBe(fromContext);
  });
});
