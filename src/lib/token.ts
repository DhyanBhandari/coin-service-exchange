// src/lib/token.ts
export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function decodeToken(token: string): { email: string; role: string; exp: number } | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch (e) {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  return decoded.exp * 1000 < Date.now();
}

export function getTokenPayload(): { email: string; role: string; exp: number } | null {
  const token = getToken();
  if (!token) return null;
  return decodeToken(token);
}
