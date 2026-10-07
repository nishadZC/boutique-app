import { describe, it, expect } from 'vitest';
import * as common from './index';

describe('components/common barrel', () => {
  it('re-exports components', () => {
    for (const k of ['ProductCard', 'SearchBar', 'FilterPanel', 'LoadingSkeleton', 'ErrorBoundary', 'HomeCarousel']) {
      expect((common as Record<string, unknown>)[k]).toBeDefined();
    }
  });
});
