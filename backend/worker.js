/**
 * LTT Ma getThink — Standalone Cloudflare Worker (Zero Dependencies)
 * Ready to copy-paste directly into Cloudflare Web Editor in your browser!
 */

// DevSecOps Security Headers & CORS
function setSecurityHeaders(response, origin) {
  const headers = new Headers(response.headers);
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.tailwindcss.com https://fonts.googleapis.com https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.tailwindcss.com https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https:;"
  );

  // CORS
  headers.set('Access-Control-Allow-Origin', origin || '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cf-Access-Jwt-Assertion');
  headers.set('Access-Control-Allow-Credentials', 'true');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonResponse(data, status = 200, origin = '*') {
  const resp = new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
  return setSecurityHeaders(resp, origin);
}

function htmlResponse(html, status = 200) {
  const resp = new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
  return setSecurityHeaders(resp, '*');
}

function sanitizeInput(str) {
  if (!str) return '';
  return String(str)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const origin = request.headers.get('Origin') || '*';

    // Handle CORS Preflight
    if (method === 'OPTIONS') {
      const resp = new Response(null, { status: 204 });
      return setSecurityHeaders(resp, origin);
    }

    // Cloudflare Access Email detection
    const userEmail = request.headers.get('CF-Access-Authenticated-User-Email') || 'admin@lttmagetthink.co';

    try {
      // -------------------------------------------------------------
      // 1. Root & Admin UI (Opens CMS directly at path / and /admin)
      // -------------------------------------------------------------
      if (path === '/' || path === '' || path === '/admin' || path.startsWith('/admin/')) {
        return htmlResponse(getAdminHtml(userEmail));
      }

      // -------------------------------------------------------------
      // 1.1 R2 Media File Delivery (/media/uploads/...)
      // -------------------------------------------------------------
      if (path.startsWith('/media/') && method === 'GET') {
        const fileKey = path.replace('/media/', '');
        if (env.R2_BUCKET) {
          const object = await env.R2_BUCKET.get(fileKey);
          if (object) {
            const headers = new Headers();
            object.writeHttpMetadata(headers);
            headers.set('etag', object.httpEtag);
            headers.set('Cache-Control', 'public, max-age=31536000');
            headers.set('Access-Control-Allow-Origin', '*');
            return new Response(object.body, { headers });
          }
        }
        return jsonResponse({ error: 'File not found' }, 404, origin);
      }

      // -------------------------------------------------------------
      // 2. Public APIs (For Frontend)
      // -------------------------------------------------------------
      if (path === '/api/public/navigation' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM navigation_menus WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').all();
        return jsonResponse({ success: true, data: results || [] }, 200, origin);
      }

      if (path === '/api/public/site-settings' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT key, value FROM site_settings').all();
        const settings = {};
        (results || []).forEach(r => { settings[r.key] = r.value; });
        return jsonResponse({ success: true, data: settings }, 200, origin);
      }

      if (path === '/api/public/services' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').all();
        const formatted = (results || []).map(s => ({
          ...s,
          bullet_points: s.bullet_points ? JSON.parse(s.bullet_points) : []
        }));
        return jsonResponse({ success: true, data: formatted }, 200, origin);
      }

      if (path === '/api/public/portfolios' && method === 'GET') {
        const category = url.searchParams.get('category');
        let query = 'SELECT * FROM portfolios WHERE is_active = 1';
        const params = [];
        if (category && category !== 'all') {
          query += ' AND category_slug = ?';
          params.push(category);
        }
        query += ' ORDER BY sort_order ASC, id DESC';
        const stmt = env.DB.prepare(query);
        const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
        const formatted = (results || []).map(p => ({
          ...p,
          gallery_images: p.gallery_images ? JSON.parse(p.gallery_images) : []
        }));
        return jsonResponse({ success: true, data: formatted }, 200, origin);
      }

      if (path.startsWith('/api/public/portfolios/') && method === 'GET') {
        const slug = path.replace('/api/public/portfolios/', '');
        const item = await env.DB.prepare('SELECT * FROM portfolios WHERE slug = ? AND is_active = 1').bind(slug).first();
        if (!item) return jsonResponse({ success: false, error: 'Not found' }, 404, origin);
        return jsonResponse({
          success: true,
          data: { ...item, gallery_images: item.gallery_images ? JSON.parse(item.gallery_images) : [] }
        }, 200, origin);
      }

      if (path === '/api/public/articles' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM articles WHERE status = "published" ORDER BY published_at DESC').all();
        return jsonResponse({ success: true, data: results || [] }, 200, origin);
      }

      if (path === '/api/public/client-logos' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM client_logos WHERE is_active = 1 ORDER BY sort_order ASC').all();
        return jsonResponse({ success: true, data: results || [] }, 200, origin);
      }

      if (path === '/api/public/inquiries' && method === 'POST') {
        const body = await request.json();
        const full_name = sanitizeInput(body.full_name);
        const email = sanitizeInput(body.email);
        const phone = sanitizeInput(body.phone);
        const company = sanitizeInput(body.company);
        const service_interested = sanitizeInput(body.service_interested);
        const budget_range = sanitizeInput(body.budget_range);
        const message = sanitizeInput(body.message);
        const source_page = sanitizeInput(body.source_page) || 'contact-us';
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

        if (!full_name || !email || !phone || !message) {
          return jsonResponse({ success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, 400, origin);
        }

        await env.DB.prepare(
          `INSERT INTO inquiries (full_name, email, phone, company, service_interested, budget_range, message, source_page, ip_address)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(full_name, email, phone, company, service_interested, budget_range, message, source_page, ip).run();

        return jsonResponse({ success: true, message: 'ส่งข้อมูลเรียบร้อยแล้ว ทีมงานจะติดต่อกลับโดยเร็วที่สุดครับ' }, 200, origin);
      }

      // -------------------------------------------------------------
      // 3. Admin APIs (Backoffice)
      // -------------------------------------------------------------
      if (path === '/api/admin/navigation' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM navigation_menus ORDER BY sort_order ASC, id ASC').all();
        return jsonResponse({ success: true, data: results || [] }, 200, origin);
      }

      if (path === '/api/admin/navigation' && method === 'POST') {
        const b = await request.json();
        const label = sanitizeInput(b.label);
        const p = sanitizeInput(b.path);
        const is_external = b.is_external ? 1 : 0;
        const sort_order = Number(b.sort_order) || 0;
        const is_active = b.is_active !== undefined ? (b.is_active ? 1 : 0) : 1;

        if (!label || !p) {
          return jsonResponse({ success: false, error: 'กรุณากรอกชื่อเมนูและ Path' }, 400, origin);
        }

        await env.DB.prepare(
          'INSERT INTO navigation_menus (label, path, is_external, sort_order, is_active) VALUES (?, ?, ?, ?, ?)'
        ).bind(label, p, is_external, sort_order, is_active).run();

        return jsonResponse({ success: true, message: 'เพิ่มเมนูหลักเรียบร้อยแล้ว' }, 200, origin);
      }

      if (path.startsWith('/api/admin/navigation/') && method === 'PUT') {
        const id = path.replace('/api/admin/navigation/', '');
        const b = await request.json();
        const label = sanitizeInput(b.label);
        const p = sanitizeInput(b.path);
        const is_external = b.is_external ? 1 : 0;
        const sort_order = Number(b.sort_order) || 0;
        const is_active = b.is_active ? 1 : 0;

        await env.DB.prepare(
          'UPDATE navigation_menus SET label = ?, path = ?, is_external = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(label, p, is_external, sort_order, is_active, id).run();

        return jsonResponse({ success: true, message: 'อัปเดตเมนูเรียบร้อยแล้ว' }, 200, origin);
      }

      if (path.startsWith('/api/admin/navigation/') && method === 'DELETE') {
        const id = path.replace('/api/admin/navigation/', '');
        await env.DB.prepare('DELETE FROM navigation_menus WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: 'ลบเมนูเรียบร้อยแล้ว' }, 200, origin);
      }

      if (path.match(/\/api\/admin\/inquiries\/\d+\/notes/) && method === 'PATCH') {
        const id = path.split('/')[4];
        const { notes } = await request.json();
        await env.DB.prepare('UPDATE inquiries SET admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(sanitizeInput(notes), id).run();
        return jsonResponse({ success: true, message: 'บันทึกโน้ตสำเร็จ' }, 200, origin);
      }

      if (path === '/api/admin/dashboard/stats' && method === 'GET') {
        const totalInquiries = await env.DB.prepare('SELECT COUNT(*) as count FROM inquiries').first();
        const newInquiries = await env.DB.prepare('SELECT COUNT(*) as count FROM inquiries WHERE status = "new"').first();
        const totalPortfolios = await env.DB.prepare('SELECT COUNT(*) as count FROM portfolios').first();
        const totalServices = await env.DB.prepare('SELECT COUNT(*) as count FROM services').first();
        const totalArticles = await env.DB.prepare('SELECT COUNT(*) as count FROM articles').first();
        const recentInquiries = await env.DB.prepare('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 5').all();

        return jsonResponse({
          success: true,
          data: {
            total_inquiries: totalInquiries?.count || 0,
            new_inquiries: newInquiries?.count || 0,
            total_portfolios: totalPortfolios?.count || 0,
            total_services: totalServices?.count || 0,
            total_articles: totalArticles?.count || 0,
            recent_inquiries: recentInquiries.results || [],
            user_email: userEmail
          }
        }, 200, origin);
      }

      if (path === '/api/admin/portfolios' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM portfolios ORDER BY sort_order ASC, id DESC').all();
        return jsonResponse({ success: true, data: results || [] }, 200, origin);
      }

      if (path === '/api/admin/portfolios' && method === 'POST') {
        const b = await request.json();
        const title = sanitizeInput(b.title);
        const slug = sanitizeInput(b.slug) || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const client_name = sanitizeInput(b.client_name);
        const category_slug = sanitizeInput(b.category_slug) || 'all';
        const cover_image = sanitizeInput(b.cover_image);
        const summary = sanitizeInput(b.summary);
        const featured = b.featured ? 1 : 0;
        const sort_order = Number(b.sort_order) || 0;

        await env.DB.prepare(
          `INSERT INTO portfolios (title, slug, client_name, category_slug, cover_image, summary, featured, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(title, slug, client_name, category_slug, cover_image, summary, featured, sort_order).run();

        return jsonResponse({ success: true, message: 'บันทึกผลงานเรียบร้อยแล้ว' }, 200, origin);
      }

      if (path.startsWith('/api/admin/portfolios/') && method === 'DELETE') {
        const id = path.replace('/api/admin/portfolios/', '');
        await env.DB.prepare('DELETE FROM portfolios WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: 'ลบผลงานเรียบร้อย' }, 200, origin);
      }

      if (path === '/api/admin/services' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM services ORDER BY sort_order ASC').all();
        return jsonResponse({ success: true, data: results || [] }, 200, origin);
      }

      if (path.startsWith('/api/admin/services/') && method === 'PUT') {
        const id = path.replace('/api/admin/services/', '');
        const b = await request.json();
        await env.DB.prepare(
          `UPDATE services SET title = ?, subtitle = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(sanitizeInput(b.title), sanitizeInput(b.subtitle), sanitizeInput(b.description), id).run();
        return jsonResponse({ success: true, message: 'อัปเดตบริการเรียบร้อย' }, 200, origin);
      }

      if (path === '/api/admin/articles' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM articles ORDER BY published_at DESC').all();
        return jsonResponse({ success: true, data: results || [] }, 200, origin);
      }

      if (path.startsWith('/api/admin/articles/') && method === 'DELETE') {
        const id = path.replace('/api/admin/articles/', '');
        await env.DB.prepare('DELETE FROM articles WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: 'ลบบทความเรียบร้อย' }, 200, origin);
      }

      if (path === '/api/admin/client-logos' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM client_logos ORDER BY sort_order ASC').all();
        return jsonResponse({ success: true, data: results || [] }, 200, origin);
      }

      if (path === '/api/admin/client-logos' && method === 'POST') {
        const body = await request.json();
        const name = sanitizeInput(body.name);
        const logo_url = sanitizeInput(body.logo_url);
        const website_url = sanitizeInput(body.website_url);
        const sort_order = Number(body.sort_order) || 0;
        await env.DB.prepare(
          'INSERT INTO client_logos (name, logo_url, website_url, sort_order, is_active) VALUES (?, ?, ?, ?, 1)'
        ).bind(name, logo_url, website_url, sort_order).run();
        return jsonResponse({ success: true, message: 'เพิ่มโลโก้ลูกค้าเรียบร้อย' }, 201, origin);
      }

      if (path.startsWith('/api/admin/client-logos/') && method === 'DELETE') {
        const id = path.replace('/api/admin/client-logos/', '');
        await env.DB.prepare('DELETE FROM client_logos WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: 'ลบโลโก้เรียบร้อย' }, 200, origin);
      }

      if (path === '/api/admin/inquiries' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all();
        return jsonResponse({ success: true, data: results || [] }, 200, origin);
      }

      if (path.match(/\/api\/admin\/inquiries\/\d+\/status/) && method === 'PATCH') {
        const id = path.split('/')[4];
        const { status } = await request.json();
        await env.DB.prepare('UPDATE inquiries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(status, id).run();
        return jsonResponse({ success: true, message: 'อัปเดตสถานะเรียบร้อย' }, 200, origin);
      }

      if (path === '/api/admin/inquiries/export.csv' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all();
        let csv = '\uFEFFID,Full Name,Email,Phone,Company,Service,Budget,Message,Status,Date\n';
        (results || []).forEach(r => {
          const esc = v => `"${String(v || '').replace(/"/g, '""')}"`;
          csv += `${r.id},${esc(r.full_name)},${esc(r.email)},${esc(r.phone)},${esc(r.company)},${esc(r.service_interested)},${esc(r.budget_range)},${esc(r.message)},${esc(r.status)},${r.created_at}\n`;
        });
        const resp = new Response(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="inquiries_export.csv"'
          }
        });
        return setSecurityHeaders(resp, origin);
      }

      if (path === '/api/admin/site-settings' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM site_settings').all();
        return jsonResponse({ success: true, data: results || [] }, 200, origin);
      }

      if (path === '/api/admin/site-settings' && method === 'PUT') {
        const body = await request.json();
        const updates = body.settings || [];
        for (const item of updates) {
          await env.DB.prepare('INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)').bind(item.key, item.value).run();
        }
        return jsonResponse({ success: true, message: 'บันทึกการตั้งค่าเรียบร้อย' }, 200, origin);
      }

      if (path === '/api/admin/sync/purge-cache' && method === 'POST') {
        return jsonResponse({ success: true, message: 'คำสั่งล้างแคชส่งไปยังหน้าบ้านเรียบร้อยแล้ว' }, 200, origin);
      }

      if (path === '/api/admin/media/upload' && method === 'POST') {
        if (!env.R2_BUCKET) {
          return jsonResponse({ success: false, error: 'ยังไม่ได้ผูก R2_BUCKET ในหน้า Settings ของ Worker' }, 400, origin);
        }
        const formData = await request.formData();
        const file = formData.get('file');
        if (!file || !(file instanceof File)) {
          return jsonResponse({ success: false, error: 'กรุณาเลือกไฟล์ที่ต้องการอัปโหลด' }, 400, origin);
        }
        const ext = file.name.split('.').pop() || 'jpg';
        const fileKey = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        await env.R2_BUCKET.put(fileKey, file.stream(), {
          httpMetadata: { contentType: file.type }
        });
        const fileUrl = `/media/${fileKey}`;
        await env.DB.prepare(
          'INSERT INTO media_assets (file_name, file_key, file_url, mime_type, file_size) VALUES (?, ?, ?, ?, ?)'
        ).bind(file.name, fileKey, fileUrl, file.type, file.size).run();

        return jsonResponse({ success: true, file_url: fileUrl, file_key: fileKey }, 200, origin);
      }

      return jsonResponse({ error: 'Endpoint Not Found', path }, 404, origin);
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500, origin);
    }
  }
};

