import { describe, it, expect } from 'vitest';
import { hello } from '../test-utils';

describe('hello function', () => {
  it('should return "Hello from Halfkilo!"', () => {
    expect(hello()).toBe('Hello from Halfkilo!');
  });

  it('should be a function', () => {
    expect(typeof hello).toBe('function');
  });

  it('should return a string', () => {
    expect(typeof hello()).toBe('string');
  });
});