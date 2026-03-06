import { z } from 'zod';

const operatorRoleSchema = z.enum(['OPERATOR', 'ADMIN']);

export type OperatorRole = z.infer<typeof operatorRoleSchema>;

type OperatorRoleParseResult =
  | { ok: true; role: OperatorRole }
  | { ok: false; statusCode: 401 | 403; error: 'AUTH_REQUIRED' | 'OPERATOR_FORBIDDEN' };

export function parseOperatorRoleHeader(rawRoleHeader: unknown): OperatorRoleParseResult {
  const candidateRole = typeof rawRoleHeader === 'string' ? rawRoleHeader.trim().toUpperCase() : '';
  if (!candidateRole) {
    return { ok: false, statusCode: 401, error: 'AUTH_REQUIRED' };
  }

  const parsedRole = operatorRoleSchema.safeParse(candidateRole);
  if (!parsedRole.success) {
    return { ok: false, statusCode: 403, error: 'OPERATOR_FORBIDDEN' };
  }

  return { ok: true, role: parsedRole.data };
}
