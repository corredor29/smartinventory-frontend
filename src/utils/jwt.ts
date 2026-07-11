/**
 * Utilidades JWT (solo lectura de payload; la firma la valida el backend).
 */

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const json = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Decodifica el UserId del JWT.
 */
export function getUserIdFromToken(token: string | null): number | null {
  if (!token) return null;
  const payload = parseJwtPayload(token);
  if (!payload) return null;
  const raw =
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
    payload['nameid'] ??
    payload['sub'];
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * Lee customerId del claim (tokens nuevos).
 */
export function getCustomerIdFromToken(token: string | null): number | null {
  if (!token) return null;
  const payload = parseJwtPayload(token);
  if (!payload) return null;
  const raw = payload['customerId'] ?? payload['customer_id'];
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * true si el token no existe, no se puede leer, o ya expiró (con 30s de margen).
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const payload = parseJwtPayload(token);
  if (!payload) return true;
  const exp = Number(payload.exp);
  if (!Number.isFinite(exp)) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return exp <= nowSec + 30;
}
