import { Hono } from 'hono';
import { Bindings } from './types';
import { AuthVariables, cloudflareAccessMiddleware } from './middleware/auth';
import { corsMiddleware, securityHeadersMiddleware } from './middleware/security';
import { publicRoutes } from './routes/public';
import { adminRoutes } from './routes/admin';
import { renderAdminHtml } from './views/adminUi';

const app = new Hono<{
  Bindings: Bindings;
  Variables: AuthVariables;
}>();

// Global DevSecOps Security Headers & CORS
app.use('*', securityHeadersMiddleware);
app.use('*', corsMiddleware);

// Root route: Information and API Status
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="th" style="background:#0f172a;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
      <div style="text-align:center;max-width:500px;padding:2rem;background:#1e293b;border-radius:1rem;border:1px solid #334155;box-shadow:0 20px 25px -5px rgb(0 0 0 / 0.5);">
        <h1 style="margin:0 0 0.5rem 0;color:#60a5fa;font-size:1.5rem;">LTT Ma getThink Edge API & CMS</h1>
        <p style="color:#94a3b8;font-size:0.875rem;margin-bottom:1.5rem;">ระบบจัดการหลังบ้าน Cloudflare Worker & D1 Database พร้อม Zero-Trust Access</p>
        <div style="display:flex;gap:1rem;justify-content:center;">
          <a href="/admin" style="background:#2563eb;color:#fff;text-decoration:none;padding:0.6rem 1.2rem;border-radius:0.5rem;font-size:0.875rem;font-weight:600;">เข้าสู่ระบบจัดการหลังบ้าน (CMS)</a>
        </div>
      </div>
    </html>
  `);
});

// Admin Web Application UI (Protected by Cloudflare Zero Trust Access)
app.get('/admin', cloudflareAccessMiddleware, (c) => {
  const userEmail = c.get('userEmail') || 'admin@lttmagetthink.co';
  return c.html(renderAdminHtml(userEmail));
});

app.get('/admin/*', cloudflareAccessMiddleware, (c) => {
  const userEmail = c.get('userEmail') || 'admin@lttmagetthink.co';
  return c.html(renderAdminHtml(userEmail));
});

// Mount Public Routes (Used by Frontend Website)
app.route('/api/public', publicRoutes);

// Mount Admin Routes (Protected by Cloudflare Access)
app.use('/api/admin/*', cloudflareAccessMiddleware);
app.route('/api/admin', adminRoutes);

export default app;
