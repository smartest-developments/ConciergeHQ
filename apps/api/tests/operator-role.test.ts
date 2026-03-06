import { describe, expect, it } from 'vitest';
import { parseOperatorRoleHeader } from '../src/lib/operatorRole.js';

describe('parseOperatorRoleHeader', () => {
  it('requires role header for proposal publishing when no session role exists', () => {
    expect(parseOperatorRoleHeader(undefined)).toEqual({
      ok: false,
      statusCode: 401,
      error: 'AUTH_REQUIRED'
    });
  });

  it('rejects unsupported role values', () => {
    expect(parseOperatorRoleHeader('customer')).toEqual({
      ok: false,
      statusCode: 403,
      error: 'OPERATOR_FORBIDDEN'
    });
  });

  it('accepts OPERATOR and ADMIN role values case-insensitively', () => {
    expect(parseOperatorRoleHeader('operator')).toEqual({
      ok: true,
      role: 'OPERATOR'
    });
    expect(parseOperatorRoleHeader('ADMIN')).toEqual({
      ok: true,
      role: 'ADMIN'
    });
  });

  it('uses session role when available', () => {
    expect(parseOperatorRoleHeader(undefined, 'OPERATOR')).toEqual({
      ok: true,
      role: 'OPERATOR'
    });
    expect(parseOperatorRoleHeader('CUSTOMER', 'ADMIN')).toEqual({
      ok: true,
      role: 'ADMIN'
    });
  });

  it('forbids non-operator session roles', () => {
    expect(parseOperatorRoleHeader('ADMIN', 'CUSTOMER')).toEqual({
      ok: false,
      statusCode: 403,
      error: 'OPERATOR_FORBIDDEN'
    });
  });
});
