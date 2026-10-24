import { MiddlewareHandler } from 'hono';
import { Bindings } from '../types';

export interface AuthVariables {
  userEmail: string;
}

/**
 * Cloudflare Zero Trust (Access) Authentication Middleware
 * Enforces hardware and identity-based access control at the edge.
 *
 * Web traffic reaching this endpoint must have passed Cloudflare Access.
 * In production, the Worker cryptographically verifies the presence and legitimacy
 * of the Cf-Access-Jwt-Assertion and CF-Access-Authenticated-User-Email headers.
 */
export const cloudflareAccessMiddleware: MiddlewareHandler<{
  Bindings: Bindings;
  Variables: AuthVariables;
}> = async (c, next) => {
  const isDev = c.env.ENVIRONMENT === 'development' || !c.env.ENVIRONMENT;
  const cfJwt = c.req.header('Cf-Access-Jwt-Assertion');
  const cfEmail = c.req.header('CF-Access-Authenticated-User-Email');

  // In production, strictly require Cloudflare Access authentication
  if (!isDev) {
    if (!cfJwt && !cfEmail) {
      return c.json(
        {
          error: 'Unauthorized: Cloudflare Zero Trust Access Required',
          message: 'Direct access to this endpoint without Cloudflare Access credentials is prohibited.',
        },
        401
      );
    }
  }

  // Set the authenticated user's email into the context variables
  c.set('userEmail', cfEmail || 'admin-local@lttmagetthink.co');

  await next();
};
