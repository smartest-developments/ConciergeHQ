import { describe, expect, it } from 'vitest';
import { parseOperatorSessionRole } from '../src/lib/operatorRole.js';

describe('parseOperatorSessionRole', () => {
  it('requires authenticated operator/admin session role', () => {
    expect(parseOperatorSessionRole(undefined)).toEqual({
      ok: false,
      statusCode: 401,
      error: 'AUTH_REQUIRED'
    });
  });

  it('rejects unsupported role values', () => {
    expect(parseOperatorSessionRole('customer' as never)).toEqual({
      ok: false,
      statusCode: 403,
      error: 'OPERATOR_FORBIDDEN'
    });
  });

  it('accepts OPERATOR and ADMIN role values', () => {
    expect(parseOperatorSessionRole('OPERATOR')).toEqual({
      ok: true,
      role: 'OPERATOR'
    });
    expect(parseOperatorSessionRole('ADMIN')).toEqual({
      ok: true,
      role: 'ADMIN'
    });
  });

  it('forbids non-operator session roles', () => {
    expect(parseOperatorSessionRole('CUSTOMER')).toEqual({
      ok: false,
      statusCode: 403,
      error: 'OPERATOR_FORBIDDEN'
    });
  });
});
