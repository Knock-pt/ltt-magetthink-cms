import { Hono } from 'hono';
import { Bindings } from '../types';
import { AuthVariables } from '../middleware/auth';
import { sanitizeInput } from '../middleware/security';

export const adminRoutes = new Hono<{
  Bindings: Bindings;
  Variables: AuthVariables;
}>();

// Helper to trigger Cache Invalidation on Frontend (Real-time sync)
async function triggerFrontendSync(c: any) {
  const webhookUrl = c.env.CACHE_PURGE_WEBHOOK;
  if (!webhookUrl) return;

  try {
    // Non-blocking fire-and-forget fetch to clear frontend ISR/edge cache
    c.executionCtx.waitUntil(
      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Token': 'ltt-edge-sync-token',
        },
        body: JSON.stringify({ timestamp: Date.now() }),
      }).catch((e: any) => console.error('Cache purge webhook error:', e))
    );
  } catch (err) {
    // Ignore error in local dev where executionCtx may not be bound
  }
}

// 1. Dashboard Statistics
adminRoutes.get('/dashboard/stats', async (c) => {
  try {
    const totalInquiries = await c.env.DB.prepare('SELECT COUNT(*) as count FROM inquiries').first<{ count: number }>();
    const newInquiries = await c.env.DB.prepare('SELECT COUNT(*) as count FROM inquiries WHERE status = "new"').first<{ count: number }>();
    const totalPortfolios = await c.env.DB.prepare('SELECT COUNT(*) as count FROM portfolios').first<{ count: number }>();
    const totalServices = await c.env.DB.prepare('SELECT COUNT(*) as count FROM services').first<{ count: number }>();
    const totalArticles = await c.env.DB.prepare('SELECT COUNT(*) as count FROM articles').first<{ count: number }>();

    const recentInquiries = await c.env.DB.prepare(
      'SELECT id, full_name, company, service_interested, status, created_at FROM inquiries ORDER BY created_at DESC LIMIT 5'
    ).all();

    return c.json({
      success: true,
      data: {
        total_inquiries: totalInquiries?.count || 0,
        new_inquiries: newInquiries?.count || 0,
        total_portfolios: totalPortfolios?.count || 0,
        total_services: totalServices?.count || 0,
        total_articles: totalArticles?.count || 0,
        recent_inquiries: recentInquiries.results || [],
        user_email: c.get('userEmail'),
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2. Portfolios CRUD
adminRoutes.get('/portfolios', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM portfolios ORDER BY sort_order ASC, id DESC').all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

adminRoutes.post('/portfolios', async (c) => {
  try {
    const b = await c.req.json();
    const title = sanitizeInput(b.title);
    const slug = sanitizeInput(b.slug) || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const clientName = sanitizeInput(b.client_name);
    const categorySlug = sanitizeInput(b.category_slug) || 'all';
    const coverImage = sanitizeInput(b.cover_image);
    const galleryImages = b.gallery_images ? JSON.stringify(b.gallery_images) : '[]';
    const summary = sanitizeInput(b.summary);
    const details = b.details || '';
    const featured = b.featured ? 1 : 0;
    const sortOrder = Number(b.sort_order) || 0;
    const isActive = b.is_active !== undefined ? (b.is_active ? 1 : 0) : 1;

    await c.env.DB.prepare(
      `INSERT INTO portfolios (title, slug, client_name, category_slug, cover_image, gallery_images, summary, details, featured, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(title, slug, clientName, categorySlug, coverImage, galleryImages, summary, details, featured, sortOrder, isActive)
      .run();

    await triggerFrontendSync(c);
    return c.json({ success: true, message: 'บันทึกผลงานเรียบร้อยแล้ว' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

adminRoutes.put('/portfolios/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const b = await c.req.json();

    const title = sanitizeInput(b.title);
    const slug = sanitizeInput(b.slug);
    const clientName = sanitizeInput(b.client_name);
    const categorySlug = sanitizeInput(b.category_slug);
    const coverImage = sanitizeInput(b.cover_image);
    const galleryImages = b.gallery_images ? (typeof b.gallery_images === 'string' ? b.gallery_images : JSON.stringify(b.gallery_images)) : '[]';
    const summary = sanitizeInput(b.summary);
    const details = b.details || '';
    const featured = b.featured ? 1 : 0;
    const sortOrder = Number(b.sort_order) || 0;
    const isActive = b.is_active ? 1 : 0;

    await c.env.DB.prepare(
      `UPDATE portfolios SET
        title = ?, slug = ?, client_name = ?, category_slug = ?, cover_image = ?,
        gallery_images = ?, summary = ?, details = ?, featured = ?, sort_order = ?,
        is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
      .bind(title, slug, clientName, categorySlug, coverImage, galleryImages, summary, details, featured, sortOrder, isActive, id)
      .run();

    await triggerFrontendSync(c);
    return c.json({ success: true, message: 'อัปเดตผลงานเรียบร้อยแล้ว' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

adminRoutes.delete('/portfolios/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM portfolios WHERE id = ?').bind(id).run();
    await triggerFrontendSync(c);
    return c.json({ success: true, message: 'ลบผลงานเรียบร้อยแล้ว' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 3. Services CRUD
adminRoutes.get('/services', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM services ORDER BY sort_order ASC').all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

adminRoutes.put('/services/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const b = await c.req.json();
    const title = sanitizeInput(b.title);
    const subtitle = sanitizeInput(b.subtitle);
    const description = sanitizeInput(b.description);
    const icon = sanitizeInput(b.icon);
    const bulletPoints = b.bullet_points ? (typeof b.bullet_points === 'string' ? b.bullet_points : JSON.stringify(b.bullet_points)) : '[]';
    const sortOrder = Number(b.sort_order) || 0;
    const isActive = b.is_active ? 1 : 0;

    await c.env.DB.prepare(
      `UPDATE services SET title = ?, subtitle = ?, description = ?, icon = ?, bullet_points = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    )
      .bind(title, subtitle, description, icon, bulletPoints, sortOrder, isActive, id)
      .run();

    await triggerFrontendSync(c);
    return c.json({ success: true, message: 'อัปเดตบริการเรียบร้อยแล้ว' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 4. Articles / Blog CRUD
adminRoutes.get('/articles', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM articles ORDER BY published_at DESC').all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

adminRoutes.post('/articles', async (c) => {
  try {
    const b = await c.req.json();
    const title = sanitizeInput(b.title);
    const slug = sanitizeInput(b.slug) || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const summary = sanitizeInput(b.summary);
    const content = b.content || '';
    const coverImage = sanitizeInput(b.cover_image);
    const author = sanitizeInput(b.author) || 'LTT Team';
    const tags = b.tags ? JSON.stringify(b.tags) : '[]';
    const status = b.status === 'draft' ? 'draft' : 'published';

    await c.env.DB.prepare(
      `INSERT INTO articles (title, slug, summary, content, cover_image, author, tags, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(title, slug, summary, content, coverImage, author, tags, status)
      .run();

    await triggerFrontendSync(c);
    return c.json({ success: true, message: 'บันทึกบทความเรียบร้อยแล้ว' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

adminRoutes.delete('/articles/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM articles WHERE id = ?').bind(id).run();
    await triggerFrontendSync(c);
    return c.json({ success: true, message: 'ลบบทความเรียบร้อยแล้ว' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 5. Inquiries & Leads Inbox
adminRoutes.get('/inquiries', async (c) => {
  try {
    const status = c.req.query('status');
    let query = 'SELECT * FROM inquiries';
    const params: any[] = [];
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';

    const { results } = params.length > 0
      ? await c.env.DB.prepare(query).bind(...params).all()
      : await c.env.DB.prepare(query).all();

    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

adminRoutes.patch('/inquiries/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const { status } = await c.req.json();
    const validStatuses = ['new', 'in_progress', 'contacted', 'closed'];

    if (!validStatuses.includes(status)) {
      return c.json({ success: false, error: 'Invalid status' }, 400);
    }

    await c.env.DB.prepare(
      'UPDATE inquiries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    )
      .bind(status, id)
      .run();

    return c.json({ success: true, message: 'อัปเดตสถานะเรียบร้อยแล้ว' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// CSV Export for Inquiries
adminRoutes.get('/inquiries/export.csv', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, full_name, email, phone, company, service_interested, budget_range, message, status, created_at FROM inquiries ORDER BY created_at DESC'
    ).all<any>();

    let csv = '\uFEFFID,Full Name,Email,Phone,Company,Service,Budget,Message,Status,Date\n';
    (results || []).forEach((row) => {
      const escape = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
      csv += `${row.id},${escape(row.full_name)},${escape(row.email)},${escape(row.phone)},${escape(row.company)},${escape(row.service_interested)},${escape(row.budget_range)},${escape(row.message)},${escape(row.status)},${row.created_at}\n`;
    });

    c.header('Content-Type', 'text/csv; charset=utf-8');
    c.header('Content-Disposition', 'attachment; filename="inquiries_export.csv"');
    return c.text(csv);
  } catch (error: any) {
    return c.text('Error generating CSV', 500);
  }
});

// 6. Site Settings CRUD
adminRoutes.get('/site-settings', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM site_settings').all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

adminRoutes.put('/site-settings', async (c) => {
  try {
    const body = await c.req.json();
    const updates: { key: string; value: string }[] = body.settings || [];

    for (const item of updates) {
      await c.env.DB.prepare(
        'INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
      )
        .bind(item.key, item.value)
        .run();
    }

    await triggerFrontendSync(c);
    return c.json({ success: true, message: 'บันทึกการตั้งค่าเว็บไซต์เรียบร้อยแล้ว' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 7. Client Logos CRUD
adminRoutes.get('/client-logos', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM client_logos ORDER BY sort_order ASC').all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

adminRoutes.post('/client-logos', async (c) => {
  try {
    const b = await c.req.json();
    const name = sanitizeInput(b.name);
    const logoUrl = sanitizeInput(b.logo_url);
    const websiteUrl = sanitizeInput(b.website_url);
    const sortOrder = Number(b.sort_order) || 0;

    await c.env.DB.prepare(
      'INSERT INTO client_logos (name, logo_url, website_url, sort_order) VALUES (?, ?, ?, ?)'
    )
      .bind(name, logoUrl, websiteUrl, sortOrder)
      .run();

    await triggerFrontendSync(c);
    return c.json({ success: true, message: 'เพิ่มโลโก้ลูกค้าเรียบร้อยแล้ว' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

adminRoutes.delete('/client-logos/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM client_logos WHERE id = ?').bind(id).run();
    await triggerFrontendSync(c);
    return c.json({ success: true, message: 'ลบโลโก้เรียบร้อยแล้ว' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 8. Trigger Instant Cache Purge Sync Manually
adminRoutes.post('/sync/purge-cache', async (c) => {
  await triggerFrontendSync(c);
  return c.json({ success: true, message: 'คำสั่งล้างแคชส่งไปยังหน้าบ้านเรียบร้อยแล้ว' });
});
