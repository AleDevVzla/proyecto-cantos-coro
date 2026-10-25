import type { Role } from '@cantos/shared';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  name: string;
  choirId: string;
  choirName: string;
  parish: string;
  role: Role;
  exp: number;
}

const SECRET = process.env.JWT_SECRET || 'cantos-liturgicos-super-secret-jwt-key-2026';

function toBase64Url(input: string): string {
  return Buffer.from(input, 'utf-8').toString('base64url');
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf-8');
}

export function signToken(payload: Omit<AuthTokenPayload, 'exp'>): string {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const fullPayload: AuthTokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 días
  };
  const body = toBase64Url(JSON.stringify(fullPayload));
  const hasher = new Bun.CryptoHasher('sha256', SECRET);
  hasher.update(`${header}.${body}`);
  const signature = Buffer.from(hasher.digest()).toString('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const hasher = new Bun.CryptoHasher('sha256', SECRET);
    hasher.update(`${header}.${body}`);
    const expectedSig = Buffer.from(hasher.digest()).toString('base64url');
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(fromBase64Url(body)) as AuthTokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function extractBearerUser(authHeader?: string): AuthTokenPayload | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return verifyToken(token);
}
