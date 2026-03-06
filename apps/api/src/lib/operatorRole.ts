import { z } from 'zod';
import type { SessionRole } from './sessionAuth.js';

const operatorRoleSchema = z.enum(['OPERATOR', 'ADMIN']);

export type OperatorRole = z.infer<typeof operatorRoleSchema>;

type OperatorRoleParseResult =
  | { ok: true; role: OperatorRole }
  | { ok: false; statusCode: 401 | 403; error: 'AUTH_REQUIRED' | 'OPERATOR_FORBIDDEN' };

function parseCandidateRole(candidate: unknown): OperatorRoleParseResult | null {
  const candidateRole = typeof candidate === 'string' ? candidate.trim().toUpperCase() : '';
  if (!candidateRole) {
    return null;
  }

  const parsedRole = operatorRoleSchema.safeParse(candidateRole);
  if (!parsedRole.success) {
    return { ok: false, statusCode: 403, error: 'OPERATOR_FORBIDDEN' };
  }

  return { ok: true, role: parsedRole.data };
}

export function parseOperatorRoleHeader(
  rawRoleHeader: unknown,
  sessionRole?: SessionRole | null
): OperatorRoleParseResult {
  const sessionRoleResult = parseCandidateRole(sessionRole);
  if (sessionRoleResult) {
    return sessionRoleResult;
  }

  if (typeof sessionRole === 'string' && sessionRole.trim().length > 0) {
    return { ok: false, statusCode: 403, error: 'OPERATOR_FORBIDDEN' };
  }

  const headerRoleResult = parseCandidateRole(rawRoleHeader);
  if (headerRoleResult) {
    return headerRoleResult;
  }

  return { ok: false, statusCode: 401, error: 'AUTH_REQUIRED' };
}
