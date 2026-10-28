/**
 * LTT Ma getThink — Cloudflare Worker Backend & CMS Backoffice
 * Pure Vanilla JavaScript (0% unsafe-eval) | Strict CSP | Zero Trust Ready
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

  // CORS - Whitelist website domains and allow preflights cleanly
  const isAllowed = origin && (
    origin.includes('ltt-website.pages.dev') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1')
  );

  if (isAllowed) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
    headers.set('Access-Control-Allow-Origin', '*');
  }
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cf-Access-Jwt-Assertion');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonResponse(data, status = 200, origin = '*', isPublicCacheable = false) {
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
    .trim();
}

// Auto Schema Migration Helper for D1
let schemaEnsured = false;
async function ensureDbSchema(env) {
  if (schemaEnsured || !env.DB) return;
  const queries = [
    `CREATE TABLE IF NOT EXISTS custom_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      cover_image TEXT,
      template_style TEXT DEFAULT 'standard',
      title_en TEXT,
      content_en TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    "ALTER TABLE articles ADD COLUMN tags_meta TEXT",
    "ALTER TABLE articles ADD COLUMN template_style TEXT DEFAULT 'standard'",
    "ALTER TABLE articles ADD COLUMN custom_instruction TEXT",
    "ALTER TABLE articles ADD COLUMN video_url TEXT",
    "ALTER TABLE articles ADD COLUMN map_coords TEXT",
    "ALTER TABLE articles ADD COLUMN travel_date TEXT",
    "ALTER TABLE articles ADD COLUMN title_en TEXT",
    "ALTER TABLE articles ADD COLUMN summary_en TEXT",
    "ALTER TABLE articles ADD COLUMN content_en TEXT",
    "ALTER TABLE articles ADD COLUMN tags_en TEXT",
    "ALTER TABLE portfolios ADD COLUMN tags_meta TEXT",
    "ALTER TABLE portfolios ADD COLUMN template_style TEXT DEFAULT 'case-study'",
    "ALTER TABLE portfolios ADD COLUMN custom_instruction TEXT",
    "ALTER TABLE portfolios ADD COLUMN video_url TEXT",
    "ALTER TABLE portfolios ADD COLUMN map_coords TEXT",
    "ALTER TABLE portfolios ADD COLUMN travel_date TEXT",
    "ALTER TABLE portfolios ADD COLUMN title_en TEXT",
    "ALTER TABLE portfolios ADD COLUMN summary_en TEXT",
    "ALTER TABLE portfolios ADD COLUMN details_en TEXT",
    "ALTER TABLE portfolios ADD COLUMN tags_en TEXT",
    "ALTER TABLE services ADD COLUMN image_url TEXT",
    "ALTER TABLE services ADD COLUMN title_en TEXT",
    "ALTER TABLE services ADD COLUMN subtitle_en TEXT",
    "ALTER TABLE services ADD COLUMN description_en TEXT",
    "ALTER TABLE services ADD COLUMN bullet_points_en TEXT",
    "ALTER TABLE inquiries ADD COLUMN source_page TEXT DEFAULT 'contact-us'",
    "ALTER TABLE inquiries ADD COLUMN admin_notes TEXT",
    "ALTER TABLE inquiries ADD COLUMN ip_address TEXT",
    "ALTER TABLE custom_pages ADD COLUMN content_json TEXT",
    "ALTER TABLE custom_pages ADD COLUMN meta_description TEXT"
  ];

  for (const q of queries) {
    try {
      await env.DB.prepare(q).run();
    } catch (e) {
      // Column or table already exists
    }
  }
  schemaEnsured = true;
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

    const userEmail = request.headers.get('CF-Access-Authenticated-User-Email') || 'admin@lttmagetthink.co';

    try {
      // Auto-migrate schema lazily
      if (path.startsWith('/api/')) {
        await ensureDbSchema(env);
      }

      // -------------------------------------------------------------
      // 1. Root & Admin UI (Backoffice)
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
      // 2. Public APIs (For Frontend Website)
      // -------------------------------------------------------------
      if (path === '/api/public/navigation' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM navigation_menus WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').all();
        return jsonResponse({ success: true, data: results || [] }, 200, origin, true);
      }

      if (path === '/api/public/site-settings' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT key, value FROM site_settings').all();
        const settings = {};
        (results || []).forEach(r => { settings[r.key] = r.value; });
        return jsonResponse({ success: true, data: settings }, 200, origin, true);
      }

      if (path === '/api/public/services' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order ASC').all();
        const formatted = (results || []).map(s => {
          let bullets = [];
          try { bullets = JSON.parse(s.bullet_points || '[]'); } catch (e) {
            bullets = s.bullet_points ? s.bullet_points.split('\n').filter(Boolean) : [];
          }
          return { ...s, bullet_points: bullets };
        });
        return jsonResponse({ success: true, data: formatted }, 200, origin, true);
      }

      if (path === '/api/public/portfolios' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM portfolios WHERE is_active = 1 ORDER BY sort_order ASC, id DESC').all();
        const formatted = (results || []).map(p => {
          let tagsMeta = {};
          try { tagsMeta = JSON.parse(p.tags_meta || '{}'); } catch (e) {}
          let gallery = [];
          try { gallery = JSON.parse(p.gallery_images || '[]'); } catch (e) {}
          return { ...p, tags_meta: tagsMeta, gallery_images: gallery };
        });
        return jsonResponse({ success: true, data: formatted }, 200, origin);
      }

      if (path.startsWith('/api/public/portfolios/') && method === 'GET') {
        const slug = path.replace('/api/public/portfolios/', '');
        const item = await env.DB.prepare('SELECT * FROM portfolios WHERE (slug = ? OR id = ?) AND is_active = 1').bind(slug, slug).first();
        if (!item) return jsonResponse({ success: false, error: 'Portfolio not found' }, 404, origin);
        let tagsMeta = {};
        try { tagsMeta = JSON.parse(item.tags_meta || '{}'); } catch (e) {}
        let gallery = [];
        try { gallery = JSON.parse(item.gallery_images || '[]'); } catch (e) {}
        return jsonResponse({ success: true, data: { ...item, tags_meta: tagsMeta, gallery_images: gallery } }, 200, origin);
      }

      if (path === '/api/public/articles' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM articles WHERE status = "published" ORDER BY published_at DESC').all();
        const formatted = (results || []).map(a => {
          let tagsMeta = {};
          try { tagsMeta = JSON.parse(a.tags_meta || '{}'); } catch (e) {}
          return { ...a, tags_meta: tagsMeta };
        });
        return jsonResponse({ success: true, data: formatted }, 200, origin);
      }

      if (path.startsWith('/api/public/articles/') && method === 'GET') {
        const slug = path.replace('/api/public/articles/', '');
        const item = await env.DB.prepare('SELECT * FROM articles WHERE (slug = ? OR id = ?) AND status = "published"').bind(slug, slug).first();
        if (!item) return jsonResponse({ success: false, error: 'Article not found' }, 404, origin);
        let tagsMeta = {};
        try { tagsMeta = JSON.parse(item.tags_meta || '{}'); } catch (e) {}
        return jsonResponse({ success: true, data: { ...item, tags_meta: tagsMeta } }, 200, origin);
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
        const company = sanitizeInput(body.company || '');
        const service_interested = sanitizeInput(body.service_interested || 'General');
        const budget_range = sanitizeInput(body.budget_range || '-');
        const message = sanitizeInput(body.message);
        const source_page = sanitizeInput(body.source_page || 'contact-us');
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

        if (!full_name || !email || !phone || !message) {
          return jsonResponse({ success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, อีเมล, เบอร์โทร, ข้อความ)' }, 400, origin);
        }

        await env.DB.prepare(
          `INSERT INTO inquiries (full_name, email, phone, company, service_interested, budget_range, message, source_page, ip_address)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(full_name, email, phone, company, service_interested, budget_range, message, source_page, ip).run();

        return jsonResponse({ success: true, message: 'ส่งข้อความเรียบร้อยแล้ว ทีมงานจะติดต่อกลับโดยเร็วที่สุดครับ' }, 200, origin);
      }

      // Custom Pages Public API
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

      // -------------------------------------------------------------
      // 3. Admin APIs (Backoffice)
      // -------------------------------------------------------------
      // AI Translation (Bilingual Helper)
      if (path === '/api/admin/translate' && method === 'POST') {
        const body = await request.json();
        const fields = body.fields || {};

        async function translate(str) {
          if (!str || typeof str !== 'string' || !str.trim()) return '';
          // 1. Try Cloudflare Workers AI M2M-100 Translation model
          if (env.AI) {
            try {
              const aiRes = await env.AI.run('@cf/meta/m2m100-1.2b', {
                text: str,
                source_lang: 'th',
                target_lang: 'en'
              });
              if (aiRes && aiRes.translated_text) return aiRes.translated_text.trim();
            } catch (e1) {
              console.error('M2M-100 error, trying llama:', e1);
              try {
                const llamaRes = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
                  messages: [
                    { role: 'system', content: 'Translate the following Thai text to English. Output only the English translation.' },
                    { role: 'user', content: str }
                  ]
                });
                if (llamaRes && llamaRes.response) return llamaRes.response.trim();
              } catch (e2) {
                console.error('Llama error:', e2);
              }
            }
          }

          // 2. Fallback to MyMemory translation API
          try {
            const mmUrl = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(str.substring(0, 500)) + '&langpair=th|en';
            const res = await fetch(mmUrl);
            if (res.ok) {
              const resJson = await res.json();
              if (resJson && resJson.responseData && resJson.responseData.translatedText) {
                return resJson.responseData.translatedText;
              }
            }
          } catch (e) {
            console.error('MyMemory error:', e);
          }
          return str;
        }

        const out = {};
        if (fields.title) out.title_en = await translate(fields.title);
        if (fields.summary) out.summary_en = await translate(fields.summary);
        if (fields.content) out.content_en = await translate(fields.content);
        if (fields.tags_meta) {
          const tmEn = {};
          for (const [k, v] of Object.entries(fields.tags_meta)) {
            tmEn[k] = await translate(v);
          }
          out.tags_meta_en = tmEn;
        }

        return jsonResponse({ success: true, data: out }, 200, origin);
      }

      // Navigation
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
          return jsonResponse({ success: false, error: 'กรุณากรอกชื่อเมนูและ URL' }, 400, origin);
        }

        await env.DB.prepare(
          'INSERT INTO navigation_menus (label, path, is_external, sort_order, is_active) VALUES (?, ?, ?, ?, ?)'
        ).bind(label, p, is_external, sort_order, is_active).run();

        return jsonResponse({ success: true, message: 'เพิ่มเมนูเรียบร้อยแล้ว' }, 200, origin);
      }

      if (path.startsWith('/api/admin/navigation/') && method === 'PUT') {
        const id = path.replace('/api/admin/navigation/', '');
        const b = await request.json();
        await env.DB.prepare(
          'UPDATE navigation_menus SET label = ?, path = ?, is_external = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(sanitizeInput(b.label), sanitizeInput(b.path), b.is_external ? 1 : 0, Number(b.sort_order) || 0, b.is_active ? 1 : 0, id).run();

        return jsonResponse({ success: true, message: 'อัปเดตเมนูเรียบร้อย' }, 200, origin);
      }

      if (path.startsWith('/api/admin/navigation/') && method === 'DELETE') {
        const id = path.replace('/api/admin/navigation/', '');
        await env.DB.prepare('DELETE FROM navigation_menus WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: 'ลบเมนูเรียบร้อยแล้ว' }, 200, origin);
      }

      // Dashboard Stats
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

      // Portfolios Admin
      if (path === '/api/admin/portfolios' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM portfolios ORDER BY sort_order ASC, id DESC').all();
        return jsonResponse({ success: true, data: results || [] }, 200, origin);
      }

      if (path === '/api/admin/portfolios' && method === 'POST') {
        const b = await request.json();
        const title = sanitizeInput(b.title);
        const slug = sanitizeInput(b.slug) || (title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4));
        const client_name = sanitizeInput(b.client_name || '');
        const category_slug = sanitizeInput(b.category_slug || 'all');
        const cover_image = sanitizeInput(b.cover_image || '');
        const summary = sanitizeInput(b.summary || '');
        const details = b.details || b.content || '';
        const tags_meta = JSON.stringify(b.tags_meta || {});
        const template_style = sanitizeInput(b.template_style || 'case-study');
        const custom_instruction = sanitizeInput(b.custom_instruction || '');
        const video_url = sanitizeInput(b.video_url || '');
        const map_coords = sanitizeInput(b.map_coords || '');
        const travel_date = sanitizeInput(b.travel_date || '');
        const title_en = sanitizeInput(b.title_en || '');
        const summary_en = sanitizeInput(b.summary_en || '');
        const details_en = b.details_en || '';
        const featured = b.featured ? 1 : 0;
        const sort_order = Number(b.sort_order) || 0;

        await env.DB.prepare(
          `INSERT INTO portfolios (
            title, slug, client_name, category_slug, cover_image, summary, details,
            tags_meta, template_style, custom_instruction, video_url, map_coords, travel_date,
            title_en, summary_en, details_en, featured, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          title, slug, client_name, category_slug, cover_image, summary, details,
          tags_meta, template_style, custom_instruction, video_url, map_coords, travel_date,
          title_en, summary_en, details_en, featured, sort_order
        ).run();

        return jsonResponse({ success: true, message: 'บันทึกผลงานเรียบร้อยแล้ว' }, 200, origin);
      }

      if (path.startsWith('/api/admin/portfolios/') && method === 'PUT') {
        const id = path.replace('/api/admin/portfolios/', '');
        const b = await request.json();
        await env.DB.prepare(
          `UPDATE portfolios SET
            title = ?, slug = ?, client_name = ?, category_slug = ?, cover_image = ?, summary = ?, details = ?,
            tags_meta = ?, template_style = ?, custom_instruction = ?, video_url = ?, map_coords = ?, travel_date = ?,
            title_en = ?, summary_en = ?, details_en = ?, featured = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`
        ).bind(
          sanitizeInput(b.title), sanitizeInput(b.slug), sanitizeInput(b.client_name), sanitizeInput(b.category_slug),
          sanitizeInput(b.cover_image), sanitizeInput(b.summary), b.details || b.content || '',
          JSON.stringify(b.tags_meta || {}), sanitizeInput(b.template_style || 'case-study'), sanitizeInput(b.custom_instruction || ''),
          sanitizeInput(b.video_url || ''), sanitizeInput(b.map_coords || ''), sanitizeInput(b.travel_date || ''),
          sanitizeInput(b.title_en || ''), sanitizeInput(b.summary_en || ''), b.details_en || '',
          b.featured ? 1 : 0, Number(b.sort_order) || 0, id
        ).run();

        return jsonResponse({ success: true, message: 'อัปเดตผลงานเรียบร้อย' }, 200, origin);
      }

      if (path.startsWith('/api/admin/portfolios/') && method === 'DELETE') {
        const id = path.replace('/api/admin/portfolios/', '');
        await env.DB.prepare('DELETE FROM portfolios WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: 'ลบผลงานเรียบร้อย' }, 200, origin);
      }

      // Services Admin
      if (path === '/api/admin/services' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM services ORDER BY sort_order ASC').all();
        const formatted = (results || []).map(s => {
          let bullets = [];
          try { bullets = JSON.parse(s.bullet_points || '[]'); } catch (e) {
            bullets = s.bullet_points ? s.bullet_points.split('\n').filter(Boolean) : [];
          }
          return { ...s, bullet_points: bullets };
        });
        return jsonResponse({ success: true, data: formatted }, 200, origin);
      }

      if (path.startsWith('/api/admin/services/') && method === 'PUT') {
        const id = path.replace('/api/admin/services/', '');
        const b = await request.json();
        const bulletJson = Array.isArray(b.bullet_points) ? JSON.stringify(b.bullet_points) : JSON.stringify([b.bullet_points].filter(Boolean));

        await env.DB.prepare(
          `UPDATE services SET
            title = ?, subtitle = ?, description = ?, image_url = ?, bullet_points = ?,
            title_en = ?, subtitle_en = ?, description_en = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`
        ).bind(
          sanitizeInput(b.title), sanitizeInput(b.subtitle), sanitizeInput(b.description),
          sanitizeInput(b.image_url || ''), bulletJson,
          sanitizeInput(b.title_en || ''), sanitizeInput(b.subtitle_en || ''), sanitizeInput(b.description_en || ''),
          id
        ).run();
        return jsonResponse({ success: true, message: 'อัปเดตบริการเรียบร้อย' }, 200, origin);
      }

      // Articles Admin
      if (path === '/api/admin/articles' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM articles ORDER BY published_at DESC').all();
        const formatted = (results || []).map(a => {
          let tagsMeta = {};
          try { tagsMeta = JSON.parse(a.tags_meta || '{}'); } catch (e) {}
          return { ...a, tags_meta: tagsMeta };
        });
        return jsonResponse({ success: true, data: formatted }, 200, origin);
      }

      if (path === '/api/admin/articles' && method === 'POST') {
        const b = await request.json();
        const title = sanitizeInput(b.title);
        const slug = sanitizeInput(b.slug) || (title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4));
        const summary = sanitizeInput(b.summary || '');
        const content = b.content || '';
        const cover_image = sanitizeInput(b.cover_image || '');
        const author = sanitizeInput(b.author || 'LTT Team');
        const status = sanitizeInput(b.status || 'published');
        const tags_meta = JSON.stringify(b.tags_meta || {});
        const template_style = sanitizeInput(b.template_style || 'standard');
        const custom_instruction = sanitizeInput(b.custom_instruction || '');
        const video_url = sanitizeInput(b.video_url || '');
        const map_coords = sanitizeInput(b.map_coords || '');
        const travel_date = sanitizeInput(b.travel_date || '');
        const title_en = sanitizeInput(b.title_en || '');
        const summary_en = sanitizeInput(b.summary_en || '');
        const content_en = b.content_en || '';

        await env.DB.prepare(
          `INSERT INTO articles (
            title, slug, summary, content, cover_image, author, status,
            tags_meta, template_style, custom_instruction, video_url, map_coords, travel_date,
            title_en, summary_en, content_en
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          title, slug, summary, content, cover_image, author, status,
          tags_meta, template_style, custom_instruction, video_url, map_coords, travel_date,
          title_en, summary_en, content_en
        ).run();

        return jsonResponse({ success: true, message: 'บันทึกบทความเรียบร้อย' }, 200, origin);
      }

      if (path.startsWith('/api/admin/articles/') && method === 'PUT') {
        const id = path.replace('/api/admin/articles/', '');
        const b = await request.json();
        await env.DB.prepare(
          `UPDATE articles SET
            title = ?, slug = ?, summary = ?, content = ?, cover_image = ?, status = ?,
            tags_meta = ?, template_style = ?, custom_instruction = ?, video_url = ?, map_coords = ?, travel_date = ?,
            title_en = ?, summary_en = ?, content_en = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`
        ).bind(
          sanitizeInput(b.title), sanitizeInput(b.slug), sanitizeInput(b.summary), b.content || '',
          sanitizeInput(b.cover_image), sanitizeInput(b.status || 'published'),
          JSON.stringify(b.tags_meta || {}), sanitizeInput(b.template_style || 'standard'), sanitizeInput(b.custom_instruction || ''),
          sanitizeInput(b.video_url || ''), sanitizeInput(b.map_coords || ''), sanitizeInput(b.travel_date || ''),
          sanitizeInput(b.title_en || ''), sanitizeInput(b.summary_en || ''), b.content_en || '',
          id
        ).run();

        return jsonResponse({ success: true, message: 'อัปเดตบทความเรียบร้อย' }, 200, origin);
      }

      if (path.startsWith('/api/admin/articles/') && method === 'DELETE') {
        const id = path.replace('/api/admin/articles/', '');
        await env.DB.prepare('DELETE FROM articles WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: 'ลบบทความเรียบร้อย' }, 200, origin);
      }

      // Client Logos
      if (path === '/api/admin/client-logos' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM client_logos ORDER BY sort_order ASC').all();
        return jsonResponse({ success: true, data: results || [] }, 200, origin);
      }

      if (path === '/api/admin/client-logos' && method === 'POST') {
        const body = await request.json();
        const name = sanitizeInput(body.name);
        const logo_url = sanitizeInput(body.logo_url);
        const website_url = sanitizeInput(body.website_url || '');
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

      // Inquiries
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

      if (path.match(/\/api\/admin\/inquiries\/\d+\/notes/) && method === 'PATCH') {
        const id = path.split('/')[4];
        const { notes } = await request.json();
        await env.DB.prepare('UPDATE inquiries SET admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(sanitizeInput(notes), id).run();
        return jsonResponse({ success: true, message: 'บันทึกโน้ตสำเร็จ' }, 200, origin);
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

      // Custom Pages Admin API
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
          `INSERT INTO custom_pages (title, slug, content, content_json, meta_description, cover_image, template_style, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
        ).bind(title, slug, content, content_json, meta_description, cover_image, template_style).run();

        if (add_to_nav) {
          const navCount = await env.DB.prepare('SELECT COUNT(*) as count FROM navigation_menus').first();
          const sortOrder = (navCount?.count || 0) + 1;
          await env.DB.prepare(
            `INSERT INTO navigation_menus (label, path, sort_order, is_active)
             VALUES (?, ?, ?, 1)`
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
          `UPDATE custom_pages 
           SET title = ?, slug = ?, content = ?, content_json = ?, meta_description = ?, cover_image = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
        ).bind(title, slug, content, content_json, meta_description, cover_image, is_active, id).run();

        return jsonResponse({ success: true, message: 'บันทึกการแก้ไขเพจเรียบร้อยแล้ว' }, 200, origin);
      }

      if (path.startsWith('/api/admin/pages/') && method === 'DELETE') {
        const id = path.replace('/api/admin/pages/', '');
        await env.DB.prepare('DELETE FROM custom_pages WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: 'ลบหน้าเพจเรียบร้อยแล้ว' }, 200, origin);
      }

      // Site Settings
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

      // R2 Media Upload
      if (path === '/api/admin/media/upload' && method === 'POST') {
        if (!env.R2_BUCKET) {
          return jsonResponse({ success: false, error: 'ยังไม่ได้ผูก R2_BUCKET' }, 400, origin);
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


const ADMIN_HTML_TEMPLATE = "<!DOCTYPE html>\n<html lang=\"th\" class=\"h-full bg-slate-900 text-slate-100\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>LTT Ma getThink — Edge CMS Backoffice</title>\n  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n  <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n  <link href=\"https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap\" rel=\"stylesheet\">\n  <script src=\"https://cdn.tailwindcss.com\"></script>\n  <script src=\"https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js\"></script>\n  <style>\n    body { font-family: 'Plus Jakarta Sans', 'Noto Sans Thai', sans-serif; }\n    .glass-card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }\n    .active-nav { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.39); }\n    .editor-btn { padding: 0.375rem; border-radius: 0.375rem; color: #cbd5e1; transition: all 0.2s; }\n    .editor-btn:hover { background-color: #f1f5f9; color: #0f172a; }\n    [contenteditable]:empty:before { content: attr(placeholder); color: #94a3b8; pointer-events: none; }\n  </style>\n</head>\n<body class=\"h-full flex overflow-hidden\">\n  <!-- Sidebar -->\n  <aside class=\"w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 z-20\">\n    <div class=\"h-16 flex items-center px-6 gap-3 border-b border-slate-800\">\n      <div class=\"w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/30\">\n        L\n      </div>\n      <div>\n        <h1 class=\"font-bold text-sm text-white\">LTT Ma getThink</h1>\n        <p class=\"text-[11px] text-blue-400 font-medium\">Edge Backoffice CMS</p>\n      </div>\n    </div>\n\n    <!-- Navigation Tabs -->\n    <nav class=\"flex-1 px-3 py-4 space-y-1.5 overflow-y-auto\" id=\"sidebarNav\">\n      <button type=\"button\" onclick=\"switchTab('dashboard')\" id=\"btn-tab-dashboard\" class=\"w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition active-nav\">\n        <i data-lucide=\"layout-dashboard\" class=\"w-4 h-4 shrink-0\"></i><span>Dashboard ภาพรวม</span>\n      </button>\n      <button type=\"button\" onclick=\"switchTab('navigation')\" id=\"btn-tab-navigation\" class=\"w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition text-slate-400 hover:text-white hover:bg-slate-900\">\n        <i data-lucide=\"compass\" class=\"w-4 h-4 shrink-0\"></i><span>Navigation เมนูหลัก</span>\n      </button>\n      <button type=\"button\" onclick=\"switchTab('pages')\" id=\"btn-tab-pages\" class=\"w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition text-slate-400 hover:text-white hover:bg-slate-900\">\n        <i data-lucide=\"layers\" class=\"w-4 h-4 shrink-0\"></i><span>สร้างเพจใหม่ (Page Builder)</span>\n      </button>\n      <button type=\"button\" onclick=\"switchTab('portfolios')\" id=\"btn-tab-portfolios\" class=\"w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition text-slate-400 hover:text-white hover:bg-slate-900\">\n        <i data-lucide=\"briefcase\" class=\"w-4 h-4 shrink-0\"></i><span>Portfolios ผลงาน</span>\n      </button>\n      <button type=\"button\" onclick=\"switchTab('services')\" id=\"btn-tab-services\" class=\"w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition text-slate-400 hover:text-white hover:bg-slate-900\">\n        <i data-lucide=\"sparkles\" class=\"w-4 h-4 shrink-0\"></i><span>Services บริการ</span>\n      </button>\n      <button type=\"button\" onclick=\"switchTab('articles')\" id=\"btn-tab-articles\" class=\"w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition text-slate-400 hover:text-white hover:bg-slate-900\">\n        <i data-lucide=\"newspaper\" class=\"w-4 h-4 shrink-0\"></i><span>บทความ & ข่าวสาร</span>\n      </button>\n      <button type=\"button\" onclick=\"switchTab('clients')\" id=\"btn-tab-clients\" class=\"w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition text-slate-400 hover:text-white hover:bg-slate-900\">\n        <i data-lucide=\"building-2\" class=\"w-4 h-4 shrink-0\"></i><span>Client Logos ลูกค้า</span>\n      </button>\n      <button type=\"button\" onclick=\"switchTab('inquiries')\" id=\"btn-tab-inquiries\" class=\"w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition text-slate-400 hover:text-white hover:bg-slate-900 justify-between\">\n        <div class=\"flex items-center gap-3\">\n          <i data-lucide=\"inbox\" class=\"w-4 h-4 shrink-0\"></i><span>Inquiries ข้อความติดต่อ</span>\n        </div>\n        <span id=\"badge-new-inquiries\" class=\"hidden bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full\">0</span>\n      </button>\n      <button type=\"button\" onclick=\"switchTab('settings')\" id=\"btn-tab-settings\" class=\"w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition text-slate-400 hover:text-white hover:bg-slate-900\">\n        <i data-lucide=\"settings\" class=\"w-4 h-4 shrink-0\"></i><span>Site Settings & SEO</span>\n      </button>\n    </nav>\n  </aside>\n\n  <!-- Main Content Area -->\n  <div class=\"flex-1 flex flex-col min-w-0 overflow-hidden\">\n    <!-- Clean Minimalist Header (Without top D1 badge / purge buttons as requested) -->\n    <div class=\"h-14 border-b border-slate-800 bg-slate-950/60 px-8 flex items-center justify-between shrink-0\">\n      <div class=\"flex items-center gap-2\">\n        <h2 id=\"currentTabTitle\" class=\"text-sm font-bold text-white capitalize\">Dashboard ภาพรวม</h2>\n      </div>\n      <div class=\"flex items-center gap-3\">\n        <a href=\"https://ltt-website.pages.dev/\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition border border-slate-800\">\n          <span>เปิดหน้าเว็บไซต์</span>\n          <i data-lucide=\"external-link\" class=\"w-3.5 h-3.5\"></i>\n        </a>\n      </div>\n    </div>\n\n    <main class=\"flex-1 overflow-y-auto p-8\">\n      <!-- SECTION 1: DASHBOARD -->\n      <section id=\"section-dashboard\" class=\"space-y-8\">\n        <div class=\"grid grid-cols-1 md:grid-cols-4 gap-6\">\n          <div class=\"glass-card p-6 rounded-2xl\">\n            <span class=\"text-xs font-medium text-slate-400\">ข้อความติดต่อทั้งหมด</span>\n            <div id=\"stat-total-inquiries\" class=\"text-2xl font-bold text-white mt-1\">0</div>\n            <p class=\"text-[11px] text-emerald-400 mt-2 font-medium\">\n              <span id=\"stat-new-inquiries\">0</span> ข้อความใหม่\n            </p>\n          </div>\n          <div class=\"glass-card p-6 rounded-2xl\">\n            <span class=\"text-xs font-medium text-slate-400\">ผลงานทั้งหมด</span>\n            <div id=\"stat-total-portfolios\" class=\"text-2xl font-bold text-white mt-1\">0</div>\n            <p class=\"text-[11px] text-blue-400 mt-2\">D1 Database</p>\n          </div>\n          <div class=\"glass-card p-6 rounded-2xl\">\n            <span class=\"text-xs font-medium text-slate-400\">บริการหลัก</span>\n            <div id=\"stat-total-services\" class=\"text-2xl font-bold text-white mt-1\">0</div>\n            <p class=\"text-[11px] text-indigo-400 mt-2\">Services</p>\n          </div>\n          <div class=\"glass-card p-6 rounded-2xl\">\n            <span class=\"text-xs font-medium text-slate-400\">บทความ & ข่าวสาร</span>\n            <div id=\"stat-total-articles\" class=\"text-2xl font-bold text-white mt-1\">0</div>\n            <p class=\"text-[11px] text-purple-400 mt-2\">Articles</p>\n          </div>\n        </div>\n\n        <div class=\"glass-card p-6 rounded-2xl\">\n          <h3 class=\"font-bold text-white text-sm mb-4\">ข้อความติดต่อล่าสุด</h3>\n          <div class=\"overflow-x-auto\">\n            <table class=\"w-full text-left text-xs\">\n              <thead class=\"text-slate-400 border-b border-slate-800\">\n                <tr>\n                  <th class=\"pb-3\">ชื่อลูกค้า</th>\n                  <th class=\"pb-3\">บริษัท</th>\n                  <th class=\"pb-3\">บริการ</th>\n                  <th class=\"pb-3\">สถานะ</th>\n                  <th class=\"pb-3\">วันที่</th>\n                </tr>\n              </thead>\n              <tbody id=\"table-recent-inquiries\" class=\"divide-y divide-slate-800/60\">\n                <tr><td colspan=\"5\" class=\"py-4 text-slate-500 text-center\">กำลังโหลด...</td></tr>\n              </tbody>\n            </table>\n          </div>\n        </div>\n      </section>\n\n      <!-- SECTION 2: NAVIGATION -->\n      <section id=\"section-navigation\" class=\"space-y-6 hidden\">\n        <div class=\"flex items-center justify-between\">\n          <h3 class=\"text-base font-bold text-white\">จัดการเมนูนำทาง (Navigation Menus)</h3>\n          <button type=\"button\" onclick=\"openNavModal()\" class=\"px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition flex items-center gap-2\">\n            <i data-lucide=\"plus\" class=\"w-4 h-4\"></i><span>+ เพิ่มเมนูใหม่</span>\n          </button>\n        </div>\n        <div class=\"glass-card rounded-2xl overflow-hidden\">\n          <table class=\"w-full text-left text-xs\">\n            <thead class=\"text-slate-400 border-b border-slate-800 bg-slate-950/40\">\n              <tr>\n                <th class=\"p-4\">ลำดับ</th>\n                <th class=\"p-4\">ชื่อเมนู (Label)</th>\n                <th class=\"p-4\">URL Path</th>\n                <th class=\"p-4\">ประเภท</th>\n                <th class=\"p-4\">สถานะ</th>\n                <th class=\"p-4 text-right\">การจัดการ</th>\n              </tr>\n            </thead>\n            <tbody id=\"table-navigation\" class=\"divide-y divide-slate-800/60\">\n              <tr><td colspan=\"6\" class=\"p-4 text-slate-500 text-center\">กำลังโหลดข้อมูล...</td></tr>\n            </tbody>\n          </table>\n        </div>\n      </section>\n\n      <!-- SECTION 2.5: PAGES (PAGE BUILDER) -->\n      <section id=\"section-pages\" class=\"space-y-6 hidden\">\n        <div class=\"flex items-center justify-between\">\n          <div>\n            <h3 class=\"text-base font-bold text-white\">จัดการหน้าเพจ & ตัวสร้างเพจใหม่ (Page Builder)</h3>\n            <p class=\"text-xs text-slate-400 mt-0.5\">สร้างหน้าเพจใหม่ด้วยโครงสร้างคอลัมน์ (1-3 Columns), บล็อกข้อความ, รูปภาพ, วิดีโอ หรือเขียนโค้ด HTML/Tailwind โดยตรง</p>\n          </div>\n          <button type=\"button\" onclick=\"openPageBuilderModal()\" class=\"px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition flex items-center gap-2\">\n            <i data-lucide=\"plus\" class=\"w-4 h-4\"></i><span>+ สร้างหน้าเพจใหม่</span>\n          </button>\n        </div>\n        <div class=\"glass-card rounded-2xl overflow-hidden\">\n          <table class=\"w-full text-left text-xs\">\n            <thead class=\"text-slate-400 border-b border-slate-800 bg-slate-950/40\">\n              <tr>\n                <th class=\"p-4\">ชื่อหน้าเพจ (Page Title)</th>\n                <th class=\"p-4\">URL Slug / Path</th>\n                <th class=\"p-4\">สไตล์การสร้าง</th>\n                <th class=\"p-4\">แก้ไขล่าสุด</th>\n                <th class=\"p-4\">สถานะ</th>\n                <th class=\"p-4 text-right\">การจัดการ</th>\n              </tr>\n            </thead>\n            <tbody id=\"table-pages\" class=\"divide-y divide-slate-800/60\">\n              <tr><td colspan=\"6\" class=\"p-4 text-slate-500 text-center\">กำลังโหลดข้อมูลหน้าเพจ...</td></tr>\n            </tbody>\n          </table>\n        </div>\n      </section>\n\n      <!-- SECTION 3: PORTFOLIOS -->\n      <section id=\"section-portfolios\" class=\"space-y-6 hidden\">\n        <div class=\"flex items-center justify-between\">\n          <div>\n            <h3 class=\"text-base font-bold text-white\">จัดการผลงาน (Portfolios)</h3>\n            <p class=\"text-xs text-slate-400 mt-0.5\">ผลงานลูกค้า รองรับการเขียนเนื้อหา Tags 6 มิติ วิดีโอ และพิกัด Google Maps</p>\n          </div>\n          <button type=\"button\" onclick=\"openRichEditor('portfolio')\" class=\"px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition flex items-center gap-2\">\n            <i data-lucide=\"plus\" class=\"w-4 h-4\"></i><span>+ เพิ่มผลงานใหม่</span>\n          </button>\n        </div>\n        <div id=\"grid-portfolios\" class=\"grid grid-cols-1 md:grid-cols-3 gap-6\">\n          <div class=\"p-6 text-slate-500 text-xs\">กำลังโหลดข้อมูล...</div>\n        </div>\n      </section>\n\n      <!-- SECTION 4: SERVICES -->\n      <section id=\"section-services\" class=\"space-y-6 hidden\">\n        <div class=\"flex items-center justify-between\">\n          <div>\n            <h3 class=\"text-base font-bold text-white\">จัดการบริการ (Services)</h3>\n            <p class=\"text-xs text-slate-400 mt-0.5\">สามารถอัปโหลดรูปภาพบริการ และแก้ไขรายการติ๊กถูก (Checkmarks) ได้อย่างอิสระ</p>\n          </div>\n        </div>\n        <div id=\"grid-services\" class=\"grid grid-cols-1 md:grid-cols-2 gap-6\">\n          <div class=\"p-6 text-slate-500 text-xs\">กำลังโหลดข้อมูล...</div>\n        </div>\n      </section>\n\n      <!-- SECTION 5: ARTICLES -->\n      <section id=\"section-articles\" class=\"space-y-6 hidden\">\n        <div class=\"flex items-center justify-between\">\n          <div>\n            <h3 class=\"text-base font-bold text-white\">บทความ & ข่าวสาร (Blog & Events)</h3>\n            <p class=\"text-xs text-slate-400 mt-0.5\">เขียนบทความ รีวิว ท่องเที่ยว อัปโหลดรูปภาพ แทรกวิดีโอ YouTube และพิกัด Google Maps</p>\n          </div>\n          <button type=\"button\" onclick=\"openRichEditor('article')\" class=\"px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition flex items-center gap-2\">\n            <i data-lucide=\"plus\" class=\"w-4 h-4\"></i><span>+ เพิ่มบทความใหม่</span>\n          </button>\n        </div>\n        <div class=\"glass-card rounded-2xl overflow-hidden\">\n          <table class=\"w-full text-left text-xs\">\n            <thead class=\"text-slate-400 border-b border-slate-800 bg-slate-950/40\">\n              <tr>\n                <th class=\"p-4\">ภาพ</th>\n                <th class=\"p-4\">ชื่อบทความ</th>\n                <th class=\"p-4\">Template สไตล์</th>\n                <th class=\"p-4\">วันที่</th>\n                <th class=\"p-4\">สถานะ</th>\n                <th class=\"p-4 text-right\">การจัดการ</th>\n              </tr>\n            </thead>\n            <tbody id=\"table-articles\" class=\"divide-y divide-slate-800/60\">\n              <tr><td colspan=\"6\" class=\"p-4 text-slate-500 text-center\">กำลังโหลดข้อมูล...</td></tr>\n            </tbody>\n          </table>\n        </div>\n      </section>\n\n      <!-- SECTION 6: CLIENT LOGOS -->\n      <section id=\"section-clients\" class=\"space-y-6 hidden\">\n        <div class=\"flex items-center justify-between\">\n          <div>\n            <h3 class=\"text-base font-bold text-white\">โลโก้ลูกค้า (Client Logos)</h3>\n            <p class=\"text-xs text-slate-400 mt-0.5\">รองรับการอัปโหลดไฟล์ภาพตรงลง Cloudflare R2 Bucket</p>\n          </div>\n          <button type=\"button\" onclick=\"openClientModal()\" class=\"px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition flex items-center gap-2\">\n            <i data-lucide=\"plus\" class=\"w-4 h-4\"></i><span>+ เพิ่มโลโก้ลูกค้า</span>\n          </button>\n        </div>\n        <div id=\"grid-client-logos\" class=\"grid grid-cols-2 md:grid-cols-5 gap-4\">\n          <div class=\"p-4 text-slate-500 text-xs\">กำลังโหลดข้อมูล...</div>\n        </div>\n      </section>\n\n      <!-- SECTION 7: INQUIRIES -->\n      <section id=\"section-inquiries\" class=\"space-y-6 hidden\">\n        <div class=\"flex items-center justify-between\">\n          <h3 class=\"text-base font-bold text-white\">ข้อความติดต่อจากเว็บไซต์</h3>\n          <a href=\"/api/admin/inquiries/export.csv\" class=\"px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition flex items-center gap-2\">\n            <i data-lucide=\"download\" class=\"w-4 h-4\"></i><span>Export CSV</span>\n          </a>\n        </div>\n        <div class=\"glass-card rounded-2xl overflow-hidden\">\n          <table class=\"w-full text-left text-xs\">\n            <thead class=\"text-slate-400 border-b border-slate-800 bg-slate-950/40\">\n              <tr>\n                <th class=\"p-4\">ชื่อลูกค้า</th>\n                <th class=\"p-4\">ติดต่อ</th>\n                <th class=\"p-4\">ข้อความ & บันทึก</th>\n                <th class=\"p-4\">หน้าต้นทาง</th>\n                <th class=\"p-4\">สถานะ</th>\n                <th class=\"p-4 text-right\">การจัดการ</th>\n              </tr>\n            </thead>\n            <tbody id=\"table-inquiries\" class=\"divide-y divide-slate-800/60\">\n              <tr><td colspan=\"6\" class=\"p-4 text-slate-500 text-center\">กำลังโหลดข้อมูล...</td></tr>\n            </tbody>\n          </table>\n        </div>\n      </section>\n\n      <!-- SECTION 8: SITE SETTINGS & SEO -->\n      <section id=\"section-settings\" class=\"space-y-6 hidden\">\n        <div>\n          <h3 class=\"text-base font-bold text-white\">ตั้งค่าเว็บไซต์ & SEO ครบวงจร</h3>\n          <p class=\"text-xs text-slate-400 mt-0.5\">จัดการข้อมูลติดต่อ, โซเชียลมีเดีย, การแชร์ Social Share (OG Tag) และเครื่องมือ Tracking</p>\n        </div>\n        <form id=\"form-site-settings\" onsubmit=\"handleSaveSettings(event)\" class=\"space-y-6 max-w-4xl\">\n          <!-- 1. ข้อมูลติดต่อหลัก -->\n          <div class=\"glass-card rounded-2xl p-6 space-y-4\">\n            <h4 class=\"text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2\">\n              <i data-lucide=\"phone\" class=\"w-4 h-4\"></i><span>ข้อมูลติดต่อหลัก (Contact Info)</span>\n            </h4>\n            <div class=\"grid grid-cols-1 md:grid-cols-2 gap-4\">\n              <div>\n                <label class=\"text-xs text-slate-400 block mb-1\">ชื่อบริษัท (Company Name)</label>\n                <input type=\"text\" id=\"setting_company_name\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white\">\n              </div>\n              <div>\n                <label class=\"text-xs text-slate-400 block mb-1\">เบอร์โทรศัพท์ (Phone)</label>\n                <input type=\"text\" id=\"setting_phone\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white\">\n              </div>\n              <div>\n                <label class=\"text-xs text-slate-400 block mb-1\">อีเมลติดต่อ (Email)</label>\n                <input type=\"email\" id=\"setting_email\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white\">\n              </div>\n              <div>\n                <label class=\"text-xs text-slate-400 block mb-1\">LINE Official Account (LINE OA)</label>\n                <input type=\"text\" id=\"setting_line_oa\" placeholder=\"@lttmagetthink\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white\">\n              </div>\n              <div class=\"md:col-span-2\">\n                <label class=\"text-xs text-slate-400 block mb-1\">ที่อยู่บริษัท (Address)</label>\n                <textarea rows=\"2\" id=\"setting_address\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white\"></textarea>\n              </div>\n              <div>\n                <label class=\"text-xs text-slate-400 block mb-1\">เวลาทำการ (Working Hours)</label>\n                <input type=\"text\" id=\"setting_working_hours\" placeholder=\"จันทร์ - เสาร์ 09:00 - 18:00\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white\">\n              </div>\n            </div>\n          </div>\n\n          <!-- 2. Social Links -->\n          <div class=\"glass-card rounded-2xl p-6 space-y-4\">\n            <h4 class=\"text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2\">\n              <i data-lucide=\"share-2\" class=\"w-4 h-4\"></i><span>ลิงก์โซเชียลมีเดีย (Social Media)</span>\n            </h4>\n            <div class=\"grid grid-cols-1 md:grid-cols-2 gap-4\">\n              <div>\n                <label class=\"text-xs text-slate-400 block mb-1\">Facebook URL</label>\n                <input type=\"text\" id=\"setting_social_facebook\" placeholder=\"https://facebook.com/...\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white\">\n              </div>\n              <div>\n                <label class=\"text-xs text-slate-400 block mb-1\">Instagram URL</label>\n                <input type=\"text\" id=\"setting_social_instagram\" placeholder=\"https://instagram.com/...\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white\">\n              </div>\n              <div>\n                <label class=\"text-xs text-slate-400 block mb-1\">TikTok URL</label>\n                <input type=\"text\" id=\"setting_social_tiktok\" placeholder=\"https://tiktok.com/@...\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white\">\n              </div>\n              <div>\n                <label class=\"text-xs text-slate-400 block mb-1\">YouTube URL</label>\n                <input type=\"text\" id=\"setting_social_youtube\" placeholder=\"https://youtube.com/@...\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white\">\n              </div>\n            </div>\n          </div>\n\n          <!-- 3. SEO & Open Graph -->\n          <div class=\"glass-card rounded-2xl p-6 space-y-4\">\n            <h4 class=\"text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2\">\n              <i data-lucide=\"globe\" class=\"w-4 h-4\"></i><span>การตั้งค่า SEO & Social Share (Open Graph)</span>\n            </h4>\n            <div class=\"space-y-4\">\n              <div>\n                <label class=\"text-xs text-slate-400 block mb-1\">Meta Title (หัวข้อสำหรับ Google Search)</label>\n                <input type=\"text\" id=\"setting_site_title\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white\">\n              </div>\n              <div>\n                <label class=\"text-xs text-slate-400 block mb-1\">Meta Description (คำอธิบายสำหรับ Google & Social Share)</label>\n                <textarea rows=\"2\" id=\"setting_site_description\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white\"></textarea>\n              </div>\n              <div>\n                <label class=\"text-xs text-slate-400 block mb-1\">รูป Social Share Preview Image (OG Image 1200x630px)</label>\n                <div class=\"flex gap-2\">\n                  <input type=\"text\" id=\"setting_og_image\" class=\"flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white\">\n                  <label class=\"px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 cursor-pointer flex items-center gap-1.5 shrink-0\">\n                    <i data-lucide=\"upload\" class=\"w-3.5 h-3.5\"></i><span>อัปโหลด R2</span>\n                    <input type=\"file\" accept=\"image/*\" class=\"hidden\" onchange=\"uploadGenericFile(this, 'setting_og_image')\">\n                  </label>\n                </div>\n              </div>\n              <div>\n                <label class=\"text-xs text-slate-400 block mb-1\">Google Site Verification Code (Search Console Meta Tag)</label>\n                <input type=\"text\" id=\"setting_google_verification\" placeholder=\"google-site-verification=...\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono\">\n              </div>\n            </div>\n          </div>\n\n          <!-- 4. Analytics & Tracking -->\n          <div class=\"glass-card rounded-2xl p-6 space-y-4\">\n            <h4 class=\"text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2\">\n              <i data-lucide=\"bar-chart-3\" class=\"w-4 h-4\"></i><span>เครื่องมือ Analytics & Tracking</span>\n            </h4>\n            <div class=\"grid grid-cols-1 md:grid-cols-3 gap-4\">\n              <div>\n                <label class=\"text-xs text-slate-400 block mb-1\">Google Tag Manager (GTM ID)</label>\n                <input type=\"text\" id=\"setting_gtm_id\" placeholder=\"GTM-XXXXXXX\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono\">\n              </div>\n              <div>\n                <label class=\"text-xs text-slate-400 block mb-1\">Google Analytics 4 (GA4 ID)</label>\n                <input type=\"text\" id=\"setting_ga4_id\" placeholder=\"G-XXXXXXXXXX\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono\">\n              </div>\n              <div>\n                <label class=\"text-xs text-slate-400 block mb-1\">Facebook Pixel ID</label>\n                <input type=\"text\" id=\"setting_fb_pixel_id\" placeholder=\"1234567890\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono\">\n              </div>\n            </div>\n          </div>\n\n          <div class=\"flex justify-end\">\n            <button type=\"submit\" class=\"px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20\">\n              บันทึกการตั้งค่าเว็บไซต์ทั้งหมด\n            </button>\n          </div>\n        </form>\n      </section>\n    </main>\n  </div>\n\n  <!-- ==================== RICH CONTENT EDITOR MODAL (Based on Image 2) ==================== -->\n  <div id=\"modal-rich-editor\" class=\"fixed inset-0 z-50 items-center justify-center p-4 bg-black/80 backdrop-blur-sm hidden overflow-y-auto\">\n    <div class=\"bg-white text-slate-800 rounded-2xl w-full max-w-4xl my-8 shadow-2xl flex flex-col overflow-hidden max-h-[92vh]\">\n      \n      <!-- Top Action Bar (Matching Image 2) -->\n      <div class=\"bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0\">\n        <!-- Left Toolbar -->\n        <div class=\"flex items-center gap-1 text-slate-600\">\n          <button type=\"button\" onclick=\"execCmd('undo')\" title=\"Undo\" class=\"editor-btn\">↩</button>\n          <button type=\"button\" onclick=\"execCmd('redo')\" title=\"Redo\" class=\"editor-btn\">↪</button>\n          <span class=\"w-px h-4 bg-slate-200 mx-1\"></span>\n          <button type=\"button\" onclick=\"execCmd('formatBlock', '<p>')\" title=\"Paragraph\" class=\"editor-btn font-serif\">¶</button>\n          <button type=\"button\" onclick=\"toggleHeading()\" title=\"Heading (H2/H3)\" class=\"editor-btn font-bold\">A↕</button>\n          <button type=\"button\" onclick=\"execCmd('bold')\" title=\"Bold\" class=\"editor-btn font-bold\">B</button>\n          <button type=\"button\" onclick=\"execCmd('italic')\" title=\"Italic\" class=\"editor-btn italic\">I</button>\n          <button type=\"button\" onclick=\"execCmd('strikeThrough')\" title=\"Strikethrough\" class=\"editor-btn line-through\">S</button>\n          <span class=\"w-px h-4 bg-slate-200 mx-1\"></span>\n          <button type=\"button\" onclick=\"execCmd('insertUnorderedList')\" title=\"Bullet List\" class=\"editor-btn\">⋮≡</button>\n          <button type=\"button\" onclick=\"execCmd('insertOrderedList')\" title=\"Numbered List\" class=\"editor-btn\">1.≡</button>\n          <button type=\"button\" onclick=\"insertLinkPrompt()\" title=\"Insert Link\" class=\"editor-btn\">🔗</button>\n          <button type=\"button\" onclick=\"execCmd('insertHorizontalRule')\" title=\"Divider\" class=\"editor-btn\">—</button>\n          <span class=\"w-px h-4 bg-slate-200 mx-1\"></span>\n          <!-- Media Embed Buttons -->\n          <label title=\"Insert Image from R2\" class=\"editor-btn cursor-pointer inline-flex items-center\">\n            🖼️\n            <input type=\"file\" accept=\"image/*\" class=\"hidden\" onchange=\"uploadAndInsertImage(this)\">\n          </label>\n          <button type=\"button\" onclick=\"promptInsertVideo()\" title=\"Insert YouTube Video\" class=\"editor-btn\">▶️</button>\n          <button type=\"button\" onclick=\"promptInsertMap()\" title=\"Insert Google Map Coordinates\" class=\"editor-btn\">📍</button>\n        </div>\n\n        <!-- Right Action Controls -->\n        <div class=\"flex items-center gap-3\">\n          <select id=\"editor_status\" class=\"text-xs bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none\">\n            <option value=\"published\">เผยแพร่ (Published)</option>\n            <option value=\"draft\">ฉบับร่าง (Draft)</option>\n          </select>\n          <button type=\"button\" onclick=\"previewEditorContent()\" class=\"px-4 py-1.5 rounded-lg border border-teal-600 text-teal-700 hover:bg-teal-50 text-xs font-semibold transition\">\n            Preview\n          </button>\n          <button type=\"button\" onclick=\"handleSaveRichEditor()\" class=\"px-5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm\">\n            บันทึก\n          </button>\n          <button type=\"button\" onclick=\"closeRichEditor()\" class=\"text-slate-400 hover:text-slate-600 p-1 text-base\">✕</button>\n        </div>\n      </div>\n\n      <!-- Editor Body Form -->\n      <div class=\"flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50\">\n        <input type=\"hidden\" id=\"editor_target_type\" value=\"portfolio\">\n        <input type=\"hidden\" id=\"editor_item_id\" value=\"\">\n\n        <!-- Language Tabs & Auto-Translate -->\n        <div class=\"flex items-center justify-between border-b border-slate-200 pb-2\">\n          <div class=\"flex gap-2\">\n            <button type=\"button\" onclick=\"switchEditorLang('th')\" id=\"tab-lang-th\" class=\"px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white\">ภาษาไทย (TH)</button>\n            <button type=\"button\" onclick=\"switchEditorLang('en')\" id=\"tab-lang-en\" class=\"px-3 py-1 rounded-lg text-xs font-medium bg-slate-200 text-slate-700\">ภาษาอังกฤษ (EN)</button>\n          </div>\n          <button type=\"button\" onclick=\"runAiTranslate()\" id=\"btn-ai-translate\" class=\"px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1.5 transition\">\n            <span>🤖 AI แปลเป็นภาษาอังกฤษอัตโนมัติ</span>\n          </button>\n        </div>\n\n        <!-- THAI FIELDS -->\n        <div id=\"editor-fields-th\" class=\"space-y-6\">\n          <!-- 1. ชื่อบันทึก (Title) -->\n          <div>\n            <label class=\"block text-xs font-bold text-slate-700 mb-1\">ชื่อบันทึก / หัวข้อ *</label>\n            <input type=\"text\" id=\"editor_title_th\" placeholder=\"พิมพ์ชื่อผลงาน หรือชื่อหัวข้อบทความ...\" class=\"w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-500\">\n          </div>\n\n          <!-- 2. Marketing Agency Tags (6 มิติสำหรับ Agency & ผลงานการตลาด) -->\n          <div>\n            <div class=\"flex items-center gap-1.5 mb-2\">\n              <span class=\"text-xs font-bold text-slate-700\">Tags (Marketing Agency 6 มิติ)</span>\n              <span class=\"text-[11px] text-slate-400\">ⓘ</span>\n              <span class=\"text-[11px] text-teal-600 font-medium\">*ระบุแท็กเพื่อจัดหมวดหมู่และคัดกรองผลงาน</span>\n            </div>\n            <div class=\"grid grid-cols-1 md:grid-cols-2 gap-3 text-xs\">\n              <div class=\"flex border border-slate-300 rounded-xl overflow-hidden bg-white\">\n                <span class=\"bg-slate-100 text-slate-600 px-3 py-2 border-r border-slate-300 font-medium w-32 shrink-0\">🚀 บริการ/แคมเปญ:</span>\n                <input type=\"text\" id=\"tag_service\" placeholder=\"Social Media, Video Production, Ads ...\" class=\"flex-1 px-3 py-2 focus:outline-none\">\n              </div>\n              <div class=\"flex border border-slate-300 rounded-xl overflow-hidden bg-white\">\n                <span class=\"bg-slate-100 text-slate-600 px-3 py-2 border-r border-slate-300 font-medium w-32 shrink-0\">🏢 ธุรกิจลูกค้า:</span>\n                <input type=\"text\" id=\"tag_industry\" placeholder=\"Hospitality, Real Estate, F&B, Beauty ...\" class=\"flex-1 px-3 py-2 focus:outline-none\">\n              </div>\n              <div class=\"flex border border-slate-300 rounded-xl overflow-hidden bg-white\">\n                <span class=\"bg-slate-100 text-slate-600 px-3 py-2 border-r border-slate-300 font-medium w-32 shrink-0\">📱 แพลตฟอร์ม:</span>\n                <input type=\"text\" id=\"tag_platform\" placeholder=\"TikTok, Facebook, Instagram, YouTube, LINE ...\" class=\"flex-1 px-3 py-2 focus:outline-none\">\n              </div>\n              <div class=\"flex border border-slate-300 rounded-xl overflow-hidden bg-white\">\n                <span class=\"bg-slate-100 text-slate-600 px-3 py-2 border-r border-slate-300 font-medium w-32 shrink-0\">👥 กลุ่มเป้าหมาย:</span>\n                <input type=\"text\" id=\"tag_target\" placeholder=\"Gen Z, Millennials, Luxury, B2B, Family ...\" class=\"flex-1 px-3 py-2 focus:outline-none\">\n              </div>\n              <div class=\"flex border border-slate-300 rounded-xl overflow-hidden bg-white\">\n                <span class=\"bg-slate-100 text-slate-600 px-3 py-2 border-r border-slate-300 font-medium w-32 shrink-0\">🎯 วัตถุประสงค์:</span>\n                <input type=\"text\" id=\"tag_objective\" placeholder=\"Brand Awareness, Lead Gen, Engagement ...\" class=\"flex-1 px-3 py-2 focus:outline-none\">\n              </div>\n              <div class=\"flex border border-slate-300 rounded-xl overflow-hidden bg-white\">\n                <span class=\"bg-slate-100 text-slate-600 px-3 py-2 border-r border-slate-300 font-medium w-32 shrink-0\">📦 รูปแบบผลงาน:</span>\n                <input type=\"text\" id=\"tag_format\" placeholder=\"Short Video, Photo Shoot, Case Study ...\" class=\"flex-1 px-3 py-2 focus:outline-none\">\n              </div>\n            </div>\n          </div>\n\n          <!-- 3. ภาพปก (Cover Image Upload to R2) -->\n          <div>\n            <label class=\"block text-xs font-bold text-slate-700 mb-1\">ภาพปก *</label>\n            <div id=\"dropzone_cover\" class=\"border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-white hover:border-teal-500 transition cursor-pointer relative\" onclick=\"document.getElementById('input_cover_file').click()\">\n              <input type=\"file\" id=\"input_cover_file\" accept=\"image/*\" class=\"hidden\" onchange=\"uploadCoverImage(this)\">\n              <div id=\"cover_placeholder\" class=\"space-y-2\">\n                <div class=\"w-12 h-12 mx-auto text-3xl\">🖼️</div>\n                <p class=\"text-xs font-semibold text-slate-700\">คลิกหรือลากไฟล์ภาพมาวางที่นี่เพื่ออัปโหลดขึ้น R2</p>\n                <p class=\"text-[11px] text-slate-400\">รองรับไฟล์ JPG, PNG, WebP ขนาดไม่เกิน 10MB</p>\n              </div>\n\n              <!-- Upload Progress Indicator Bar -->\n              <div id=\"cover_progress_wrap\" class=\"hidden max-w-xs mx-auto py-3 space-y-2\">\n                <div class=\"flex items-center justify-between text-xs font-bold text-teal-700\">\n                  <span id=\"cover_progress_label\">กำลังอัปโหลดไปยัง Cloudflare R2...</span>\n                  <span id=\"cover_progress_pct\">0%</span>\n                </div>\n                <div class=\"w-full bg-slate-200 rounded-full h-2 overflow-hidden\">\n                  <div id=\"cover_progress_bar\" class=\"bg-teal-600 h-2 rounded-full transition-all duration-150\" style=\"width: 0%\"></div>\n                </div>\n              </div>\n\n              <div id=\"cover_preview_box\" class=\"hidden\">\n                <img id=\"cover_preview_img\" src=\"\" class=\"max-h-52 mx-auto rounded-xl object-cover shadow\" alt=\"Cover Preview\">\n                <div class=\"mt-2 flex items-center justify-center gap-3\">\n                  <span class=\"text-[11px] font-bold text-emerald-600\">✓ อัปโหลดบน Cloudflare R2 สำเร็จ</span>\n                  <button type=\"button\" onclick=\"event.stopPropagation(); removeCoverImage();\" class=\"text-xs text-rose-500 font-semibold hover:underline\">เปลี่ยนภาพปก</button>\n                </div>\n              </div>\n            </div>\n            <input type=\"hidden\" id=\"editor_cover_url\" value=\"\">\n            <p class=\"text-[10px] text-slate-500 mt-1.5 leading-relaxed\">\n              * ในกรณีเปลี่ยนหน้าปกใหม่ อาจจะใช้เวลาหลายนาทีในการแสดงภาพใหม่เนื่องจากตัวเว็บเบราว์เซอร์ยังจำค่าเดิมอยู่ หรือ \"เบราว์เซอร์แคช\" หากต้องการดูแบบเรียลไทม์ ให้เคลียร์แคชของเว็บเบราว์เซอร์ก่อน หรือ ใช้เบราว์เซอร์อื่นเพื่อดู\n            </p>\n          </div>\n\n          <!-- 4. วันที่ & ลิงก์สื่อ (YouTube & Google Map) -->\n          <div class=\"grid grid-cols-1 md:grid-cols-3 gap-4\">\n            <div>\n              <label class=\"block text-xs font-bold text-slate-700 mb-1\">วันที่เดินทาง / วันที่เผยแพร่</label>\n              <input type=\"date\" id=\"editor_travel_date\" class=\"w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none\">\n            </div>\n            <div>\n              <label class=\"block text-xs font-bold text-slate-700 mb-1\">YouTube Video Link (ถ้ามี)</label>\n              <input type=\"text\" id=\"editor_video_url\" placeholder=\"https://www.youtube.com/watch?v=...\" class=\"w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none\">\n            </div>\n            <div>\n              <label class=\"block text-xs font-bold text-slate-700 mb-1\">พิกัด / Embed Google Maps</label>\n              <input type=\"text\" id=\"editor_map_coords\" placeholder=\"เช่น 13.7563, 100.5018 หรือ iframe\" class=\"w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none\">\n            </div>\n          </div>\n\n          <!-- 5. Template Layout Instruction (สไตล์การจัดหน้า) -->\n          <div class=\"grid grid-cols-1 md:grid-cols-2 gap-4\">\n            <div>\n              <label class=\"block text-xs font-bold text-slate-700 mb-1\">เลือกสไตล์การจัดหน้า (Template Layout)</label>\n              <select id=\"editor_template_style\" class=\"w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none\">\n                <option value=\"review-travel\">🏷️ Editorial Review & Travel Story (เน้นเล่าเรื่อง Hero + แผนที่ + วิดีโอ)</option>\n                <option value=\"case-study\">💼 Modern Case Study (โจทย์ลูกค้า สรุปผลงาน สถิติ แกลเลอรี)</option>\n                <option value=\"visual-gallery\">🖼️ Visual Gallery Showcase (เน้นผลงานภาพถ่ายขนาดใหญ่)</option>\n                <option value=\"standard\">📝 Standard Article (บทความมาตรฐานอ่านง่าย)</option>\n              </select>\n            </div>\n            <div>\n              <label class=\"block text-xs font-bold text-slate-700 mb-1\">คำแนะนำเฉพาะ (Custom Instruction / Notes)</label>\n              <input type=\"text\" id=\"editor_custom_instruction\" placeholder=\"เช่น ใส่โทนสีอบอุ่น เน้นไฮไลท์สระว่ายน้ำ...\" class=\"w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none\">\n            </div>\n          </div>\n\n          <!-- 6. สรุปสั้นๆ (Summary) -->\n          <div>\n            <label class=\"block text-xs font-bold text-slate-700 mb-1\">สรุปย่อ (Summary / Lead Paragraph)</label>\n            <textarea rows=\"2\" id=\"editor_summary_th\" placeholder=\"สรุปภาพรวม 2-3 บรรทัด...\" class=\"w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none\"></textarea>\n          </div>\n\n          <!-- 7. เนื้อหาหลัก (Rich Content Area) -->\n          <div>\n            <label class=\"block text-xs font-bold text-slate-700 mb-1\">เนื้อหา (Content) *</label>\n            <div id=\"editor_content_th\" contenteditable=\"true\" placeholder=\"พิมพ์เนื้อหาของรีวิวและใส่รูปภาพที่นี่...\" class=\"min-h-[280px] bg-white border border-slate-300 rounded-xl p-4 text-sm text-slate-800 focus:outline-none focus:border-teal-500 overflow-y-auto leading-relaxed\"></div>\n          </div>\n        </div>\n\n        <!-- ENGLISH FIELDS (Bilingual) -->\n        <div id=\"editor-fields-en\" class=\"space-y-6 hidden\">\n          <div class=\"p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700\">\n            ℹ️ ข้อมูลภาษาอังกฤษสำหรับแสดงผลเมื่อผู้เข้าชมเลือกภาษาอังกฤษ (EN) บนหน้าเว็บไซต์\n          </div>\n          <div>\n            <label class=\"block text-xs font-bold text-slate-700 mb-1\">Title (English)</label>\n            <input type=\"text\" id=\"editor_title_en\" placeholder=\"Article / Portfolio Title in English...\" class=\"w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none\">\n          </div>\n          <div>\n            <label class=\"block text-xs font-bold text-slate-700 mb-1\">Summary (English)</label>\n            <textarea rows=\"2\" id=\"editor_summary_en\" placeholder=\"Short overview in English...\" class=\"w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none\"></textarea>\n          </div>\n          <div>\n            <label class=\"block text-xs font-bold text-slate-700 mb-1\">Content (English)</label>\n            <div id=\"editor_content_en\" contenteditable=\"true\" placeholder=\"Write or paste English content here...\" class=\"min-h-[280px] bg-white border border-slate-300 rounded-xl p-4 text-sm text-slate-800 focus:outline-none overflow-y-auto leading-relaxed\"></div>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <!-- Preview Modal -->\n  <div id=\"modal-preview\" class=\"fixed inset-0 z-[60] items-center justify-center p-4 bg-black/85 backdrop-blur-sm hidden overflow-y-auto\">\n    <div class=\"bg-slate-950 text-slate-100 border border-slate-800 rounded-2xl w-full max-w-3xl my-8 p-8 shadow-2xl flex flex-col max-h-[90vh]\">\n      <div class=\"flex items-center justify-between pb-4 border-b border-slate-800\">\n        <h4 class=\"text-sm font-bold text-white\">ตัวอย่างการแสดงผลบนหน้าเว็บไซต์ (Website Preview)</h4>\n        <button type=\"button\" onclick=\"closePreviewModal()\" class=\"text-slate-400 hover:text-white\">✕</button>\n      </div>\n      <div id=\"preview-container\" class=\"flex-1 overflow-y-auto py-6 space-y-6\"></div>\n    </div>\n  </div>\n\n  <!-- Navigation Modal -->\n  <div id=\"modal-nav\" class=\"fixed inset-0 z-50 items-center justify-center p-4 bg-black/75 backdrop-blur-sm hidden\">\n    <div class=\"bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4\">\n      <div class=\"flex items-center justify-between border-b border-slate-800 pb-3\">\n        <h4 id=\"modal-nav-title\" class=\"font-bold text-white text-sm\">เพิ่มเมนูหลักใหม่</h4>\n        <button type=\"button\" onclick=\"closeNavModal()\" class=\"text-slate-400 hover:text-white\">✕</button>\n      </div>\n      <form id=\"form-nav\" onsubmit=\"handleSaveNav(event)\" class=\"space-y-3\">\n        <input type=\"hidden\" id=\"nav_id\">\n        <div>\n          <label class=\"block text-xs font-medium text-slate-400 mb-1\">ชื่อเมนู (Label) *</label>\n          <input type=\"text\" id=\"nav_label\" required placeholder=\"เช่น บริการของเรา, ผลงาน, ติดต่อเรา\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500\">\n        </div>\n        <div>\n          <label class=\"block text-xs font-medium text-slate-400 mb-1\">URL Path *</label>\n          <input type=\"text\" id=\"nav_path\" required placeholder=\"เช่น /our-service หรือ https://...\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500\">\n        </div>\n        <div class=\"grid grid-cols-2 gap-3\">\n          <div>\n            <label class=\"block text-xs font-medium text-slate-400 mb-1\">ลำดับการแสดงผล</label>\n            <input type=\"number\" id=\"nav_sort_order\" value=\"1\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500\">\n          </div>\n          <div>\n            <label class=\"block text-xs font-medium text-slate-400 mb-1\">ประเภทลิงก์</label>\n            <select id=\"nav_is_external\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500\">\n              <option value=\"0\">หน้าภายในเว็บ (Page)</option>\n              <option value=\"1\">ลิงก์ภายนอก (External)</option>\n            </select>\n          </div>\n        </div>\n        <div>\n          <label class=\"flex items-center gap-2 cursor-pointer pt-2\">\n            <input type=\"checkbox\" id=\"nav_is_active\" checked class=\"rounded bg-slate-950 border-slate-800 text-blue-600\">\n            <span class=\"text-xs text-slate-300\">เปิดแสดงผลเมนูนี้บนหน้าเว็บไซต์</span>\n          </label>\n        </div>\n        <div class=\"flex items-center justify-end gap-2 pt-3 border-t border-slate-800\">\n          <button type=\"button\" onclick=\"closeNavModal()\" class=\"px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300\">ยกเลิก</button>\n          <button type=\"submit\" class=\"px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20\">บันทึกข้อมูล</button>\n        </div>\n      </form>\n    </div>\n  </div>\n\n  <!-- Client Logo Modal (With R2 Direct Upload) -->\n  <div id=\"modal-client\" class=\"fixed inset-0 z-50 items-center justify-center p-4 bg-black/75 backdrop-blur-sm hidden\">\n    <div class=\"bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4\">\n      <div class=\"flex items-center justify-between border-b border-slate-800 pb-3\">\n        <h4 class=\"font-bold text-white text-sm\">เพิ่มโลโก้ลูกค้าใหม่ (Upload to R2)</h4>\n        <button type=\"button\" onclick=\"closeClientModal()\" class=\"text-slate-400 hover:text-white\">✕</button>\n      </div>\n      <form id=\"form-client\" onsubmit=\"handleSaveClient(event)\" class=\"space-y-3\">\n        <div>\n          <label class=\"block text-xs font-medium text-slate-400 mb-1\">ชื่อลูกค้า/แบรนด์ *</label>\n          <input type=\"text\" id=\"client_name\" required placeholder=\"เช่น Cross Hotels & Resorts\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500\">\n        </div>\n        <div>\n          <label class=\"block text-xs font-medium text-slate-400 mb-1\">อัปโหลดไฟล์โลโก้ขึ้น Cloudflare R2 *</label>\n          <div id=\"dropzone_client_logo\" class=\"border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-5 text-center bg-slate-950/60 transition cursor-pointer relative\" onclick=\"document.getElementById('input_client_logo_file').click()\">\n            <input type=\"file\" id=\"input_client_logo_file\" accept=\"image/*\" class=\"hidden\" onchange=\"uploadClientLogoFile(this)\">\n            <div id=\"client_logo_placeholder\" class=\"space-y-1.5\">\n              <div class=\"text-2xl\">🏢</div>\n              <p class=\"text-xs font-semibold text-slate-300\">คลิกหรือลากไฟล์ภาพโลโก้มาวางที่นี่เพื่ออัปโหลด</p>\n              <p class=\"text-[11px] text-slate-500\">รองรับ SVG, PNG, WebP ขนาดไม่เกิน 5MB</p>\n            </div>\n            \n            <!-- Upload Progress Indicator Bar -->\n            <div id=\"client_logo_progress_wrap\" class=\"hidden py-3 space-y-1.5\">\n              <div class=\"flex items-center justify-between text-xs text-blue-400 font-bold\">\n                <span id=\"client_logo_progress_label\">กำลังอัปโหลดขึ้น Cloudflare R2...</span>\n                <span id=\"client_logo_progress_pct\">0%</span>\n              </div>\n              <div class=\"w-full bg-slate-800 rounded-full h-2 overflow-hidden\">\n                <div id=\"client_logo_progress_bar\" class=\"bg-blue-600 h-2 rounded-full transition-all duration-150\" style=\"width: 0%\"></div>\n              </div>\n            </div>\n\n            <div id=\"client_logo_preview\" class=\"mt-2 hidden\">\n              <img src=\"\" id=\"client_logo_preview_img\" class=\"h-12 max-w-full mx-auto object-contain p-2 rounded-lg bg-slate-900 border border-slate-800\" alt=\"Logo Preview\">\n              <div class=\"mt-1.5 text-[11px] font-bold text-emerald-400\">✓ อัปโหลดบน Cloudflare R2 สำเร็จ</div>\n            </div>\n          </div>\n          <input type=\"hidden\" id=\"client_logo_url\" required value=\"\">\n        </div>\n        <div>\n          <label class=\"block text-xs font-medium text-slate-400 mb-1\">เว็บไซต์ของลูกค้า (ถ้ามี)</label>\n          <input type=\"text\" id=\"client_website_url\" placeholder=\"https://...\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500\">\n        </div>\n        <div class=\"flex items-center justify-end gap-2 pt-3 border-t border-slate-800\">\n          <button type=\"button\" onclick=\"closeClientModal()\" class=\"px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300\">ยกเลิก</button>\n          <button type=\"submit\" class=\"px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20\">บันทึกโลโก้</button>\n        </div>\n      </form>\n    </div>\n  </div>\n\n  <!-- Note Modal -->\n  <div id=\"modal-note\" class=\"fixed inset-0 z-50 items-center justify-center p-4 bg-black/75 backdrop-blur-sm hidden\">\n    <div class=\"bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4\">\n      <div class=\"flex items-center justify-between border-b border-slate-800 pb-3\">\n        <div>\n          <h4 class=\"font-bold text-white text-sm\">จดบันทึกภายใน (Internal Notes)</h4>\n          <p id=\"note-customer-name\" class=\"text-[11px] text-blue-400 mt-0.5\"></p>\n        </div>\n        <button type=\"button\" onclick=\"closeNoteModal()\" class=\"text-slate-400 hover:text-white\">✕</button>\n      </div>\n      <form id=\"form-note\" onsubmit=\"handleSaveNote(event)\" class=\"space-y-3\">\n        <input type=\"hidden\" id=\"note_inquiry_id\">\n        <div>\n          <label class=\"block text-xs font-medium text-slate-400 mb-1\">บันทึกข้อความสำหรับทีมงานภายใน</label>\n          <textarea rows=\"4\" id=\"note_text\" placeholder=\"เช่น นัดคุยงานวันจันทร์ 10.00 น. หรือ ส่งใบเสนอราคาแล้ว\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500\"></textarea>\n        </div>\n        <div class=\"flex items-center justify-end gap-2 pt-3 border-t border-slate-800\">\n          <button type=\"button\" onclick=\"closeNoteModal()\" class=\"px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300\">ยกเลิก</button>\n          <button type=\"submit\" class=\"px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20\">บันทึกโน้ต</button>\n        </div>\n      </form>\n    </div>\n  </div>\n\n  <!-- ==================== CLIENT SCRIPTS (Pure DOM JS - Zero unsafe-eval) ==================== -->\n  <script>\n    const appState = {\n      currentTab: 'dashboard',\n      navMenus: [],\n      portfolios: [],\n      services: [],\n      articles: [],\n      clientLogos: [],\n      inquiries: [],\n      settingsMap: {},\n      editingType: null,\n      editingItem: null,\n      pages: [],\n      builderRows: [],\n      builderMode: 'visual'\n    };\n\n    function switchTab(tabId) {\n      const tabs = ['dashboard', 'navigation', 'pages', 'portfolios', 'services', 'articles', 'clients', 'inquiries', 'settings'];\n      tabs.forEach(function(t) {\n        const sec = document.getElementById('section-' + t);\n        const btn = document.getElementById('btn-tab-' + t);\n        if (sec) sec.classList.add('hidden');\n        if (btn) {\n          btn.classList.remove('active-nav');\n          btn.classList.add('text-slate-400');\n        }\n      });\n\n      const activeSec = document.getElementById('section-' + tabId);\n      const activeBtn = document.getElementById('btn-tab-' + tabId);\n      if (activeSec) activeSec.classList.remove('hidden');\n      if (activeBtn) {\n        activeBtn.classList.add('active-nav');\n        activeBtn.classList.remove('text-slate-400');\n      }\n\n      appState.currentTab = tabId;\n      const titles = {\n        'dashboard': 'Dashboard ภาพรวม',\n        'navigation': 'Navigation เมนูหลัก',\n        'pages': 'สร้างเพจใหม่ (Page Builder)',\n        'portfolios': 'Portfolios ผลงาน',\n        'services': 'Services บริการ',\n        'articles': 'บทความ & ข่าวสาร (Blog & Events)',\n        'clients': 'Client Logos โลโก้ลูกค้า',\n        'inquiries': 'Inquiries ข้อความติดต่อ',\n        'settings': 'Site Settings & SEO'\n      };\n      const titleEl = document.getElementById('currentTabTitle');\n      if (titleEl) titleEl.innerText = titles[tabId] || tabId;\n      refreshIcons();\n    }\n\n    function refreshIcons() {\n      setTimeout(function() {\n        if (window.lucide && typeof window.lucide.createIcons === 'function') {\n          window.lucide.createIcons();\n        }\n      }, 50);\n    }\n\n    async function loadAllData() {\n      try {\n        const [s, p, sv, a, cl, inq, nav, set, pg] = await Promise.all([\n          fetch('/api/admin/dashboard/stats').then(function(r) { return r.json(); }).catch(function() { return {}; }),\n          fetch('/api/admin/portfolios').then(function(r) { return r.json(); }).catch(function() { return {}; }),\n          fetch('/api/admin/services').then(function(r) { return r.json(); }).catch(function() { return {}; }),\n          fetch('/api/admin/articles').then(function(r) { return r.json(); }).catch(function() { return {}; }),\n          fetch('/api/admin/client-logos').then(function(r) { return r.json(); }).catch(function() { return {}; }),\n          fetch('/api/admin/inquiries').then(function(r) { return r.json(); }).catch(function() { return {}; }),\n          fetch('/api/admin/navigation').then(function(r) { return r.json(); }).catch(function() { return {}; }),\n          fetch('/api/admin/site-settings').then(function(r) { return r.json(); }).catch(function() { return {}; }),\n          fetch('/api/admin/pages').then(function(r) { return r.json(); }).catch(function() { return {}; })\n        ]);\n\n        if (s.data) renderDashboard(s.data);\n        if (nav.data) renderNavigation(nav.data);\n        if (p.data) renderPortfolios(p.data);\n        if (sv.data) renderServices(sv.data);\n        if (a.data) renderArticles(a.data);\n        if (cl.data) renderClientLogos(cl.data);\n        if (inq.data) renderInquiries(inq.data);\n        if (set.data) renderSettings(set.data);\n        if (pg.data) renderCustomPages(pg.data);\n\n        refreshIcons();\n      } catch (err) {\n        console.error('Error fetching CMS data:', err);\n      }\n    }\n\n    function renderDashboard(data) {\n      document.getElementById('stat-total-inquiries').innerText = data.total_inquiries || 0;\n      document.getElementById('stat-new-inquiries').innerText = data.new_inquiries || 0;\n      document.getElementById('stat-total-portfolios').innerText = data.total_portfolios || 0;\n      document.getElementById('stat-total-services').innerText = data.total_services || 0;\n      document.getElementById('stat-total-articles').innerText = data.total_articles || 0;\n\n      const badge = document.getElementById('badge-new-inquiries');\n      if (data.new_inquiries > 0) {\n        badge.innerText = data.new_inquiries;\n        badge.classList.remove('hidden');\n      } else {\n        badge.classList.add('hidden');\n      }\n\n      const tbody = document.getElementById('table-recent-inquiries');\n      if (!data.recent_inquiries || data.recent_inquiries.length === 0) {\n        tbody.innerHTML = '<tr><td colspan=\"5\" class=\"py-4 text-slate-500 text-center\">ยังไม่มีข้อความติดต่อ</td></tr>';\n        return;\n      }\n      tbody.innerHTML = data.recent_inquiries.map(function(inq) {\n        return '<tr class=\"hover:bg-slate-800/30\">' +\n          '<td class=\"py-3 font-medium text-white\">' + escapeHtml(inq.full_name) + '</td>' +\n          '<td class=\"py-3 text-slate-300\">' + escapeHtml(inq.company || '-') + '</td>' +\n          '<td class=\"py-3 text-slate-300\">' + escapeHtml(inq.service_interested || '-') + '</td>' +\n          '<td class=\"py-3\"><span class=\"px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20\">' + escapeHtml(inq.status) + '</span></td>' +\n          '<td class=\"py-3 text-slate-400\">' + new Date(inq.created_at).toLocaleDateString('th-TH') + '</td>' +\n        '</tr>';\n      }).join('');\n    }\n\n    function renderNavigation(items) {\n      appState.navMenus = items;\n      const tbody = document.getElementById('table-navigation');\n      if (!items || items.length === 0) {\n        tbody.innerHTML = '<tr><td colspan=\"6\" class=\"p-4 text-slate-500 text-center\">ยังไม่มีเมนู</td></tr>';\n        return;\n      }\n      tbody.innerHTML = items.map(function(item) {\n        const badgeExt = item.is_external ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20';\n        const labelExt = item.is_external ? 'ภายนอก (Link)' : 'ภายในเว็บ (Page)';\n        const badgeAct = item.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/20 text-slate-400 border-slate-500/30';\n        const labelAct = item.is_active ? 'เปิดใช้งาน' : 'ปิด';\n\n        return '<tr class=\"hover:bg-slate-800/30\">' +\n          '<td class=\"p-4 text-slate-400 font-semibold\">' + item.sort_order + '</td>' +\n          '<td class=\"p-4 font-bold text-white\">' + escapeHtml(item.label) + '</td>' +\n          '<td class=\"p-4 text-blue-400 font-mono text-[11px]\">' + escapeHtml(item.path) + '</td>' +\n          '<td class=\"p-4\"><span class=\"px-2 py-0.5 rounded-full text-[10px] font-semibold border ' + badgeExt + '\">' + labelExt + '</span></td>' +\n          '<td class=\"p-4\"><span class=\"px-2 py-0.5 rounded-full text-[10px] font-semibold border ' + badgeAct + '\">' + labelAct + '</span></td>' +\n          '<td class=\"p-4 text-right space-x-2\">' +\n            '<button type=\"button\" onclick=\"editNavMenu(' + item.id + ')\" class=\"p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white\"><i data-lucide=\"edit-3\" class=\"w-4 h-4\"></i></button>' +\n            '<button type=\"button\" onclick=\"deleteNavMenu(' + item.id + ')\" class=\"p-1.5 rounded-lg hover:bg-rose-900/30 text-rose-400\"><i data-lucide=\"trash-2\" class=\"w-4 h-4\"></i></button>' +\n          '</td>' +\n        '</tr>';\n      }).join('');\n    }\n\n    function renderPortfolios(items) {\n      appState.portfolios = items;\n      const grid = document.getElementById('grid-portfolios');\n      if (!items || items.length === 0) {\n        grid.innerHTML = '<div class=\"p-6 text-slate-500 text-xs\">ยังไม่มีผลงาน</div>';\n        return;\n      }\n      grid.innerHTML = items.map(function(item) {\n        const cover = item.cover_image || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b';\n        return '<div class=\"glass-card rounded-2xl overflow-hidden flex flex-col justify-between group\">' +\n          '<div class=\"relative overflow-hidden\">' +\n            '<img src=\"' + escapeHtml(cover) + '\" class=\"w-full h-44 object-cover group-hover:scale-105 transition duration-300\" alt=\"\">' +\n            '<span class=\"absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/80 text-white uppercase backdrop-blur\">' + escapeHtml(item.template_style || 'case-study') + '</span>' +\n          '</div>' +\n          '<div class=\"p-5 flex-1 flex flex-col justify-between space-y-3\">' +\n            '<div>' +\n              '<h4 class=\"font-bold text-sm text-white line-clamp-1\">' + escapeHtml(item.title) + '</h4>' +\n              '<p class=\"text-xs text-blue-400 mt-0.5\">' + escapeHtml(item.client_name || '') + '</p>' +\n              '<p class=\"text-xs text-slate-400 mt-2 line-clamp-2\">' + escapeHtml(item.summary || '') + '</p>' +\n            '</div>' +\n            '<div class=\"pt-3 border-t border-slate-800 flex items-center justify-between\">' +\n              '<button type=\"button\" onclick=\"openRichEditor(\\'portfolio\\', ' + item.id + ')\" class=\"text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center gap-1\"><i data-lucide=\"edit-3\" class=\"w-3.5 h-3.5\"></i><span>แก้ไขเนื้อหา</span></button>' +\n              '<button type=\"button\" onclick=\"deletePortfolio(' + item.id + ')\" class=\"text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1\"><i data-lucide=\"trash-2\" class=\"w-3.5 h-3.5\"></i><span>ลบ</span></button>' +\n            '</div>' +\n          '</div>' +\n        '</div>';\n      }).join('');\n    }\n\n    function renderServices(items) {\n      appState.services = items;\n      const grid = document.getElementById('grid-services');\n      if (!items || items.length === 0) {\n        grid.innerHTML = '<div class=\"p-6 text-slate-500 text-xs\">ยังไม่มีบริการ</div>';\n        return;\n      }\n      grid.innerHTML = items.map(function(svc) {\n        const bullets = Array.isArray(svc.bullet_points) ? svc.bullet_points : [];\n        const bulletsHtml = bullets.map(function(b) {\n          return '<div class=\"flex items-center gap-2\">' +\n            '<span class=\"text-blue-400 text-xs font-bold\">✓</span>' +\n            '<input type=\"text\" value=\"' + escapeHtml(b) + '\" class=\"svc-bullet-' + svc.id + ' flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200\">' +\n            '<button type=\"button\" onclick=\"this.parentElement.remove()\" class=\"text-rose-400 hover:text-rose-300 text-xs\">✕</button>' +\n          '</div>';\n        }).join('');\n\n        return '<div class=\"glass-card rounded-2xl p-6 space-y-4\">' +\n          '<div class=\"flex items-start justify-between\">' +\n            '<div>' +\n              '<h4 class=\"font-bold text-sm text-white\">' + escapeHtml(svc.title) + '</h4>' +\n              '<p class=\"text-xs text-blue-400 mt-0.5 font-mono\">' + escapeHtml(svc.slug) + '</p>' +\n            '</div>' +\n          '</div>' +\n          '<div>' +\n            '<label class=\"text-[11px] text-slate-400 block mb-1\">รูปภาพบริการ (R2 Image URL)</label>' +\n            '<div class=\"flex gap-2\">' +\n              '<input type=\"text\" id=\"svc_img_' + svc.id + '\" value=\"' + escapeHtml(svc.image_url || '') + '\" placeholder=\"https://... หรือ /media/uploads/...\" class=\"flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200\">' +\n              '<label class=\"px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 cursor-pointer shrink-0\">' +\n                '<span>อัปโหลด</span>' +\n                '<input type=\"file\" accept=\"image/*\" class=\"hidden\" onchange=\"uploadGenericFile(this, \\'svc_img_' + svc.id + '\\')\">' +\n              '</label>' +\n            '</div>' +\n          '</div>' +\n          '<div>' +\n            '<label class=\"text-[11px] text-slate-400 block mb-1\">Subtitle</label>' +\n            '<input type=\"text\" id=\"svc_subtitle_' + svc.id + '\" value=\"' + escapeHtml(svc.subtitle || '') + '\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200\">' +\n          '</div>' +\n          '<div>' +\n            '<label class=\"text-[11px] text-slate-400 block mb-1\">รายละเอียดบริการ</label>' +\n            '<textarea rows=\"2\" id=\"svc_desc_' + svc.id + '\" class=\"w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200\">' + escapeHtml(svc.description || '') + '</textarea>' +\n          '</div>' +\n          '<div>' +\n            '<div class=\"flex items-center justify-between mb-2\">' +\n              '<label class=\"text-[11px] text-slate-400\">รายการติ๊กถูก (Checkmark Features)</label>' +\n              '<button type=\"button\" onclick=\"addServiceBullet(' + svc.id + ')\" class=\"text-[10px] text-blue-400 hover:underline font-bold\">+ เพิ่มข้อ</button>' +\n            '</div>' +\n            '<div id=\"svc_bullets_container_' + svc.id + '\" class=\"space-y-1.5\">' + bulletsHtml + '</div>' +\n          '</div>' +\n          '<div class=\"flex justify-end pt-2 border-t border-slate-800\">' +\n            '<button type=\"button\" onclick=\"saveService(' + svc.id + ')\" class=\"px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20\">บันทึกการแก้ไขบริการ</button>' +\n          '</div>' +\n        '</div>';\n      }).join('');\n    }\n\n    function addServiceBullet(svcId) {\n      const container = document.getElementById('svc_bullets_container_' + svcId);\n      if (!container) return;\n      const div = document.createElement('div');\n      div.className = 'flex items-center gap-2';\n      div.innerHTML = '<span class=\"text-blue-400 text-xs font-bold\">✓</span>' +\n        '<input type=\"text\" placeholder=\"ระบุฟีเจอร์หรือบริการย่อย...\" class=\"svc-bullet-' + svcId + ' flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200\">' +\n        '<button type=\"button\" onclick=\"this.parentElement.remove()\" class=\"text-rose-400 hover:text-rose-300 text-xs\">✕</button>';\n      container.appendChild(div);\n    }\n\n    function renderArticles(items) {\n      appState.articles = items;\n      const tbody = document.getElementById('table-articles');\n      if (!items || items.length === 0) {\n        tbody.innerHTML = '<tr><td colspan=\"6\" class=\"p-4 text-slate-500 text-center\">ยังไม่มีบทความ</td></tr>';\n        return;\n      }\n      tbody.innerHTML = items.map(function(art) {\n        const cover = art.cover_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643';\n        const stBadge = art.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20';\n\n        return '<tr class=\"hover:bg-slate-800/30\">' +\n          '<td class=\"p-4\"><img src=\"' + escapeHtml(cover) + '\" class=\"w-12 h-10 object-cover rounded-lg\" alt=\"\"></td>' +\n          '<td class=\"p-4 font-bold text-white\">' + escapeHtml(art.title) + '</td>' +\n          '<td class=\"p-4\"><span class=\"px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20\">' + escapeHtml(art.template_style || 'standard') + '</span></td>' +\n          '<td class=\"p-4 text-slate-400\">' + new Date(art.published_at || art.created_at).toLocaleDateString('th-TH') + '</td>' +\n          '<td class=\"p-4\"><span class=\"px-2 py-0.5 rounded-full text-[10px] font-semibold ' + stBadge + '\">' + escapeHtml(art.status || 'published') + '</span></td>' +\n          '<td class=\"p-4 text-right space-x-2\">' +\n            '<button type=\"button\" onclick=\"openRichEditor(\\'article\\', ' + art.id + ')\" class=\"p-1.5 rounded-lg hover:bg-slate-800 text-blue-400\"><i data-lucide=\"edit-3\" class=\"w-4 h-4\"></i></button>' +\n            '<button type=\"button\" onclick=\"deleteArticle(' + art.id + ')\" class=\"p-1.5 rounded-lg hover:bg-rose-900/30 text-rose-400\"><i data-lucide=\"trash-2\" class=\"w-4 h-4\"></i></button>' +\n          '</td>' +\n        '</tr>';\n      }).join('');\n    }\n\n    function renderClientLogos(items) {\n      appState.clientLogos = items;\n      const grid = document.getElementById('grid-client-logos');\n      if (!items || items.length === 0) {\n        grid.innerHTML = '<div class=\"p-4 text-slate-500 text-xs\">ยังไม่มีโลโก้ลูกค้า</div>';\n        return;\n      }\n      grid.innerHTML = items.map(function(cl) {\n        return '<div class=\"glass-card rounded-xl p-4 flex flex-col items-center justify-center text-center relative group\">' +\n          '<button type=\"button\" onclick=\"deleteClientLogo(' + cl.id + ')\" class=\"absolute top-2 right-2 text-rose-400 hover:text-rose-300\">✕</button>' +\n          '<img src=\"' + escapeHtml(cl.logo_url) + '\" class=\"h-10 object-contain mb-2 opacity-80 group-hover:opacity-100\" alt=\"\">' +\n          '<span class=\"text-xs font-medium text-slate-300\">' + escapeHtml(cl.name) + '</span>' +\n        '</div>';\n      }).join('');\n    }\n\n    function renderInquiries(items) {\n      appState.inquiries = items;\n      const tbody = document.getElementById('table-inquiries');\n      if (!items || items.length === 0) {\n        tbody.innerHTML = '<tr><td colspan=\"6\" class=\"p-4 text-slate-500 text-center\">ยังไม่มีข้อความติดต่อ</td></tr>';\n        return;\n      }\n      tbody.innerHTML = items.map(function(inq) {\n        const noteHtml = inq.admin_notes ? '<div class=\"mt-1 p-1.5 rounded bg-blue-950/60 border border-blue-800/40 text-[11px] text-blue-300 font-medium\">📌 โน้ต: ' + escapeHtml(inq.admin_notes) + '</div>' : '';\n        const stBadge = inq.status === 'new' ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20';\n\n        return '<tr>' +\n          '<td class=\"p-4 font-semibold text-white\">' + escapeHtml(inq.full_name) + '</td>' +\n          '<td class=\"p-4 text-slate-300\"><div>' + escapeHtml(inq.email) + '</div><div class=\"text-[11px] text-blue-400\">' + escapeHtml(inq.phone) + '</div></td>' +\n          '<td class=\"p-4 text-slate-300 max-w-xs\"><div class=\"line-clamp-2\">' + escapeHtml(inq.message) + '</div>' + noteHtml + '</td>' +\n          '<td class=\"p-4 text-slate-400 font-mono text-[11px]\">' + escapeHtml(inq.source_page || '/contact-us') + '</td>' +\n          '<td class=\"p-4\"><span class=\"px-2 py-0.5 rounded-full text-[10px] font-semibold border ' + stBadge + '\">' + escapeHtml(inq.status) + '</span></td>' +\n          '<td class=\"p-4 text-right space-x-2\">' +\n            '<button type=\"button\" onclick=\"openNoteModal(' + inq.id + ', \\'' + escapeQuote(inq.full_name) + '\\', \\'' + escapeQuote(inq.admin_notes || '') + '\\')\" class=\"px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition\">📝 โน้ต</button>' +\n            '<select onchange=\"updateInquiryStatus(' + inq.id + ', this.value)\" class=\"bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200\">' +\n              '<option value=\"new\" ' + (inq.status === 'new' ? 'selected' : '') + '>New</option>' +\n              '<option value=\"in_progress\" ' + (inq.status === 'in_progress' ? 'selected' : '') + '>In Progress</option>' +\n              '<option value=\"contacted\" ' + (inq.status === 'contacted' ? 'selected' : '') + '>Contacted</option>' +\n              '<option value=\"closed\" ' + (inq.status === 'closed' ? 'selected' : '') + '>Closed</option>' +\n            '</select>' +\n          '</td>' +\n        '</tr>';\n      }).join('');\n    }\n\n    function renderSettings(items) {\n      const map = {};\n      items.forEach(function(i) { map[i.key] = i.value; });\n      appState.settingsMap = map;\n\n      const setVal = function(id, val) {\n        const el = document.getElementById(id);\n        if (el) el.value = val || '';\n      };\n\n      setVal('setting_company_name', map.company_name);\n      setVal('setting_phone', map.phone);\n      setVal('setting_email', map.email);\n      setVal('setting_line_oa', map.line_oa);\n      setVal('setting_address', map.address);\n      setVal('setting_working_hours', map.working_hours);\n\n      setVal('setting_social_facebook', map.social_facebook);\n      setVal('setting_social_instagram', map.social_instagram);\n      setVal('setting_social_tiktok', map.social_tiktok);\n      setVal('setting_social_youtube', map.social_youtube);\n\n      setVal('setting_site_title', map.site_title);\n      setVal('setting_site_description', map.site_description);\n      setVal('setting_og_image', map.og_image);\n      setVal('setting_google_verification', map.google_verification);\n\n      setVal('setting_gtm_id', map.gtm_id);\n      setVal('setting_ga4_id', map.ga4_id);\n      setVal('setting_fb_pixel_id', map.fb_pixel_id);\n    }\n\n    // ==================== RICH CONTENT EDITOR LOGIC (Matching Image 2) ====================\n    function openRichEditor(type, id) {\n      appState.editingType = type;\n      appState.editingItem = null;\n\n      document.getElementById('editor_target_type').value = type;\n      document.getElementById('editor_item_id').value = id || '';\n\n      switchEditorLang('th');\n\n      if (id) {\n        const list = type === 'portfolio' ? appState.portfolios : appState.articles;\n        const item = list.find(function(x) { return x.id === id; });\n        if (item) {\n          appState.editingItem = item;\n          document.getElementById('editor_title_th').value = item.title || '';\n          document.getElementById('editor_title_en').value = item.title_en || '';\n          document.getElementById('editor_summary_th').value = item.summary || '';\n          document.getElementById('editor_summary_en').value = item.summary_en || '';\n          document.getElementById('editor_content_th').innerHTML = item.details || item.content || '';\n          document.getElementById('editor_content_en').innerHTML = item.details_en || item.content_en || '';\n\n          let tagsMeta = {};\n          try {\n            tagsMeta = typeof item.tags_meta === 'object' ? item.tags_meta : JSON.parse(item.tags_meta || '{}');\n          } catch(e) {}\n\n          document.getElementById('tag_service').value = tagsMeta.service || tagsMeta.type || '';\n          document.getElementById('tag_industry').value = tagsMeta.industry || tagsMeta.country || '';\n          document.getElementById('tag_platform').value = tagsMeta.platform || tagsMeta.destination || '';\n          document.getElementById('tag_target').value = tagsMeta.target_audience || tagsMeta.transportation || '';\n          document.getElementById('tag_objective').value = tagsMeta.objective || tagsMeta.location_name || '';\n          document.getElementById('tag_format').value = tagsMeta.format || tagsMeta.activity || '';\n\n          document.getElementById('editor_cover_url').value = item.cover_image || '';\n          if (item.cover_image) {\n            document.getElementById('cover_placeholder').classList.add('hidden');\n            document.getElementById('cover_preview_box').classList.remove('hidden');\n            document.getElementById('cover_preview_img').src = item.cover_image;\n          } else {\n            removeCoverImage();\n          }\n\n          document.getElementById('editor_travel_date').value = item.travel_date || (item.published_at ? item.published_at.substring(0, 10) : '');\n          document.getElementById('editor_video_url').value = item.video_url || '';\n          document.getElementById('editor_map_coords').value = item.map_coords || '';\n          document.getElementById('editor_template_style').value = item.template_style || (type === 'portfolio' ? 'case-study' : 'standard');\n          document.getElementById('editor_custom_instruction').value = item.custom_instruction || '';\n          document.getElementById('editor_status').value = item.status || 'published';\n\n          document.getElementById('modal-rich-editor').classList.remove('hidden');\n          document.getElementById('modal-rich-editor').classList.add('flex');\n          return;\n        }\n      }\n\n      // New item reset\n      document.getElementById('editor_title_th').value = '';\n      document.getElementById('editor_title_en').value = '';\n      document.getElementById('editor_summary_th').value = '';\n      document.getElementById('editor_summary_en').value = '';\n      document.getElementById('editor_content_th').innerHTML = '';\n      document.getElementById('editor_content_en').innerHTML = '';\n\n      document.getElementById('tag_service').value = '';\n      document.getElementById('tag_industry').value = '';\n      document.getElementById('tag_platform').value = '';\n      document.getElementById('tag_target').value = '';\n      document.getElementById('tag_objective').value = '';\n      document.getElementById('tag_format').value = '';\n\n      removeCoverImage();\n      document.getElementById('editor_travel_date').value = new Date().toISOString().substring(0, 10);\n      document.getElementById('editor_video_url').value = '';\n      document.getElementById('editor_map_coords').value = '';\n      document.getElementById('editor_template_style').value = type === 'portfolio' ? 'case-study' : 'standard';\n      document.getElementById('editor_custom_instruction').value = '';\n      document.getElementById('editor_status').value = 'published';\n\n      document.getElementById('modal-rich-editor').classList.remove('hidden');\n      document.getElementById('modal-rich-editor').classList.add('flex');\n    }\n\n    function closeRichEditor() {\n      document.getElementById('modal-rich-editor').classList.add('hidden');\n      document.getElementById('modal-rich-editor').classList.remove('flex');\n    }\n\n    function switchEditorLang(lang) {\n      const thSec = document.getElementById('editor-fields-th');\n      const enSec = document.getElementById('editor-fields-en');\n      const thBtn = document.getElementById('tab-lang-th');\n      const enBtn = document.getElementById('tab-lang-en');\n\n      if (lang === 'th') {\n        thSec.classList.remove('hidden');\n        enSec.classList.add('hidden');\n        thBtn.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white';\n        enBtn.className = 'px-3 py-1 rounded-lg text-xs font-medium bg-slate-200 text-slate-700';\n      } else {\n        thSec.classList.add('hidden');\n        enSec.classList.remove('hidden');\n        thBtn.className = 'px-3 py-1 rounded-lg text-xs font-medium bg-slate-200 text-slate-700';\n        enBtn.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white';\n      }\n    }\n\n    function execCmd(command, val) {\n      document.execCommand(command, false, val || null);\n    }\n\n    function toggleHeading() {\n      const format = document.queryCommandValue('formatBlock');\n      if (format === 'h2') {\n        document.execCommand('formatBlock', false, '<h3>');\n      } else if (format === 'h3') {\n        document.execCommand('formatBlock', false, '<p>');\n      } else {\n        document.execCommand('formatBlock', false, '<h2>');\n      }\n    }\n\n    function insertLinkPrompt() {\n      const url = prompt('ระบุ URL ลิงก์:', 'https://');\n      if (url) execCmd('createLink', url);\n    }\n\n    function promptInsertVideo() {\n      const video = prompt('ใส่ YouTube Link หรือ Video URL:');\n      if (!video) return;\n      document.getElementById('editor_video_url').value = video;\n      let embedHtml = '';\n      if (video.includes('youtube.com') || video.includes('youtu.be')) {\n        let videoId = '';\n        if (video.includes('v=')) videoId = video.split('v=')[1].split('&')[0];\n        else if (video.includes('youtu.be/')) videoId = video.split('youtu.be/')[1].split('?')[0];\n        if (videoId) {\n          embedHtml = '<div class=\"my-4 aspect-video rounded-2xl overflow-hidden shadow\"><iframe class=\"w-full h-full\" src=\"https://www.youtube.com/embed/' + videoId + '\" frameborder=\"0\" allowfullscreen></iframe></div><p><br></p>';\n        }\n      }\n      if (embedHtml) {\n        document.getElementById('editor_content_th').focus();\n        execCmd('insertHTML', embedHtml);\n      } else {\n        alert('บันทึกลิงก์วิดีโอไว้ที่ช่อง YouTube Video เรียบร้อย');\n      }\n    }\n\n    function promptInsertMap() {\n      const coords = prompt('ระบุพิกัด ละติจูด,ลองจิจูด (เช่น 13.7563, 100.5018) หรือ Embed Iframe:');\n      if (!coords) return;\n      document.getElementById('editor_map_coords').value = coords;\n      alert('บันทึกพิกัดแผนที่เรียบร้อย');\n    }\n\n    // Universal Upload with Progress Tracking\n    function uploadFileWithProgress(file, callbacks) {\n      if (!file) return;\n      const onProgress = callbacks && callbacks.onProgress;\n      const onSuccess = callbacks && callbacks.onSuccess;\n      const onError = callbacks && callbacks.onError;\n\n      const xhr = new XMLHttpRequest();\n      const fd = new FormData();\n      fd.append('file', file);\n\n      xhr.upload.addEventListener('progress', function(e) {\n        if (e.lengthComputable && onProgress) {\n          const percent = Math.round((e.loaded / e.total) * 100);\n          onProgress(percent);\n        }\n      });\n\n      xhr.addEventListener('load', function() {\n        if (xhr.status >= 200 && xhr.status < 300) {\n          try {\n            const data = JSON.parse(xhr.responseText);\n            if (data.success && data.file_url) {\n              if (onSuccess) onSuccess(data.file_url, data);\n            } else {\n              if (onError) onError(data.error || 'อัปโหลดล้มเหลว');\n            }\n          } catch (e) {\n            if (onError) onError('รูปแบบการตอบกลับไม่ถูกต้อง');\n          }\n        } else {\n          if (onError) onError('HTTP ' + xhr.status + ': อัปโหลดล้มเหลว');\n        }\n      });\n\n      xhr.addEventListener('error', function() {\n        if (onError) onError('เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย');\n      });\n\n      xhr.open('POST', '/api/admin/media/upload');\n      xhr.send(fd);\n    }\n\n    function uploadCoverImage(input) {\n      const file = input.files && input.files[0];\n      if (file) uploadCoverFile(file);\n    }\n\n    function uploadCoverFile(file) {\n      if (!file) return;\n      const wrap = document.getElementById('cover_progress_wrap');\n      const bar = document.getElementById('cover_progress_bar');\n      const pct = document.getElementById('cover_progress_pct');\n      const placeholder = document.getElementById('cover_placeholder');\n      const previewBox = document.getElementById('cover_preview_box');\n\n      wrap.classList.remove('hidden');\n      placeholder.classList.add('hidden');\n      previewBox.classList.add('hidden');\n      bar.style.width = '0%';\n      pct.innerText = '0%';\n\n      uploadFileWithProgress(file, {\n        onProgress: function(percent) {\n          bar.style.width = percent + '%';\n          pct.innerText = percent + '%';\n        },\n        onSuccess: function(fileUrl) {\n          bar.style.width = '100%';\n          pct.innerText = '100%';\n          setTimeout(function() {\n            wrap.classList.add('hidden');\n            document.getElementById('editor_cover_url').value = fileUrl;\n            document.getElementById('cover_preview_box').classList.remove('hidden');\n            document.getElementById('cover_preview_img').src = fileUrl;\n          }, 400);\n        },\n        onError: function(err) {\n          wrap.classList.add('hidden');\n          placeholder.classList.remove('hidden');\n          alert('อัปโหลดภาพปกไม่สำเร็จ: ' + err);\n        }\n      });\n    }\n\n    function removeCoverImage() {\n      document.getElementById('editor_cover_url').value = '';\n      document.getElementById('cover_preview_img').src = '';\n      document.getElementById('cover_preview_box').classList.add('hidden');\n      document.getElementById('cover_placeholder').classList.remove('hidden');\n    }\n\n    function uploadAndInsertImage(input) {\n      const file = input.files && input.files[0];\n      if (file) insertImageIntoContent(file);\n    }\n\n    function insertImageIntoContent(file) {\n      if (!file) return;\n      showEditorUploadPill('กำลังอัปโหลดภาพลงเนื้อหา... 0%');\n\n      uploadFileWithProgress(file, {\n        onProgress: function(percent) {\n          showEditorUploadPill('กำลังอัปโหลดภาพลงเนื้อหา... ' + percent + '%');\n        },\n        onSuccess: function(fileUrl) {\n          showEditorUploadPill('✓ อัปโหลดภาพสำเร็จ!');\n          setTimeout(hideEditorUploadPill, 1200);\n\n          const imgHtml = '<figure class=\"my-4\"><img src=\"' + fileUrl + '\" class=\"rounded-2xl max-w-full mx-auto shadow\" alt=\"\"><figcaption class=\"text-xs text-center text-slate-400 mt-1.5\"></figcaption></figure><p><br></p>';\n          const target = appState.editorLang === 'en' ? document.getElementById('editor_content_en') : document.getElementById('editor_content_th');\n          target.focus();\n          execCmd('insertHTML', imgHtml);\n        },\n        onError: function(err) {\n          hideEditorUploadPill();\n          alert('อัปโหลดภาพลงบทความล้มเหลว: ' + err);\n        }\n      });\n    }\n\n    function showEditorUploadPill(text) {\n      const pill = document.getElementById('editor_upload_pill');\n      const pillText = document.getElementById('editor_upload_pill_text');\n      if (pill && pillText) {\n        pillText.innerText = text;\n        pill.classList.remove('hidden');\n      }\n    }\n\n    function hideEditorUploadPill() {\n      const pill = document.getElementById('editor_upload_pill');\n      if (pill) pill.classList.add('hidden');\n    }\n\n    async function runAiTranslate() {\n      const btn = document.getElementById('btn-ai-translate');\n      btn.innerText = '⏳ กำลังแปลภาษาด้วย AI...';\n      btn.disabled = true;\n\n      const title = document.getElementById('editor_title_th').value;\n      const summary = document.getElementById('editor_summary_th').value;\n      const content = document.getElementById('editor_content_th').innerText;\n      const tagsMeta = {\n        service: document.getElementById('tag_service').value,\n        industry: document.getElementById('tag_industry').value,\n        platform: document.getElementById('tag_platform').value,\n        target_audience: document.getElementById('tag_target').value,\n        objective: document.getElementById('tag_objective').value,\n        format: document.getElementById('tag_format').value,\n        country: document.getElementById('tag_industry').value,\n        type: document.getElementById('tag_service').value,\n        destination: document.getElementById('tag_platform').value,\n        transportation: document.getElementById('tag_target').value,\n        location_name: document.getElementById('tag_objective').value,\n        activity: document.getElementById('tag_format').value\n      };\n\n      try {\n        const res = await fetch('/api/admin/translate', {\n          method: 'POST',\n          headers: { 'Content-Type': 'application/json' },\n          body: JSON.stringify({ fields: { title, summary, content, tags_meta: tagsMeta } })\n        });\n        const resData = await res.json();\n        if (resData.success && resData.data) {\n          const d = resData.data;\n          document.getElementById('editor_title_en').value = d.title_en || '';\n          document.getElementById('editor_summary_en').value = d.summary_en || '';\n          document.getElementById('editor_content_en').innerHTML = (d.content_en || '').replace(/\\n/g, '<br>');\n          switchEditorLang('en');\n          alert('แปลภาษาอังกฤษสำเร็จ! คุณสามารถตรวจสอบและปรับแก้คำแปลในแท็บภาษาอังกฤษได้เลยครับ');\n        } else {\n          alert('การแปลล้มเหลว กรุณาลองใหม่อีกครั้ง');\n        }\n      } catch (e) {\n        alert('เกิดข้อผิดพลาด: ' + e.message);\n      } finally {\n        btn.innerText = '🤖 AI แปลเป็นภาษาอังกฤษอัตโนมัติ';\n        btn.disabled = false;\n      }\n    }\n\n    async function handleSaveRichEditor() {\n      const type = document.getElementById('editor_target_type').value;\n      const id = document.getElementById('editor_item_id').value;\n\n      const title = document.getElementById('editor_title_th').value;\n      if (!title) {\n        alert('กรุณาระบุชื่อบันทึก / หัวข้อ');\n        return;\n      }\n\n      const tagsMeta = {\n        service: document.getElementById('tag_service').value,\n        industry: document.getElementById('tag_industry').value,\n        platform: document.getElementById('tag_platform').value,\n        target_audience: document.getElementById('tag_target').value,\n        objective: document.getElementById('tag_objective').value,\n        format: document.getElementById('tag_format').value,\n        country: document.getElementById('tag_industry').value,\n        type: document.getElementById('tag_service').value,\n        destination: document.getElementById('tag_platform').value,\n        transportation: document.getElementById('tag_target').value,\n        location_name: document.getElementById('tag_objective').value,\n        activity: document.getElementById('tag_format').value\n      };\n\n      const payload = {\n        title: title,\n        title_en: document.getElementById('editor_title_en').value,\n        summary: document.getElementById('editor_summary_th').value,\n        summary_en: document.getElementById('editor_summary_en').value,\n        content: document.getElementById('editor_content_th').innerHTML,\n        content_en: document.getElementById('editor_content_en').innerHTML,\n        details: document.getElementById('editor_content_th').innerHTML,\n        details_en: document.getElementById('editor_content_en').innerHTML,\n        cover_image: document.getElementById('editor_cover_url').value || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',\n        tags_meta: tagsMeta,\n        travel_date: document.getElementById('editor_travel_date').value,\n        video_url: document.getElementById('editor_video_url').value,\n        map_coords: document.getElementById('editor_map_coords').value,\n        template_style: document.getElementById('editor_template_style').value,\n        custom_instruction: document.getElementById('editor_custom_instruction').value,\n        status: document.getElementById('editor_status').value,\n        client_name: tagsMeta.location_name || 'LTT Client',\n        category_slug: tagsMeta.type ? tagsMeta.type.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'general'\n      };\n\n      const url = type === 'portfolio'\n        ? (id ? '/api/admin/portfolios/' + id : '/api/admin/portfolios')\n        : (id ? '/api/admin/articles/' + id : '/api/admin/articles');\n\n      const method = id ? 'PUT' : 'POST';\n\n      try {\n        const res = await fetch(url, {\n          method,\n          headers: { 'Content-Type': 'application/json' },\n          body: JSON.stringify(payload)\n        });\n        const d = await res.json();\n        if (d.success) {\n          alert('บันทึกข้อมูลเรียบร้อยแล้ว!');\n          closeRichEditor();\n          await loadAllData();\n      setupDragAndDropHandlers();\n        } else {\n          alert('เกิดข้อผิดพลาด: ' + (d.error || 'กรุณาลองใหม่'));\n        }\n      } catch (err) {\n        alert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);\n      }\n    }\n\n    function previewEditorContent() {\n      const title = document.getElementById('editor_title_th').value || 'หัวข้อตัวอย่าง';\n      const summary = document.getElementById('editor_summary_th').value;\n      const content = document.getElementById('editor_content_th').innerHTML;\n      const cover = document.getElementById('editor_cover_url').value;\n      const date = document.getElementById('editor_travel_date').value;\n      const template = document.getElementById('editor_template_style').value;\n      const video = document.getElementById('editor_video_url').value;\n\n      const container = document.getElementById('preview-container');\n      container.innerHTML = '<div>' +\n        '<span class=\"px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase\">' + escapeHtml(template) + '</span>' +\n        '<h1 class=\"text-2xl font-bold text-white mt-3\">' + escapeHtml(title) + '</h1>' +\n        (date ? '<p class=\"text-xs text-slate-400 mt-1\">วันที่: ' + escapeHtml(date) + '</p>' : '') +\n      '</div>' +\n      (cover ? '<img src=\"' + escapeHtml(cover) + '\" class=\"w-full max-h-80 object-cover rounded-2xl shadow\" alt=\"\">' : '') +\n      (summary ? '<p class=\"text-sm text-slate-300 italic border-l-2 border-blue-500 pl-4 py-1\">' + escapeHtml(summary) + '</p>' : '') +\n      (video ? '<div class=\"p-3 bg-slate-900 rounded-xl text-xs text-blue-400\">▶️ วิดีโอ: ' + escapeHtml(video) + '</div>' : '') +\n      '<div class=\"prose prose-invert max-w-none text-sm text-slate-200 leading-relaxed pt-2\">' + content + '</div>';\n\n      document.getElementById('modal-preview').classList.remove('hidden');\n      document.getElementById('modal-preview').classList.add('flex');\n    }\n\n    function closePreviewModal() {\n      document.getElementById('modal-preview').classList.add('hidden');\n      document.getElementById('modal-preview').classList.remove('flex');\n    }\n\n    function openNavModal(id) {\n      document.getElementById('modal-nav').classList.remove('hidden');\n      document.getElementById('modal-nav').classList.add('flex');\n      if (id) {\n        const item = appState.navMenus.find(function(m) { return m.id === id; });\n        if (item) {\n          document.getElementById('modal-nav-title').innerText = 'แก้ไขเมนูหลัก';\n          document.getElementById('nav_id').value = item.id;\n          document.getElementById('nav_label').value = item.label;\n          document.getElementById('nav_path').value = item.path;\n          document.getElementById('nav_sort_order').value = item.sort_order;\n          document.getElementById('nav_is_external').value = item.is_external || 0;\n          document.getElementById('nav_is_active').checked = item.is_active == 1;\n          return;\n        }\n      }\n      document.getElementById('modal-nav-title').innerText = 'เพิ่มเมนูหลักใหม่';\n      document.getElementById('nav_id').value = '';\n      document.getElementById('nav_label').value = '';\n      document.getElementById('nav_path').value = '/';\n      document.getElementById('nav_sort_order').value = (appState.navMenus.length + 1);\n      document.getElementById('nav_is_external').value = '0';\n      document.getElementById('nav_is_active').checked = true;\n    }\n    function editNavMenu(id) { openNavModal(id); }\n    function closeNavModal() {\n      document.getElementById('modal-nav').classList.add('hidden');\n      document.getElementById('modal-nav').classList.remove('flex');\n    }\n\n    function openClientModal() {\n      document.getElementById('client_name').value = '';\n      document.getElementById('client_logo_url').value = '';\n      document.getElementById('client_website_url').value = '';\n      document.getElementById('client_logo_preview').classList.add('hidden');\n      document.getElementById('modal-client').classList.remove('hidden');\n      document.getElementById('modal-client').classList.add('flex');\n    }\n    function closeClientModal() {\n      document.getElementById('modal-client').classList.add('hidden');\n      document.getElementById('modal-client').classList.remove('flex');\n    }\n\n    function uploadClientLogoFile(input) {\n      const file = input.files && input.files[0];\n      if (file) uploadClientLogoDrop(file);\n    }\n\n    function uploadClientLogoDrop(file) {\n      if (!file) return;\n      const wrap = document.getElementById('client_logo_progress_wrap');\n      const bar = document.getElementById('client_logo_progress_bar');\n      const pct = document.getElementById('client_logo_progress_pct');\n      const placeholder = document.getElementById('client_logo_placeholder');\n      const previewBox = document.getElementById('client_logo_preview');\n\n      wrap.classList.remove('hidden');\n      placeholder.classList.add('hidden');\n      previewBox.classList.add('hidden');\n      bar.style.width = '0%';\n      pct.innerText = '0%';\n\n      uploadFileWithProgress(file, {\n        onProgress: function(percent) {\n          bar.style.width = percent + '%';\n          pct.innerText = percent + '%';\n        },\n        onSuccess: function(fileUrl) {\n          bar.style.width = '100%';\n          pct.innerText = '100%';\n          setTimeout(function() {\n            wrap.classList.add('hidden');\n            document.getElementById('client_logo_url').value = fileUrl;\n            previewBox.classList.remove('hidden');\n            document.getElementById('client_logo_preview_img').src = fileUrl;\n          }, 350);\n        },\n        onError: function(err) {\n          wrap.classList.add('hidden');\n          placeholder.classList.remove('hidden');\n          alert('อัปโหลดโลโก้ล้มเหลว: ' + err);\n        }\n      });\n    }\n\n    async function uploadGenericFile(input, targetInputId) {\n      const file = input.files && input.files[0];\n      if (!file) return;\n      const fd = new FormData();\n      fd.append('file', file);\n      try {\n        const res = await fetch('/api/admin/media/upload', { method: 'POST', body: fd });\n        const data = await res.json();\n        if (data.success && data.file_url) {\n          const el = document.getElementById(targetInputId);\n          if (el) el.value = data.file_url;\n          alert('อัปโหลดไฟล์ขึ้น R2 สำเร็จ!');\n        } else {\n          alert('อัปโหลดล้มเหลว: ' + (data.error || 'กรุณาลองใหม่'));\n        }\n      } catch (e) {\n        alert('เกิดข้อผิดพลาด: ' + e.message);\n      }\n    }\n\n    function openNoteModal(id, customerName, notes) {\n      document.getElementById('modal-note').classList.remove('hidden');\n      document.getElementById('modal-note').classList.add('flex');\n      document.getElementById('note_inquiry_id').value = id;\n      document.getElementById('note-customer-name').innerText = 'ลูกค้า: ' + customerName;\n      document.getElementById('note_text').value = notes || '';\n    }\n    function closeNoteModal() {\n      document.getElementById('modal-note').classList.add('hidden');\n      document.getElementById('modal-note').classList.remove('flex');\n    }\n\n    async function handleSaveNav(e) {\n      e.preventDefault();\n      const id = document.getElementById('nav_id').value;\n      const payload = {\n        label: document.getElementById('nav_label').value,\n        path: document.getElementById('nav_path').value,\n        sort_order: Number(document.getElementById('nav_sort_order').value) || 1,\n        is_external: Number(document.getElementById('nav_is_external').value),\n        is_active: document.getElementById('nav_is_active').checked ? 1 : 0\n      };\n      const url = id ? '/api/admin/navigation/' + id : '/api/admin/navigation';\n      const method = id ? 'PUT' : 'POST';\n\n      await fetch(url, {\n        method,\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify(payload)\n      });\n      closeNavModal();\n      await loadAllData();\n    }\n\n    async function deleteNavMenu(id) {\n      if (!confirm('ยืนยันลบเมนูนี้ออกจาก Navigation?')) return;\n      await fetch('/api/admin/navigation/' + id, { method: 'DELETE' });\n      await loadAllData();\n    }\n\n    async function deletePortfolio(id) {\n      if (!confirm('ยืนยันลบผลงานนี้?')) return;\n      await fetch('/api/admin/portfolios/' + id, { method: 'DELETE' });\n      await loadAllData();\n    }\n\n    async function saveService(id) {\n      const subtitle = document.getElementById('svc_subtitle_' + id).value;\n      const desc = document.getElementById('svc_desc_' + id).value;\n      const img = document.getElementById('svc_img_' + id).value;\n\n      const bulletInputs = document.querySelectorAll('.svc-bullet-' + id);\n      const bullets = [];\n      bulletInputs.forEach(function(i) { if (i.value.trim()) bullets.push(i.value.trim()); });\n\n      await fetch('/api/admin/services/' + id, {\n        method: 'PUT',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ subtitle, description: desc, image_url: img, bullet_points: bullets })\n      });\n      alert('บันทึกข้อมูลบริการเรียบร้อย');\n      await loadAllData();\n    }\n\n    async function deleteArticle(id) {\n      if (!confirm('ยืนยันลบบทความนี้?')) return;\n      await fetch('/api/admin/articles/' + id, { method: 'DELETE' });\n      await loadAllData();\n    }\n\n    async function handleSaveClient(e) {\n      e.preventDefault();\n      const payload = {\n        name: document.getElementById('client_name').value,\n        logo_url: document.getElementById('client_logo_url').value,\n        website_url: document.getElementById('client_website_url').value,\n        sort_order: appState.clientLogos.length + 1\n      };\n      await fetch('/api/admin/client-logos', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify(payload)\n      });\n      closeClientModal();\n      await loadAllData();\n    }\n\n    async function deleteClientLogo(id) {\n      if (!confirm('ยืนยันลบลูกค้ารายนี้?')) return;\n      await fetch('/api/admin/client-logos/' + id, { method: 'DELETE' });\n      await loadAllData();\n    }\n\n    async function handleSaveNote(e) {\n      e.preventDefault();\n      const id = document.getElementById('note_inquiry_id').value;\n      const note = document.getElementById('note_text').value;\n      await fetch('/api/admin/inquiries/' + id + '/notes', {\n        method: 'PATCH',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ notes: note })\n      });\n      closeNoteModal();\n      await loadAllData();\n    }\n\n    async function updateInquiryStatus(id, st) {\n      await fetch('/api/admin/inquiries/' + id + '/status', {\n        method: 'PATCH',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ status: st })\n      });\n      await loadAllData();\n    }\n\n    async function handleSaveSettings(e) {\n      e.preventDefault();\n      const fields = [\n        'company_name', 'phone', 'email', 'line_oa', 'address', 'working_hours',\n        'social_facebook', 'social_instagram', 'social_tiktok', 'social_youtube',\n        'site_title', 'site_description', 'og_image', 'google_verification',\n        'gtm_id', 'ga4_id', 'fb_pixel_id'\n      ];\n      const list = fields.map(function(k) {\n        return {\n          key: k,\n          value: (document.getElementById('setting_' + k) ? document.getElementById('setting_' + k).value : '')\n        };\n      });\n\n      await fetch('/api/admin/site-settings', {\n        method: 'PUT',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ settings: list })\n      });\n      alert('บันทึกการตั้งค่าเว็บไซต์เรียบร้อย');\n    }\n\n    function escapeHtml(str) {\n      if (!str) return '';\n      return String(str)\n        .replace(/&/g, '&amp;')\n        .replace(/</g, '&lt;')\n        .replace(/>/g, '&gt;')\n        .replace(/\"/g, '&quot;')\n        .replace(/'/g, '&#39;');\n    }\n\n    function escapeQuote(str) {\n      if (!str) return '';\n      return String(str).replace(/'/g, \"\\\\'\");\n    }\n\n    document.addEventListener('DOMContentLoaded', function() {\n      loadAllData();\n    });\n  </script>\n  <!-- ==================== PAGE BUILDER MODAL ==================== -->\n  <div id=\"modal-page-builder\" class=\"fixed inset-0 z-50 items-center justify-center p-4 bg-black/85 backdrop-blur-sm hidden overflow-y-auto\">\n    <div class=\"bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl w-full max-w-5xl my-8 shadow-2xl flex flex-col overflow-hidden max-h-[94vh]\">\n      \n      <!-- Top Action Bar -->\n      <div class=\"bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0\">\n        <div class=\"flex items-center gap-3\">\n          <div class=\"w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold\">\n            <i data-lucide=\"layers\" class=\"w-4 h-4\"></i>\n          </div>\n          <div>\n            <h4 id=\"page-builder-modal-title\" class=\"text-sm font-bold text-white\">สร้างหน้าเพจใหม่ (Page Builder)</h4>\n            <p class=\"text-[11px] text-slate-400\">สร้างเลย์เอาต์ จัดวางคอลัมน์ หรือเขียน Custom HTML ได้ตามต้องการ</p>\n          </div>\n        </div>\n\n        <div class=\"flex items-center gap-3\">\n          <button type=\"button\" onclick=\"previewPageBuilder()\" class=\"px-3.5 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition flex items-center gap-1.5\">\n            <i data-lucide=\"eye\" class=\"w-3.5 h-3.5\"></i><span>Live Preview</span>\n          </button>\n          <button type=\"button\" onclick=\"handleSavePage()\" class=\"px-5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition flex items-center gap-1.5\">\n            <i data-lucide=\"check\" class=\"w-3.5 h-3.5\"></i><span>บันทึกหน้าเพจ</span>\n          </button>\n          <button type=\"button\" onclick=\"closePageBuilderModal()\" class=\"text-slate-400 hover:text-white p-1 text-base\">✕</button>\n        </div>\n      </div>\n\n      <!-- Builder Body -->\n      <div class=\"flex-1 overflow-y-auto p-6 space-y-6\">\n        <input type=\"hidden\" id=\"builder_page_id\" value=\"\">\n\n        <!-- Basic Info -->\n        <div class=\"grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80\">\n          <div>\n            <label class=\"block text-xs font-bold text-slate-300 mb-1\">ชื่อหน้าเพจ (Page Title) *</label>\n            <input type=\"text\" id=\"builder_page_title\" oninput=\"autoGeneratePageSlug(this.value)\" placeholder=\"เช่น บริการโปรดักชันภาพถ่าย 2026\" class=\"w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500\">\n          </div>\n          <div>\n            <label class=\"block text-xs font-bold text-slate-300 mb-1\">URL Slug / Path * (จะแสดงผลที่ /p/your-slug)</label>\n            <div class=\"flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-400\">\n              <span class=\"shrink-0 text-slate-500\">/p/</span>\n              <input type=\"text\" id=\"builder_page_slug\" placeholder=\"commercial-production\" class=\"flex-1 bg-transparent text-white focus:outline-none ml-1\">\n            </div>\n          </div>\n          <div class=\"md:col-span-2\">\n            <label class=\"block text-xs font-bold text-slate-300 mb-1\">คำอธิบายหน้าเพจสำหรับ SEO (Meta Description)</label>\n            <input type=\"text\" id=\"builder_meta_description\" placeholder=\"สรุปเนื้อหาหน้าเพจ 1-2 ประโยคสำหรับ Google Search และ Social Share...\" class=\"w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none\">\n          </div>\n          <div class=\"md:col-span-2 flex items-center justify-between pt-2 border-t border-slate-800/60\">\n            <label class=\"flex items-center gap-2 cursor-pointer\">\n              <input type=\"checkbox\" id=\"builder_add_to_nav\" class=\"rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0\">\n              <span class=\"text-xs font-medium text-slate-300\">เพิ่มลิงก์หน้านี้ลงในแถบนำทาง (Navbar) อัตโนมัติ</span>\n            </label>\n            <label class=\"flex items-center gap-2 cursor-pointer\">\n              <input type=\"checkbox\" id=\"builder_is_active\" checked class=\"rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0\">\n              <span class=\"text-xs font-medium text-slate-300\">เปิดเผยแพร่ (Published)</span>\n            </label>\n          </div>\n        </div>\n\n        <!-- Mode Switcher Tabs -->\n        <div class=\"flex items-center justify-between border-b border-slate-800 pb-2\">\n          <div class=\"flex gap-2\">\n            <button type=\"button\" onclick=\"switchBuilderMode('visual')\" id=\"btn-builder-visual\" class=\"px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white flex items-center gap-1.5\">\n              <i data-lucide=\"layout-grid\" class=\"w-3.5 h-3.5\"></i><span>Visual Block Builder (โครงสร้างคอลัมน์)</span>\n            </button>\n            <button type=\"button\" onclick=\"switchBuilderMode('html')\" id=\"btn-builder-html\" class=\"px-4 py-1.5 rounded-xl text-xs font-medium bg-slate-800 text-slate-400 hover:text-white flex items-center gap-1.5\">\n              <i data-lucide=\"code\" class=\"w-3.5 h-3.5\"></i><span>Custom HTML & Tailwind Mode</span>\n            </button>\n          </div>\n        </div>\n\n        <!-- Visual Block Builder Area -->\n        <div id=\"builder-visual-area\" class=\"space-y-4\">\n          <div id=\"builder-rows-container\" class=\"space-y-4\">\n            <!-- Dynamic rows will be rendered here -->\n          </div>\n\n          <div class=\"p-6 border-2 border-dashed border-slate-800 rounded-2xl text-center bg-slate-950/40\">\n            <p class=\"text-xs text-slate-400 mb-3\">เพิ่มแถวใหม่เพื่อแบ่งคอลัมน์และใส่เนื้อหา</p>\n            <div class=\"flex flex-wrap items-center justify-center gap-2\">\n              <button type=\"button\" onclick=\"addBuilderRow(1)\" class=\"px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white flex items-center gap-1.5\">\n                <span>[ 1 คอลัมน์เต็ม ]</span>\n              </button>\n              <button type=\"button\" onclick=\"addBuilderRow(2)\" class=\"px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white flex items-center gap-1.5\">\n                <span>[ 2 คอลัมน์ 50/50 ]</span>\n              </button>\n              <button type=\"button\" onclick=\"addBuilderRow(3)\" class=\"px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white flex items-center gap-1.5\">\n                <span>[ 3 คอลัมน์ 33/33/33 ]</span>\n              </button>\n              <button type=\"button\" onclick=\"addBuilderRow('2-1')\" class=\"px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white flex items-center gap-1.5\">\n                <span>[ 2 คอลัมน์ คอนเทนต์ 67% + ด้านข้าง 33% ]</span>\n              </button>\n            </div>\n          </div>\n        </div>\n\n        <!-- Custom HTML / Code Area -->\n        <div id=\"builder-html-area\" class=\"space-y-3 hidden\">\n          <div class=\"flex items-center justify-between text-xs text-slate-400\">\n            <span>พิมพ์โค้ด HTML หรือ Tailwind CSS ได้อิสระ:</span>\n            <span class=\"text-[11px] text-blue-400 font-mono\">HTML5 / Tailwind v3 Supported</span>\n          </div>\n          <textarea id=\"builder_raw_html\" rows=\"18\" placeholder=\"<div class=&quot;max-w-4xl mx-auto py-12&quot;>&#10;  <h1 class=&quot;text-3xl font-bold text-white&quot;>หัวข้อของคุณ</h1>&#10;  <p class=&quot;text-slate-400 mt-4 leading-relaxed&quot;>เนื้อหา...</p>&#10;</div>\" class=\"w-full bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 rounded-2xl p-4 focus:outline-none focus:border-blue-500 leading-relaxed\"></textarea>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <!-- Floating Image Upload Pill -->\n  <div id=\"editor_upload_pill\" class=\"fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs flex items-center gap-2 z-[99] hidden\">\n    <div class=\"w-3 h-3 border-2 border-teal-500 border-t-transparent rounded-full animate-spin\"></div>\n    <span id=\"editor_upload_pill_text\">กำลังอัปโหลดภาพลงบทความ... 0%</span>\n  </div>\n\n</body>\n</html>\n";

function getAdminHtml(userEmail) {
  return ADMIN_HTML_TEMPLATE;
}
