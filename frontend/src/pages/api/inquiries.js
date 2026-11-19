function sanitizeInput(str) {
  if (!str) return '';
  return String(str)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim();
}

export async function POST({ request, locals }) {
  const db = locals?.runtime?.env?.DB;
  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database binding unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const full_name = sanitizeInput(body.full_name);
    const email = sanitizeInput(body.email);
    const phone = sanitizeInput(body.phone);
    const company = sanitizeInput(body.company || '');
    const service_interested = sanitizeInput(body.service_interested || 'General');
    const budget_range = sanitizeInput(body.budget_range || '-');
    const message = sanitizeInput(body.message);
    const source_page = sanitizeInput(body.source_page || '/contact-us');
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

    if (!full_name || !email || !phone || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, อีเมล, เบอร์โทร, ข้อความ)',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await db
      .prepare(
        `INSERT INTO inquiries (full_name, email, phone, company, service_interested, budget_range, message, source_page, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(full_name, email, phone, company, service_interested, budget_range, message, source_page, ip)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'ส่งข้อความเรียบร้อยแล้ว ทีมงานจะติดต่อกลับโดยเร็วที่สุดครับ',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
