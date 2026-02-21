import { describe, expect, it } from 'vitest';
import { calculateSourcingFeeChf } from '../src/domain/fee.js';

describe('calculateSourcingFeeChf', () => {
  it('returns minimum fee of 50 CHF for small budgets', () => {
    expect(calculateSourcingFeeChf(200)).toBe(50);
  });

  it('returns 10% of budget when above minimum threshold', () => {
    expect(calculateSourcingFeeChf(1200)).toBe(120);
  });
});
