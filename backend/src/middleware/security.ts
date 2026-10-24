import { MiddlewareHandler } from 'hono';
import { Bindings } from '../types';

/**
 * DevSecOps Security Headers Middleware
 * Protects against XSS, Clickjacking, MIME sniffing, and Protocol downgrade attacks.
 */
export const securityHeadersMiddleware: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  await next();

  // Strict Transport Security (HSTS)
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // Prevent clickjacking by denying framing
  c.header('X-Frame-Options', 'DENY');
  // Prevent MIME sniffing
  c.header('X-Content-Type-Options', 'nosniff');
  // Strict Referrer Policy
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permission Policy
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Content Security Policy for Admin Dashboard and API
  c.header(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.tailwindcss.com https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https:;"
  );
};

/**
 * CORS Middleware with strict origin matching (No wildcard '*' for state-changing endpoints)
 */
export const corsMiddleware: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  const origin = c.req.header('Origin') || '';
  const frontendOrigin = c.env.FRONTEND_ORIGIN || 'http://localhost:3000';
  const adminOrigin = c.env.ADMIN_ORIGIN || 'http://localhost:8787';

  // Allow from specified origins or localhost in dev
  const allowed = [
    frontendOrigin,
    adminOrigin,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8787',
    'https://www.lttmagetthink.co',
    'https://cms.lttmagetthink.co',
  ];

  if (allowed.includes(origin) || !origin) {
    c.header('Access-Control-Allow-Origin', origin || '*');
  }

  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cf-Access-Jwt-Assertion');
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Max-Age', '86400');

  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }

  await next();
};

/**
 * XSS Sanitizer for string inputs
 * Removes harmful script injection characters and HTML tags.
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}
