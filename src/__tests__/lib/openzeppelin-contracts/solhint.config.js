import { describe, it, expect } from 'vitest';
import solhintConfig from '../../lib/openzeppelin-contracts/solhint.config';

describe('Solhint Configuration', () => {
  it('should export plugins array with openzeppelin', () => {
    expect(solhintConfig.plugins).toEqual(['openzeppelin']);
  });

  it('should export rules object with all expected rules', () => {
    const expectedRules = [
      'avoid-tx-origin',
      'const-name-snakecase',
      'contract-name-capwords',
      'event-name-capwords',
      'max-states-count',
      'explicit-types',
      'func-name-mixedcase',
      'func-param-name-mixedcase',
      'imports-on-top',
      'modifier-name-mixedcase',
      'no-console',
      'no-global-import',
      'no-unused-vars',
      'quotes',
      'use-forbidden-name',
      'var-name-mixedcase',
      'visibility-modifier-order',
      'interface-starts-with-i',
      'duplicated-imports',
    ];

    // Check static rules
    expectedRules.forEach(rule => {
      expect(solhintConfig.rules).toHaveProperty(rule, 'error');
    });

    // Check custom rules (mocked as empty for this test)
    // In real scenario, would verify custom rules are added
    expect(solhintConfig.rules).not.toHaveProperty('openzeppelin/');
  });

  it('should have correct structure', () => {
    expect(solhintConfig).toEqual({
      plugins: ['openzeppelin'],
      rules: expect.any(Object)
    });
  });
});