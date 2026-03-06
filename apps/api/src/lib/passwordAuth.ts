import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const digest = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `${salt}:${digest}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, digestHex] = storedHash.split(':');
  if (!salt || !digestHex || digestHex.length === 0 || digestHex.length % 2 !== 0) {
    return false;
  }

  if (!/^[0-9a-f]+$/i.test(digestHex)) {
    return false;
  }

  const expected = Buffer.from(digestHex, 'hex');
  if (expected.length === 0) {
    return false;
  }
  const actual = scryptSync(password, salt, expected.length);
  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}