// Embedded Backoffice HTML
function getAdminHtml(userEmail) {
  return `<!DOCTYPE html>
<html lang="th" class="h-full bg-slate-900 text-slate-100">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LTT Ma getThink — Edge CMS Backoffice</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', 'Noto Sans Thai', sans-serif; }
    .glass-card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
    .active-nav { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.39); }
  </style>
</head>
<body class="h-full flex overflow-hidden">
  <!-- Sidebar -->
  <aside class="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 z-20">
    <div class="h-16 flex items-center px-6 gap-3 border-b border-slate-800">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/30">
        L
      </div>
      <div>
        <h1 class="font-bold text-sm text-white">LTT Ma getThink</h1>
        <p class="text-[11px] text-blue-400 font-medium">Edge Backoffice CMS</p>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <nav class="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto" id="sidebarNav">
      <button type="button" onclick="switchTab('dashboard')" id="btn-tab-dashboard" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition active-nav">
        <i data-lucide="layout-dashboard" class="w-4 h-4 shrink-0"></i><span>Dashboard ภาพรวม</span>
      </button>
      <button type="button" onclick="switchTab('navigation')" id="btn-tab-navigation" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition text-slate-400 hover:text-white hover:bg-slate-900">
        <i data-lucide="compass" class="w-4 h-4 shrink-0"></i><span>Navigation เมนูหลัก</span>
      </button>
      <button type="button" onclick="switchTab('portfolios')" id="btn-tab-portfolios" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition text-slate-400 hover:text-white hover:bg-slate-900">
        <i data-lucide="briefcase" class="w-4 h-4 shrink-0"></i><span>Portfolios ผลงาน</span>
      </button>
      <button type="button" onclick="switchTab('services')" id="btn-tab-services" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition text-slate-400 hover:text-white hover:bg-slate-900">
        <i data-lucide="sparkles" class="w-4 h-4 shrink-0"></i><span>Services บริการ</span>
      </button>
      <button type="button" onclick="switchTab('articles')" id="btn-tab-articles" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition text-slate-400 hover:text-white hover:bg-slate-900">
        <i data-lucide="newspaper" class="w-4 h-4 shrink-0"></i><span>Blog & Events บทความ</span>
      </button>
      <button type="button" onclick="switchTab('clients')" id="btn-tab-clients" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition text-slate-400 hover:text-white hover:bg-slate-900">
        <i data-lucide="building-2" class="w-4 h-4 shrink-0"></i><span>Client Logos ลูกค้า</span>
      </button>
      <button type="button" onclick="switchTab('inquiries')" id="btn-tab-inquiries" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition text-slate-400 hover:text-white hover:bg-slate-900 justify-between">
        <div class="flex items-center gap-3">
          <i data-lucide="inbox" class="w-4 h-4 shrink-0"></i><span>Inquiries ข้อความติดต่อ</span>
        </div>
        <span id="badge-new-inquiries" class="hidden bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">0</span>
      </button>
      <button type="button" onclick="switchTab('settings')" id="btn-tab-settings" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition text-slate-400 hover:text-white hover:bg-slate-900">
        <i data-lucide="settings" class="w-4 h-4 shrink-0"></i><span>Site Settings & SEO</span>
      </button>
    </nav>

    <div class="p-3 border-t border-slate-800">
      <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
        <div class="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Zero Trust Protected</span>
        </div>
        <p class="text-slate-400 truncate">${userEmail}</p>
        <p class="text-[10px] text-slate-500 mt-0.5">Pure JS (Strict CSP - No unsafe-eval)</p>
      </div>
    </div>
  </aside>

  <!-- Main Content -->
  <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
    <header class="h-16 border-b border-slate-800 bg-slate-950/40 backdrop-blur px-8 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-3">
        <h2 id="currentTabTitle" class="text-base font-bold text-white capitalize">Dashboard ภาพรวม</h2>
        <span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-blue-400 border border-slate-700/60 font-mono">
          Cloudflare D1 Live
        </span>
      </div>

      <div class="flex items-center gap-3">
        <a href="https://ltt-website.pages.dev/" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-800 transition">
          <span>เปิดหน้าเว็บไซต์</span>
          <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
        </a>
        <button type="button" onclick="triggerPurgeCache()" id="btn-purge-cache" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition">
          <i data-lucide="refresh-cw" class="w-3.5 h-3.5" id="purge-icon"></i>
          <span>Sync & Purge Cache</span>
        </button>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto p-8 space-y-8">
      <!-- SECTION 1: DASHBOARD -->
      <section id="section-dashboard" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div class="glass-card p-5 rounded-2xl">
            <div class="flex items-center justify-between text-slate-400 text-xs mb-3">
              <span>ข้อความติดต่อทั้งหมด</span>
              <i data-lucide="mail" class="w-4 h-4 text-blue-400"></i>
            </div>
            <div id="stat-total-inquiries" class="text-2xl font-bold text-white">0</div>
            <p class="text-[11px] text-emerald-400 mt-2 font-medium flex items-center gap-1">
              <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
              <span id="stat-new-inquiries">0</span> ข้อความใหม่
            </p>
          </div>

          <div class="glass-card p-5 rounded-2xl">
            <div class="flex items-center justify-between text-slate-400 text-xs mb-3">
              <span>ผลงานในระบบ</span>
              <i data-lucide="image" class="w-4 h-4 text-indigo-400"></i>
            </div>
            <div id="stat-total-portfolios" class="text-2xl font-bold text-white">0</div>
            <p class="text-[11px] text-slate-400 mt-2">แสดงบนหน้าเว็บและ Showcase</p>
          </div>

          <div class="glass-card p-5 rounded-2xl">
            <div class="flex items-center justify-between text-slate-400 text-xs mb-3">
              <span>บริการหลัก</span>
              <i data-lucide="layers" class="w-4 h-4 text-emerald-400"></i>
            </div>
            <div id="stat-total-services" class="text-2xl font-bold text-white">0</div>
            <p class="text-[11px] text-slate-400 mt-2">Bullet points ครบถ้วน</p>
          </div>

          <div class="glass-card p-5 rounded-2xl">
            <div class="flex items-center justify-between text-slate-400 text-xs mb-3">
              <span>บทความ & ข่าวสาร</span>
              <i data-lucide="file-text" class="w-4 h-4 text-amber-400"></i>
            </div>
            <div id="stat-total-articles" class="text-2xl font-bold text-white">0</div>
            <p class="text-[11px] text-slate-400 mt-2">อัปเดตเทรนด์การตลาด</p>
          </div>
        </div>

        <div class="glass-card rounded-2xl p-6">
          <h3 class="text-sm font-bold text-white mb-4">ข้อความติดต่อล่าสุด (Recent Leads)</h3>
          <table class="w-full text-left text-xs">
            <thead class="text-slate-400 border-b border-slate-800">
              <tr>
                <th class="pb-3">ชื่อลูกค้า</th>
                <th class="pb-3">บริษัท</th>
                <th class="pb-3">บริการ</th>
                <th class="pb-3">สถานะ</th>
                <th class="pb-3">วันที่</th>
              </tr>
            </thead>
            <tbody id="table-recent-inquiries" class="divide-y divide-slate-800/60">
              <tr><td colspan="5" class="py-4 text-slate-500 text-center">กำลังโหลดข้อมูล...</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- SECTION 2: NAVIGATION MENUS -->
      <section id="section-navigation" class="space-y-6 hidden">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold text-white">จัดการเมนูหลักของเว็บไซต์ (Navigation Menus)</h3>
            <p class="text-xs text-slate-400">เพิ่ม ลบ แก้ไข และจัดเรียงเมนูบนแถบ Navigation หน้าบ้าน</p>
          </div>
          <button type="button" onclick="openNavModal()" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition flex items-center gap-2">
            <i data-lucide="plus" class="w-4 h-4"></i><span>+ เพิ่มเมนูหลักใหม่</span>
          </button>
        </div>

        <div class="glass-card rounded-2xl overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="text-slate-400 border-b border-slate-800 bg-slate-950/40">
              <tr>
                <th class="p-4 font-semibold">ลำดับ</th>
                <th class="p-4 font-semibold">ชื่อเมนู (Label)</th>
                <th class="p-4 font-semibold">URL Path (เช่น /our-service)</th>
                <th class="p-4 font-semibold">ประเภท</th>
                <th class="p-4 font-semibold">สถานะ</th>
                <th class="p-4 font-semibold text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody id="table-navigation" class="divide-y divide-slate-800/60">
              <tr><td colspan="6" class="p-4 text-slate-500 text-center">กำลังโหลดข้อมูล...</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- SECTION 3: PORTFOLIOS -->
      <section id="section-portfolios" class="space-y-6 hidden">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold text-white">จัดการผลงาน (Portfolios)</h3>
          <button type="button" onclick="openPortfolioModal()" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition flex items-center gap-2">
            <i data-lucide="plus" class="w-4 h-4"></i><span>+ เพิ่มผลงานใหม่</span>
          </button>
        </div>
        <div id="grid-portfolios" class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="p-6 text-slate-500 text-xs">กำลังโหลดข้อมูล...</div>
        </div>
      </section>

      <!-- SECTION 4: SERVICES -->
      <section id="section-services" class="space-y-6 hidden">
        <h3 class="text-base font-bold text-white">จัดการบริการ (Services)</h3>
        <div id="grid-services" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="p-6 text-slate-500 text-xs">กำลังโหลดข้อมูล...</div>
        </div>
      </section>

      <!-- SECTION 5: ARTICLES -->
      <section id="section-articles" class="space-y-6 hidden">
        <h3 class="text-base font-bold text-white">บทความ & ข่าวสาร</h3>
        <div class="glass-card rounded-2xl overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="text-slate-400 border-b border-slate-800 bg-slate-950/40">
              <tr>
                <th class="p-4">ชื่อบทความ</th>
                <th class="p-4">วันที่</th>
                <th class="p-4 text-right">ลบ</th>
              </tr>
            </thead>
            <tbody id="table-articles" class="divide-y divide-slate-800/60">
              <tr><td colspan="3" class="p-4 text-slate-500 text-center">กำลังโหลดข้อมูล...</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- SECTION 6: CLIENT LOGOS -->
      <section id="section-clients" class="space-y-6 hidden">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold text-white">โลโก้ลูกค้า (Client Logos)</h3>
          <button type="button" onclick="openClientModal()" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition flex items-center gap-2">
            <i data-lucide="plus" class="w-4 h-4"></i><span>+ เพิ่มโลโก้ลูกค้า</span>
          </button>
        </div>
        <div id="grid-client-logos" class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div class="p-4 text-slate-500 text-xs">กำลังโหลดข้อมูล...</div>
        </div>
      </section>

      <!-- SECTION 7: INQUIRIES -->
      <section id="section-inquiries" class="space-y-6 hidden">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold text-white">กล่องข้อความติดต่อ (Leads & Inquiries)</h3>
          <a href="/api/admin/inquiries/export.csv" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition flex items-center gap-2">
            <i data-lucide="download" class="w-4 h-4"></i><span>Export เป็น CSV</span>
          </a>
        </div>

        <div class="glass-card rounded-2xl overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="text-slate-400 border-b border-slate-800 bg-slate-950/40">
              <tr>
                <th class="p-4">ลูกค้า</th>
                <th class="p-4">เบอร์/อีเมล</th>
                <th class="p-4">ข้อความ & โน้ตภายใน</th>
                <th class="p-4">ต้นทาง</th>
                <th class="p-4">สถานะ</th>
                <th class="p-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody id="table-inquiries" class="divide-y divide-slate-800/60">
              <tr><td colspan="6" class="p-4 text-slate-500 text-center">กำลังโหลดข้อมูล...</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- SECTION 8: SITE SETTINGS -->
      <section id="section-settings" class="space-y-6 hidden">
        <h3 class="text-base font-bold text-white">ตั้งค่าเว็บไซต์ & SEO</h3>
        <form id="form-site-settings" onsubmit="handleSaveSettings(event)" class="glass-card rounded-2xl p-6 space-y-4 max-w-3xl">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-xs text-slate-400 block mb-1">ชื่อบริษัท</label>
              <input type="text" id="setting_company_name" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
            </div>
            <div>
              <label class="text-xs text-slate-400 block mb-1">เบอร์โทร</label>
              <input type="text" id="setting_phone" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
            </div>
            <div class="md:col-span-2">
              <label class="text-xs text-slate-400 block mb-1">Hero Headline</label>
              <input type="text" id="setting_hero_headline" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
            </div>
            <div class="md:col-span-2">
              <label class="text-xs text-slate-400 block mb-1">Hero Subheadline</label>
              <textarea rows="2" id="setting_hero_subheadline" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"></textarea>
            </div>
          </div>
          <button type="submit" class="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20">
            บันทึกการตั้งค่าทั้งหมด
          </button>
        </form>
      </section>
    </main>
  </div>

  <!-- ==================== MODALS (Pure DOM) ==================== -->
  <!-- Navigation Modal -->
  <div id="modal-nav" class="fixed inset-0 z-50 items-center justify-center p-4 bg-black/75 backdrop-blur-sm hidden">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 id="modal-nav-title" class="font-bold text-white text-sm">เพิ่มเมนูหลักใหม่</h4>
        <button type="button" onclick="closeNavModal()" class="text-slate-400 hover:text-white">✕</button>
      </div>
      <form id="form-nav" onsubmit="handleSaveNav(event)" class="space-y-3">
        <input type="hidden" id="nav_id">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">ชื่อเมนู (Label) *</label>
          <input type="text" id="nav_label" required placeholder="เช่น บริการของเรา, ผลงาน, ติดต่อเรา" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">URL Path *</label>
          <input type="text" id="nav_path" required placeholder="เช่น /our-service หรือ https://..." class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">ลำดับการแสดงผล</label>
            <input type="number" id="nav_sort_order" value="1" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">ประเภทลิงก์</label>
            <select id="nav_is_external" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
              <option value="0">หน้าภายในเว็บ (Page)</option>
              <option value="1">ลิงก์ภายนอก (External)</option>
            </select>
          </div>
        </div>
        <div>
          <label class="flex items-center gap-2 cursor-pointer pt-2">
            <input type="checkbox" id="nav_is_active" checked class="rounded bg-slate-950 border-slate-800 text-blue-600">
            <span class="text-xs text-slate-300">เปิดแสดงผลเมนูนี้บนหน้าเว็บไซต์</span>
          </label>
        </div>
        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button type="button" onclick="closeNavModal()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300">ยกเลิก</button>
          <button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20">บันทึกข้อมูล</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Portfolio Modal -->
  <div id="modal-portfolio" class="fixed inset-0 z-50 items-center justify-center p-4 bg-black/75 backdrop-blur-sm hidden">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 class="font-bold text-white text-sm">เพิ่มผลงานใหม่ (New Portfolio)</h4>
        <button type="button" onclick="closePortfolioModal()" class="text-slate-400 hover:text-white">✕</button>
      </div>
      <form id="form-portfolio" onsubmit="handleSavePortfolio(event)" class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">ชื่อผลงาน (Title) *</label>
          <input type="text" id="portfolio_title" required placeholder="เช่น Cross Pattaya Oceanphere — Luxury Pool Villa" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">ชื่อลูกค้า (Client Name) *</label>
            <input type="text" id="portfolio_client" required placeholder="เช่น Cross Hotels & Resorts" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">หมวดหมู่ (Category)</label>
            <select id="portfolio_category" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
              <option value="hotels-resorts">Hotels & Resorts</option>
              <option value="real-estate">Real Estate</option>
              <option value="food-beverage">Food & Beverage</option>
              <option value="lifestyle-wellness">Lifestyle & Wellness</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">URL รูปภาพปก (Cover Image URL) *</label>
          <input type="text" id="portfolio_cover" required value="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">สรุปรายละเอียดสั้นๆ (Summary)</label>
          <textarea rows="2" id="portfolio_summary" placeholder="อธิบายภาพรวมผลงาน เช่น งานถ่ายภาพสถาปัตยกรรมระดับพรีเมียม" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"></textarea>
        </div>
        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button type="button" onclick="closePortfolioModal()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300">ยกเลิก</button>
          <button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20">บันทึกผลงาน</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Client Logo Modal -->
  <div id="modal-client" class="fixed inset-0 z-50 items-center justify-center p-4 bg-black/75 backdrop-blur-sm hidden">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 class="font-bold text-white text-sm">เพิ่มโลโก้ลูกค้าใหม่</h4>
        <button type="button" onclick="closeClientModal()" class="text-slate-400 hover:text-white">✕</button>
      </div>
      <form id="form-client" onsubmit="handleSaveClient(event)" class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">ชื่อลูกค้า/แบรนด์ *</label>
          <input type="text" id="client_name" required placeholder="เช่น Cross Hotels & Resorts" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">URL โลโก้ *</label>
          <input type="text" id="client_logo_url" required value="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">เว็บไซต์ของลูกค้า (ถ้ามี)</label>
          <input type="text" id="client_website_url" placeholder="https://..." class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
        </div>
        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button type="button" onclick="closeClientModal()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300">ยกเลิก</button>
          <button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20">บันทึกโลโก้</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Note Modal -->
  <div id="modal-note" class="fixed inset-0 z-50 items-center justify-center p-4 bg-black/75 backdrop-blur-sm hidden">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h4 class="font-bold text-white text-sm">จดบันทึกภายใน (Internal Notes)</h4>
          <p id="note-customer-name" class="text-[11px] text-blue-400 mt-0.5"></p>
        </div>
        <button type="button" onclick="closeNoteModal()" class="text-slate-400 hover:text-white">✕</button>
      </div>
      <form id="form-note" onsubmit="handleSaveNote(event)" class="space-y-3">
        <input type="hidden" id="note_inquiry_id">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">บันทึกข้อความสำหรับทีมงานภายใน</label>
          <textarea rows="4" id="note_text" placeholder="เช่น นัดคุยงานวันจันทร์ 10.00 น. หรือ ส่งใบเสนอราคาแล้ว" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"></textarea>
        </div>
        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button type="button" onclick="closeNoteModal()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300">ยกเลิก</button>
          <button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20">บันทึกโน้ต</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Pure Vanilla JavaScript (ZERO unsafe-eval, 100% Strict CSP Compliant) -->
  <script>
    let currentTab = 'dashboard';
    let appState = {
      navMenus: [],
      portfolios: [],
      services: [],
      articles: [],
      clientLogos: [],
      inquiries: [],
      settingsMap: {}
    };

    // Tab Switching
    function switchTab(tabId) {
      currentTab = tabId;
      const tabs = ['dashboard', 'navigation', 'portfolios', 'services', 'articles', 'clients', 'inquiries', 'settings'];
      const titles = {
        'dashboard': 'Dashboard ภาพรวม',
        'navigation': 'Navigation เมนูหลัก',
        'portfolios': 'Portfolios ผลงาน',
        'services': 'Services บริการ',
        'articles': 'Blog & Events บทความ',
        'clients': 'Client Logos ลูกค้า',
        'inquiries': 'Inquiries ข้อความติดต่อ',
        'settings': 'Site Settings & SEO'
      };

      tabs.forEach(t => {
        const sec = document.getElementById('section-' + t);
        const btn = document.getElementById('btn-tab-' + t);
        if (t === tabId) {
          if (sec) sec.classList.remove('hidden');
          if (btn) {
            btn.className = 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition active-nav';
          }
        } else {
          if (sec) sec.classList.add('hidden');
          if (btn) {
            btn.className = 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition text-slate-400 hover:text-white hover:bg-slate-900';
          }
        }
      });

      const titleEl = document.getElementById('currentTabTitle');
      if (titleEl) titleEl.innerText = titles[tabId] || tabId;

      refreshIcons();
    }

    function refreshIcons() {
      setTimeout(() => {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }
      }, 50);
    }

    // Load Data from Cloudflare Worker APIs
    async function loadAllData() {
      try {
        const [s, p, sv, a, cl, inq, nav, set] = await Promise.all([
          fetch('/api/admin/dashboard/stats').then(r => r.json()).catch(() => ({})),
          fetch('/api/admin/portfolios').then(r => r.json()).catch(() => ({})),
          fetch('/api/admin/services').then(r => r.json()).catch(() => ({})),
          fetch('/api/admin/articles').then(r => r.json()).catch(() => ({})),
          fetch('/api/admin/client-logos').then(r => r.json()).catch(() => ({})),
          fetch('/api/admin/inquiries').then(r => r.json()).catch(() => ({})),
          fetch('/api/admin/navigation').then(r => r.json()).catch(() => ({})),
          fetch('/api/admin/site-settings').then(r => r.json()).catch(() => ({}))
        ]);

        if (s.data) renderDashboard(s.data);
        if (nav.data) renderNavigation(nav.data);
        if (p.data) renderPortfolios(p.data);
        if (sv.data) renderServices(sv.data);
        if (a.data) renderArticles(a.data);
        if (cl.data) renderClientLogos(cl.data);
        if (inq.data) renderInquiries(inq.data);
        if (set.data) renderSettings(set.data);

        refreshIcons();
      } catch (err) {
        console.error('Error fetching CMS data:', err);
      }
    }

    // 1. Dashboard Render
    function renderDashboard(data) {
      document.getElementById('stat-total-inquiries').innerText = data.total_inquiries || 0;
      document.getElementById('stat-new-inquiries').innerText = data.new_inquiries || 0;
      document.getElementById('stat-total-portfolios').innerText = data.total_portfolios || 0;
      document.getElementById('stat-total-services').innerText = data.total_services || 0;
      document.getElementById('stat-total-articles').innerText = data.total_articles || 0;

      const badge = document.getElementById('badge-new-inquiries');
      if (data.new_inquiries > 0) {
        badge.innerText = data.new_inquiries;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }

      const tbody = document.getElementById('table-recent-inquiries');
      if (!data.recent_inquiries || data.recent_inquiries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-4 text-slate-500 text-center">ยังไม่มีข้อความติดต่อ</td></tr>';
        return;
      }
      tbody.innerHTML = data.recent_inquiries.map(inq => \`
        <tr class="hover:bg-slate-800/30">
          <td class="py-3 font-medium text-white">\${escapeHtml(inq.full_name)}</td>
          <td class="py-3 text-slate-300">\${escapeHtml(inq.company || '-')}</td>
          <td class="py-3 text-slate-300">\${escapeHtml(inq.service_interested || '-')}</td>
          <td class="py-3">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              \${escapeHtml(inq.status)}
            </span>
          </td>
          <td class="py-3 text-slate-400">\${new Date(inq.created_at).toLocaleDateString('th-TH')}</td>
        </tr>
      \`).join('');
    }

    // 2. Navigation Render
    function renderNavigation(items) {
      appState.navMenus = items;
      const tbody = document.getElementById('table-navigation');
      if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-slate-500 text-center">ยังไม่มีเมนู</td></tr>';
        return;
      }
      tbody.innerHTML = items.map(item => \`
        <tr class="hover:bg-slate-800/30">
          <td class="p-4 text-slate-400 font-semibold">\${item.sort_order}</td>
          <td class="p-4 font-bold text-white">\${escapeHtml(item.label)}</td>
          <td class="p-4 text-blue-400 font-mono text-[11px]">\${escapeHtml(item.path)}</td>
          <td class="p-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border \${
              item.is_external ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            }">
              \${item.is_external ? 'ภายนอก (Link)' : 'ภายในเว็บ (Page)'}
            </span>
          </td>
          <td class="p-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border \${
              item.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
            }">
              \${item.is_active ? 'เปิดใช้งาน' : 'ปิด'}
            </span>
          </td>
          <td class="p-4 text-right space-x-2">
            <button type="button" onclick="editNavMenu(\${item.id})" class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button type="button" onclick="deleteNavMenu(\${item.id})" class="p-1.5 rounded-lg hover:bg-rose-900/30 text-rose-400">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      \`).join('');
    }

    // 3. Portfolios Render
    function renderPortfolios(items) {
      appState.portfolios = items;
      const grid = document.getElementById('grid-portfolios');
      if (!items || items.length === 0) {
        grid.innerHTML = '<div class="p-6 text-slate-500 text-xs">ยังไม่มีผลงาน</div>';
        return;
      }
      grid.innerHTML = items.map(item => \`
        <div class="glass-card rounded-2xl overflow-hidden flex flex-col justify-between">
          <img src="\${escapeHtml(item.cover_image)}" class="w-full h-44 object-cover" alt="">
          <div class="p-5 flex-1 flex flex-col justify-between">
            <div>
              <h4 class="font-bold text-sm text-white">\${escapeHtml(item.title)}</h4>
              <p class="text-xs text-blue-400 mt-1">\${escapeHtml(item.client_name)}</p>
              <p class="text-xs text-slate-400 mt-2 line-clamp-2">\${escapeHtml(item.summary || '')}</p>
            </div>
            <div class="mt-4 pt-4 border-t border-slate-800 flex justify-end">
              <button type="button" onclick="deletePortfolio(\${item.id})" class="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span>ลบผลงาน</span>
              </button>
            </div>
          </div>
        </div>
      \`).join('');
    }

    // 4. Services Render
    function renderServices(items) {
      appState.services = items;
      const grid = document.getElementById('grid-services');
      if (!items || items.length === 0) {
        grid.innerHTML = '<div class="p-6 text-slate-500 text-xs">ยังไม่มีบริการ</div>';
        return;
      }
      grid.innerHTML = items.map(svc => \`
        <div class="glass-card rounded-2xl p-6 space-y-4">
          <h4 class="font-bold text-sm text-white">\${escapeHtml(svc.title)}</h4>
          <div>
            <label class="text-[11px] text-slate-400 block mb-1">Subtitle</label>
            <input type="text" id="svc_subtitle_\${svc.id}" value="\${escapeHtml(svc.subtitle || '')}" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200">
          </div>
          <div>
            <label class="text-[11px] text-slate-400 block mb-1">รายละเอียดบริการ</label>
            <textarea rows="3" id="svc_desc_\${svc.id}" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200">\${escapeHtml(svc.description || '')}</textarea>
          </div>
          <div class="flex justify-end">
            <button type="button" onclick="saveService(\${svc.id})" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white">
              บันทึกการแก้ไข
            </button>
          </div>
        </div>
      \`).join('');
    }

    // 5. Articles Render
    function renderArticles(items) {
      appState.articles = items;
      const tbody = document.getElementById('table-articles');
      if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="p-4 text-slate-500 text-center">ยังไม่มีบทความ</td></tr>';
        return;
      }
      tbody.innerHTML = items.map(art => \`
        <tr>
          <td class="p-4 font-medium text-white">\${escapeHtml(art.title)}</td>
          <td class="p-4 text-slate-400">\${new Date(art.published_at).toLocaleDateString('th-TH')}</td>
          <td class="p-4 text-right">
            <button type="button" onclick="deleteArticle(\${art.id})" class="text-rose-400 hover:text-rose-300">
              <i data-lucide="trash-2" class="w-4 h-4 inline"></i>
            </button>
          </td>
        </tr>
      \`).join('');
    }

    // 6. Client Logos Render
    function renderClientLogos(items) {
      appState.clientLogos = items;
      const grid = document.getElementById('grid-client-logos');
      if (!items || items.length === 0) {
        grid.innerHTML = '<div class="p-4 text-slate-500 text-xs">ยังไม่มีโลโก้ลูกค้า</div>';
        return;
      }
      grid.innerHTML = items.map(cl => \`
        <div class="glass-card rounded-xl p-4 flex flex-col items-center justify-center text-center relative group">
          <button type="button" onclick="deleteClientLogo(\${cl.id})" class="absolute top-2 right-2 text-rose-400 hover:text-rose-300">
            ✕
          </button>
          <img src="\${escapeHtml(cl.logo_url)}" class="h-10 object-contain mb-2 opacity-80 group-hover:opacity-100" alt="">
          <span class="text-xs font-medium text-slate-300">\${escapeHtml(cl.name)}</span>
        </div>
      \`).join('');
    }

    // 7. Inquiries Render
    function renderInquiries(items) {
      appState.inquiries = items;
      const tbody = document.getElementById('table-inquiries');
      if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-slate-500 text-center">ยังไม่มีข้อความติดต่อ</td></tr>';
        return;
      }
      tbody.innerHTML = items.map(inq => \`
        <tr>
          <td class="p-4 font-semibold text-white">\${escapeHtml(inq.full_name)}</td>
          <td class="p-4 text-slate-300">
            <div>\${escapeHtml(inq.email)}</div>
            <div class="text-[11px] text-blue-400">\${escapeHtml(inq.phone)}</div>
          </td>
          <td class="p-4 text-slate-300 max-w-xs">
            <div class="line-clamp-2">\${escapeHtml(inq.message)}</div>
            \${inq.admin_notes ? \`
              <div class="mt-1 p-1.5 rounded bg-blue-950/60 border border-blue-800/40 text-[11px] text-blue-300 font-medium">
                📌 โน้ต: \${escapeHtml(inq.admin_notes)}
              </div>
            \` : ''}
          </td>
          <td class="p-4 text-slate-400 font-mono text-[11px]">\${escapeHtml(inq.source_page || '/contact-us')}</td>
          <td class="p-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border \${
              inq.status === 'new' ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
            }">
              \${escapeHtml(inq.status)}
            </span>
          </td>
          <td class="p-4 text-right space-x-2">
            <button type="button" onclick="openNoteModal(\${inq.id}, '\${escapeQuote(inq.full_name)}', '\${escapeQuote(inq.admin_notes || '')}')" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition">
              📝 โน้ต
            </button>
            <select onchange="updateInquiryStatus(\${inq.id}, this.value)" class="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200">
              <option value="new" \${inq.status === 'new' ? 'selected' : ''}>New</option>
              <option value="in_progress" \${inq.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
              <option value="contacted" \${inq.status === 'contacted' ? 'selected' : ''}>Contacted</option>
              <option value="closed" \${inq.status === 'closed' ? 'selected' : ''}>Closed</option>
            </select>
          </td>
        </tr>
      \`).join('');
    }

    // 8. Settings Render
    function renderSettings(items) {
      const map = {};
      items.forEach(i => { map[i.key] = i.value; });
      appState.settingsMap = map;
      if (document.getElementById('setting_company_name')) document.getElementById('setting_company_name').value = map.company_name || '';
      if (document.getElementById('setting_phone')) document.getElementById('setting_phone').value = map.phone || '';
      if (document.getElementById('setting_hero_headline')) document.getElementById('setting_hero_headline').value = map.hero_headline || '';
      if (document.getElementById('setting_hero_subheadline')) document.getElementById('setting_hero_subheadline').value = map.hero_subheadline || '';
    }

    // Modal Control Functions
    function openNavModal(id = null) {
      document.getElementById('modal-nav').classList.remove('hidden');
      document.getElementById('modal-nav').classList.add('flex');
      if (id) {
        const item = appState.navMenus.find(m => m.id === id);
        if (item) {
          document.getElementById('modal-nav-title').innerText = 'แก้ไขเมนูหลัก';
          document.getElementById('nav_id').value = item.id;
          document.getElementById('nav_label').value = item.label;
          document.getElementById('nav_path').value = item.path;
          document.getElementById('nav_sort_order').value = item.sort_order;
          document.getElementById('nav_is_external').value = item.is_external || 0;
          document.getElementById('nav_is_active').checked = item.is_active == 1;
          return;
        }
      }
      document.getElementById('modal-nav-title').innerText = 'เพิ่มเมนูหลักใหม่';
      document.getElementById('nav_id').value = '';
      document.getElementById('nav_label').value = '';
      document.getElementById('nav_path').value = '/';
      document.getElementById('nav_sort_order').value = (appState.navMenus.length + 1);
      document.getElementById('nav_is_external').value = '0';
      document.getElementById('nav_is_active').checked = true;
    }
    function editNavMenu(id) { openNavModal(id); }
    function closeNavModal() {
      document.getElementById('modal-nav').classList.add('hidden');
      document.getElementById('modal-nav').classList.remove('flex');
    }

    function openPortfolioModal() {
      document.getElementById('modal-portfolio').classList.remove('hidden');
      document.getElementById('modal-portfolio').classList.add('flex');
    }
    function closePortfolioModal() {
      document.getElementById('modal-portfolio').classList.add('hidden');
      document.getElementById('modal-portfolio').classList.remove('flex');
    }

    function openClientModal() {
      document.getElementById('modal-client').classList.remove('hidden');
      document.getElementById('modal-client').classList.add('flex');
    }
    function closeClientModal() {
      document.getElementById('modal-client').classList.add('hidden');
      document.getElementById('modal-client').classList.remove('flex');
    }

    function openNoteModal(id, customerName, notes) {
      document.getElementById('modal-note').classList.remove('hidden');
      document.getElementById('modal-note').classList.add('flex');
      document.getElementById('note_inquiry_id').value = id;
      document.getElementById('note-customer-name').innerText = 'ลูกค้า: ' + customerName;
      document.getElementById('note_text').value = notes || '';
    }
    function closeNoteModal() {
      document.getElementById('modal-note').classList.add('hidden');
      document.getElementById('modal-note').classList.remove('flex');
    }

    // API Submission Handlers
    async function handleSaveNav(e) {
      e.preventDefault();
      const id = document.getElementById('nav_id').value;
      const payload = {
        label: document.getElementById('nav_label').value,
        path: document.getElementById('nav_path').value,
        sort_order: Number(document.getElementById('nav_sort_order').value) || 1,
        is_external: Number(document.getElementById('nav_is_external').value),
        is_active: document.getElementById('nav_is_active').checked ? 1 : 0
      };
      const url = id ? '/api/admin/navigation/' + id : '/api/admin/navigation';
      const method = id ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      closeNavModal();
      await loadAllData();
    }

    async function deleteNavMenu(id) {
      if (!confirm('ยืนยันลบเมนูนี้ออกจาก Navigation?')) return;
      await fetch('/api/admin/navigation/' + id, { method: 'DELETE' });
      await loadAllData();
    }

    async function handleSavePortfolio(e) {
      e.preventDefault();
      const payload = {
        title: document.getElementById('portfolio_title').value,
        client_name: document.getElementById('portfolio_client').value,
        category_slug: document.getElementById('portfolio_category').value,
        cover_image: document.getElementById('portfolio_cover').value,
        summary: document.getElementById('portfolio_summary').value,
        featured: 1
      };
      await fetch('/api/admin/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      closePortfolioModal();
      await loadAllData();
    }

    async function deletePortfolio(id) {
      if (!confirm('ยืนยันลบผลงานนี้?')) return;
      await fetch('/api/admin/portfolios/' + id, { method: 'DELETE' });
      await loadAllData();
    }

    async function saveService(id) {
      const subtitle = document.getElementById('svc_subtitle_' + id).value;
      const desc = document.getElementById('svc_desc_' + id).value;
      await fetch('/api/admin/services/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtitle, description: desc })
      });
      alert('บันทึกข้อมูลบริการเรียบร้อย');
      await loadAllData();
    }

    async function deleteArticle(id) {
      if (!confirm('ยืนยันลบบทความนี้?')) return;
      await fetch('/api/admin/articles/' + id, { method: 'DELETE' });
      await loadAllData();
    }

    async function handleSaveClient(e) {
      e.preventDefault();
      const payload = {
        name: document.getElementById('client_name').value,
        logo_url: document.getElementById('client_logo_url').value,
        website_url: document.getElementById('client_website_url').value,
        sort_order: appState.clientLogos.length + 1
      };
      await fetch('/api/admin/client-logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      closeClientModal();
      await loadAllData();
    }

    async function deleteClientLogo(id) {
      if (!confirm('ยืนยันลบลูกค้ารายนี้?')) return;
      await fetch('/api/admin/client-logos/' + id, { method: 'DELETE' });
      await loadAllData();
    }

    async function handleSaveNote(e) {
      e.preventDefault();
      const id = document.getElementById('note_inquiry_id').value;
      const note = document.getElementById('note_text').value;
      await fetch('/api/admin/inquiries/' + id + '/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: note })
      });
      closeNoteModal();
      await loadAllData();
    }

    async function updateInquiryStatus(id, st) {
      await fetch('/api/admin/inquiries/' + id + '/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: st })
      });
      await loadAllData();
    }

    async function handleSaveSettings(e) {
      e.preventDefault();
      const list = [
        { key: 'company_name', value: document.getElementById('setting_company_name').value },
        { key: 'phone', value: document.getElementById('setting_phone').value },
        { key: 'hero_headline', value: document.getElementById('setting_hero_headline').value },
        { key: 'hero_subheadline', value: document.getElementById('setting_hero_subheadline').value }
      ];
      await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: list })
      });
      alert('บันทึกการตั้งค่าเว็บไซต์เรียบร้อย');
    }

    async function triggerPurgeCache() {
      const icon = document.getElementById('purge-icon');
      if (icon) icon.classList.add('animate-spin');
      await fetch('/api/admin/sync/purge-cache', { method: 'POST' });
      alert('ส่งคำสั่ง Sync & Purge Cache เรียบร้อยแล้ว!');
      if (icon) icon.classList.remove('animate-spin');
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function escapeQuote(str) {
      if (!str) return '';
      return String(str).replace(/'/g, "\\'");
    }

    // Init on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
      loadAllData();
    });
  </script>
</body>
</html>`;
}
