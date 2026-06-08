import { cookies } from 'next/headers';

const AUTH_COOKIE = 'admin_token';

/** Check if the request has valid admin authentication */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE);
  return token?.value === getExpectedToken();
}

/** Get the expected token value based on the admin password */
function getExpectedToken(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    // In development with no password set, default
    return 'dev-token-' + (password || 'admin123');
  }
  // Simple token derived from password
  return 'auth-' + Buffer.from(password).toString('base64');
}

/** Verify admin password and return success */
export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || 'admin123';
  return password === expected;
}

/** Get auth cookie name */
export function getAuthCookieName(): string {
  return AUTH_COOKIE;
}

/** Get the token value to set in cookie */
export function getAuthToken(): string {
  return getExpectedToken();
}
