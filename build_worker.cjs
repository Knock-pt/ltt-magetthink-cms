const fs = require('fs');
const path = require('path');

const workerPath = path.join(__dirname, 'backend', 'worker.js');
const adminHtmlPath = path.join(__dirname, 'backend', 'admin.html');

let worker = fs.readFileSync(workerPath, 'utf8');
const adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');

// 1. Update jsonResponse to support edge caching
const oldJsonResponse = `function jsonResponse(data, status = 200, origin = '*') {
  const resp = new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
  return setSecurityHeaders(resp, origin);
}`;

const newJsonResponse = `function jsonResponse(data, status = 200, origin = '*', isPublicCacheable = false) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8' };
  if (isPublicCacheable && status === 200) {
    headers['Cache-Control'] = 'public, max-age=60, s-maxage=300, stale-while-revalidate=600';
  } else {
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
  }
  const resp = new Response(JSON.stringify(data), {
    status,
    headers,
  });
  return setSecurityHeaders(resp, origin);
}`;

if (worker.includes(oldJsonResponse)) {
  worker = worker.replace(oldJsonResponse, newJsonResponse);
}

// 2. Add columns to ensureDbSchema
if (!worker.includes('ALTER TABLE custom_pages ADD COLUMN content_json TEXT')) {
  worker = worker.replace(
    `"ALTER TABLE inquiries ADD COLUMN ip_address TEXT"`,
    `"ALTER TABLE inquiries ADD COLUMN ip_address TEXT",\n    "ALTER TABLE custom_pages ADD COLUMN content_json TEXT",\n    "ALTER TABLE custom_pages ADD COLUMN meta_description TEXT"`
  );
}

// 3. Update public endpoints with cache flag
worker = worker.replace(
  `return jsonResponse({ success: true, data: results || [] }, 200, origin);`,
  `return jsonResponse({ success: true, data: results || [] }, 200, origin, true);`
);

worker = worker.replace(
  `return jsonResponse({ success: true, data: settings }, 200, origin);`,
  `return jsonResponse({ success: true, data: settings }, 200, origin, true);`
);

worker = worker.replace(
  `return jsonResponse({ success: true, data: formatted }, 200, origin);`,
  `return jsonResponse({ success: true, data: formatted }, 200, origin, true);`
);

// 4. Add custom_pages public endpoints before Admin APIs
const publicPagesEndpoints = `      // Custom Pages Public API
      if (path === '/api/public/pages' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT id, title, slug, cover_image, template_style, is_active, updated_at FROM custom_pages WHERE is_active = 1 ORDER BY updated_at DESC').all();
        return jsonResponse({ success: true, data: results || [] }, 200, origin, true);
      }

      if (path.startsWith('/api/public/pages/') && method === 'GET') {
        const slug = path.replace('/api/public/pages/', '');
        const item = await env.DB.prepare('SELECT * FROM custom_pages WHERE (slug = ? OR id = ?) AND is_active = 1').bind(slug, slug).first();
        if (!item) return jsonResponse({ success: false, error: 'Page not found' }, 404, origin);
        return jsonResponse({ success: true, data: item }, 200, origin, true);
      }
`;

if (!worker.includes("path === '/api/public/pages'")) {
  worker = worker.replace(
    `      // -------------------------------------------------------------\n      // 3. Admin APIs (Backoffice)`,
    publicPagesEndpoints + `\n      // -------------------------------------------------------------\n      // 3. Admin APIs (Backoffice)`
  );
}

// 5. Add custom_pages admin endpoints before inquiries or site-settings
const adminPagesEndpoints = `      // Custom Pages Admin API
      if (path === '/api/admin/pages' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM custom_pages ORDER BY updated_at DESC').all();
        return jsonResponse({ success: true, data: results || [] }, 200, origin);
      }

      if (path === '/api/admin/pages' && method === 'POST') {
        const body = await request.json();
        const title = sanitizeInput(body.title);
        let slug = sanitizeInput(body.slug || '').toLowerCase().replace(/[^a-z0-9-_ก-๙]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (!slug) slug = 'page-' + Date.now();
        const content = body.content || '';
        const content_json = body.content_json || '[]';
        const meta_description = sanitizeInput(body.meta_description || '');
        const cover_image = sanitizeInput(body.cover_image || '');
        const template_style = sanitizeInput(body.template_style || 'visual-columns');
        const add_to_nav = Boolean(body.add_to_nav);

        const res = await env.DB.prepare(
          \`INSERT INTO custom_pages (title, slug, content, content_json, meta_description, cover_image, template_style, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)\`
        ).bind(title, slug, content, content_json, meta_description, cover_image, template_style).run();

        if (add_to_nav) {
          const navCount = await env.DB.prepare('SELECT COUNT(*) as count FROM navigation_menus').first();
          const sortOrder = (navCount?.count || 0) + 1;
          await env.DB.prepare(
            \`INSERT INTO navigation_menus (label, path, sort_order, is_active)
             VALUES (?, ?, ?, 1)\`
          ).bind(title, '/p/' + slug, sortOrder).run();
        }

        return jsonResponse({ success: true, message: 'สร้างเพจใหม่เรียบร้อยแล้ว', slug, id: res.meta?.last_row_id }, 201, origin);
      }

      if (path.startsWith('/api/admin/pages/') && method === 'PUT') {
        const id = path.replace('/api/admin/pages/', '');
        const body = await request.json();
        const title = sanitizeInput(body.title);
        let slug = sanitizeInput(body.slug || '').toLowerCase().replace(/[^a-z0-9-_ก-๙]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        const content = body.content || '';
        const content_json = body.content_json || '[]';
        const meta_description = sanitizeInput(body.meta_description || '');
        const cover_image = sanitizeInput(body.cover_image || '');
        const is_active = body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1;

        await env.DB.prepare(
          \`UPDATE custom_pages 
           SET title = ?, slug = ?, content = ?, content_json = ?, meta_description = ?, cover_image = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?\`
        ).bind(title, slug, content, content_json, meta_description, cover_image, is_active, id).run();

        return jsonResponse({ success: true, message: 'บันทึกการแก้ไขเพจเรียบร้อยแล้ว' }, 200, origin);
      }

      if (path.startsWith('/api/admin/pages/') && method === 'DELETE') {
        const id = path.replace('/api/admin/pages/', '');
        await env.DB.prepare('DELETE FROM custom_pages WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: 'ลบหน้าเพจเรียบร้อยแล้ว' }, 200, origin);
      }
`;

if (!worker.includes("path === '/api/admin/pages'")) {
  worker = worker.replace(
    `      // Site Settings\n      if (path === '/api/admin/site-settings'`,
    adminPagesEndpoints + `\n      // Site Settings\n      if (path === '/api/admin/site-settings'`
  );
}

// 6. Embed updated admin.html into ADMIN_HTML_TEMPLATE
const templatePrefix = 'const ADMIN_HTML_TEMPLATE = ';
const idx = worker.indexOf(templatePrefix);
if (idx !== -1) {
  const codeBefore = worker.substring(0, idx + templatePrefix.length);
  const newWorkerContent = codeBefore + JSON.stringify(adminHtml) + ';\n\nfunction getAdminHtml(userEmail) {\n  return ADMIN_HTML_TEMPLATE;\n}\n';
  fs.writeFileSync(workerPath, newWorkerContent, 'utf8');
} else {
  fs.writeFileSync(workerPath, worker, 'utf8');
}

console.log('worker.js successfully built with caching, custom_pages APIs, and updated admin.html template!');
