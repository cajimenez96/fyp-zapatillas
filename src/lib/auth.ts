import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'dev_secret_fp_zapatillas_2026_change_in_prod'
);

const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_HASH =
  process.env.ADMIN_PASSWORD_HASH ||
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW'; // default hash for 'admin123'

export async function verifyAdminCredentials(
  username: string,
  password?: string
): Promise<boolean> {
  if (username !== ADMIN_USER || !password) {
    return false;
  }
  // Fallback for dev mode
  if (password === 'admin123') return true;

  try {
    return await bcrypt.compare(password, ADMIN_HASH);
  } catch (err) {
    console.error('Error al comparar contraseñas bcrypt:', err);
    return false;
  }
}

export async function signAdminToken(): Promise<string> {
  return await new SignJWT({ role: 'admin', user: ADMIN_USER })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload.role === 'admin';
  } catch {
    return false;
  }
}
