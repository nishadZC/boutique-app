import { describe, it, expect } from 'vitest';
import { getTailoringFields, measurementExample } from './measurements';

describe('measurements extra', () => {
  it('measurementExample', () => {
    expect(measurementExample('coat', 'chest' as never)).toBe('e.g. 108');
    expect(measurementExample(null, 'chest' as never)).toBe('');
    expect(measurementExample('coat', 'nope' as never)).toBe('');
    expect(getTailoringFields(null)).toEqual([]);
  });
});
