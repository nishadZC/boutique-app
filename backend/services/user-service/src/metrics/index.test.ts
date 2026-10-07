import { describe, it, expect } from 'vitest';
import * as m from './index';

describe('user-service metrics re-exports', () => {
  it('exposes the shared metrics helpers', () => {
    expect(typeof m.setupMetrics).toBe('function');
    expect(typeof m.metricsMiddleware).toBe('function');
    expect(m.register).toBeTruthy();
  });
});
