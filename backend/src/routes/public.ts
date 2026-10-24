import { Hono } from 'hono';
import { Bindings } from '../types';
import { sanitizeInput } from '../middleware/security';

export const publicRoutes = new Hono<{ Bindings: Bindings }>();

// 1. Get Site Settings (Formatted key-value object)
publicRoutes.get('/site-settings', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT key, value FROM site_settings'
    ).all<{ key: string; value: string }>();

    const settings: Record<string, string> = {};
    (results || []).forEach((row) => {
      settings[row.key] = row.value;
    });

    return c.json({ success: true, data: settings });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2. Get Services
publicRoutes.get('/services', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
    ).all();

    const formatted = (results || []).map((s: any) => ({
      ...s,
      bullet_points: s.bullet_points ? JSON.parse(s.bullet_points) : [],
    }));

    return c.json({ success: true, data: formatted });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 3. Get Portfolio Categories
publicRoutes.get('/categories', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM categories ORDER BY sort_order ASC'
    ).all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 4. Get Portfolios (Supports category filter and featured flag)
publicRoutes.get('/portfolios', async (c) => {
  try {
    const category = c.req.query('category');
    const featured = c.req.query('featured');

    let query = 'SELECT * FROM portfolios WHERE is_active = 1';
    const params: any[] = [];

    if (category && category !== 'all') {
      query += ' AND category_slug = ?';
      params.push(category);
    }

    if (featured === '1' || featured === 'true') {
      query += ' AND featured = 1';
    }

    query += ' ORDER BY sort_order ASC, id DESC';

    const stmt = c.env.DB.prepare(query);
    const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

    const formatted = (results || []).map((p: any) => ({
      ...p,
      gallery_images: p.gallery_images ? JSON.parse(p.gallery_images) : [],
    }));

    return c.json({ success: true, data: formatted });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 5. Get Portfolio by Slug
publicRoutes.get('/portfolios/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const result = await c.env.DB.prepare(
      'SELECT * FROM portfolios WHERE slug = ? AND is_active = 1'
    )
      .bind(slug)
      .first<any>();

    if (!result) {
      return c.json({ success: false, error: 'Portfolio item not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        ...result,
        gallery_images: result.gallery_images ? JSON.parse(result.gallery_images) : [],
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 6. Get Articles / Blog
publicRoutes.get('/articles', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, title, slug, summary, cover_image, author, tags, published_at FROM articles WHERE status = "published" ORDER BY published_at DESC'
    ).all();

    const formatted = (results || []).map((a: any) => ({
      ...a,
      tags: a.tags ? JSON.parse(a.tags) : [],
    }));

    return c.json({ success: true, data: formatted });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 7. Get Article by Slug
publicRoutes.get('/articles/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const result = await c.env.DB.prepare(
      'SELECT * FROM articles WHERE slug = ? AND status = "published"'
    )
      .bind(slug)
      .first<any>();

    if (!result) {
      return c.json({ success: false, error: 'Article not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        ...result,
        tags: result.tags ? JSON.parse(result.tags) : [],
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 8. Get Client Logos
publicRoutes.get('/client-logos', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM client_logos WHERE is_active = 1 ORDER BY sort_order ASC'
    ).all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 9. Submit Inquiry / Contact Form (Lead capture)
publicRoutes.post('/inquiries', async (c) => {
  try {
    const body = await c.req.json();
    const fullName = sanitizeInput(body.full_name);
    const email = sanitizeInput(body.email);
    const phone = sanitizeInput(body.phone);
    const company = sanitizeInput(body.company);
    const serviceInterested = sanitizeInput(body.service_interested);
    const budgetRange = sanitizeInput(body.budget_range);
    const message = sanitizeInput(body.message);
    const ipAddress = c.req.header('CF-Connecting-IP') || 'unknown';

    if (!fullName || !email || !phone || !message) {
      return c.json(
        { success: false, error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อ, อีเมล, เบอร์โทร, ข้อความ)' },
        400
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ success: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' }, 400);
    }

    await c.env.DB.prepare(
      `INSERT INTO inquiries (full_name, email, phone, company, service_interested, budget_range, message, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(fullName, email, phone, company, serviceInterested, budgetRange, message, ipAddress)
      .run();

    return c.json({
      success: true,
      message: 'ส่งข้อมูลการติดต่อเรียบร้อยแล้ว ทีมงาน LTT Ma getThink จะติดต่อกลับโดยเร็วที่สุดครับ',
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});
