import { describe, it, expect } from 'vitest';
import { scoreCall } from './App';

describe('scoreCall', () => {
  it('should return a score of 7.5 with no data', () => {
    const score = scoreCall({}, 0);
    expect(score).toBe('7.5');
  });

  it('should return a higher score for low IV', () => {
    const score = scoreCall({ iv: 10, bid: 1, ask: 1.1 }, 0);
    expect(parseFloat(score)).toBeGreaterThan(8);
  });

  it('should return a lower score for high IV', () => {
    const score = scoreCall({ iv: 100, bid: 1, ask: 1.1 }, 0);
    expect(parseFloat(score)).toBeLessThan(5);
  });

  it('should return a higher score for a tight spread', () => {
    const score = scoreCall({ iv: 50, bid: 1, ask: 1.01 }, 0);
    expect(parseFloat(score)).toBeGreaterThan(7);
  });

  it('should return a lower score for a wide spread', () => {
    const score = scoreCall({ iv: 50, bid: 1, ask: 1.5 }, 0);
    expect(parseFloat(score)).toBeLessThan(6);
  });

  it('should return a higher score for more flow hits', () => {
    const score1 = scoreCall({ iv: 50, bid: 1, ask: 1.1 }, 0);
    const score2 = scoreCall({ iv: 50, bid: 1, ask: 1.1 }, 5);
    expect(parseFloat(score2)).toBeGreaterThan(parseFloat(score1));
  });

  it('should handle null or undefined inputs gracefully', () => {
    const score = scoreCall({ iv: null, bid: undefined, ask: null }, undefined);
    expect(score).toBe('7.5');
  });
});
