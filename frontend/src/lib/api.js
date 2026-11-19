export const BACKEND_ORIGIN = 'https://ltt-backend.thunchanok-raj.workers.dev';

/**
 * Normalize media URLs so /media/... is served directly from ltt-website R2 route
 */
export function resolveMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith(`${BACKEND_ORIGIN}/media/`)) {
    return url.replace(BACKEND_ORIGIN, '');
  }
  return url;
}

export function resolveHtmlMediaUrls(html) {
  if (!html) return '';
  return html.replaceAll(`${BACKEND_ORIGIN}/media/`, '/media/');
}

function getDb(Astro) {
  return Astro?.locals?.runtime?.env?.DB || null;
}

/**
 * Single D1 batch round-trip for BaseLayout (site_settings + navigation_menus)
 */
export async function getLayoutBundle(Astro) {
  const db = getDb(Astro);
  if (!db) return { settings: {}, menus: [] };
  try {
    const [settingsRes, navRes] = await db.batch([
      db.prepare('SELECT key, value FROM site_settings'),
      db.prepare('SELECT * FROM navigation_menus WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'),
    ]);
    const settings = {};
    (settingsRes.results || []).forEach((r) => {
      settings[r.key] = r.value;
    });
    return { settings, menus: navRes.results || [] };
  } catch {
    return { settings: {}, menus: [] };
  }
}

/**
 * Single D1 batch round-trip for Homepage (all 6 tables in 1 round-trip!)
 */
export async function getHomePageBundle(Astro) {
  const db = getDb(Astro);
  if (!db) {
    return { settings: {}, menus: [], services: [], portfolios: [], articles: [], clientLogos: [] };
  }
  try {
    const [settingsRes, navRes, svcRes, portRes, artRes, logoRes] = await db.batch([
      db.prepare('SELECT key, value FROM site_settings'),
      db.prepare('SELECT * FROM navigation_menus WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'),
      db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order ASC LIMIT 4'),
      db.prepare('SELECT * FROM portfolios WHERE is_active = 1 ORDER BY sort_order ASC, id DESC LIMIT 3'),
      db.prepare('SELECT * FROM articles WHERE status = "published" ORDER BY published_at DESC LIMIT 3'),
      db.prepare('SELECT * FROM client_logos WHERE is_active = 1 ORDER BY sort_order ASC'),
    ]);
    const settings = {};
    (settingsRes.results || []).forEach((r) => {
      settings[r.key] = r.value;
    });
    return {
      settings,
      menus: navRes.results || [],
      services: svcRes.results || [],
      portfolios: portRes.results || [],
      articles: artRes.results || [],
      clientLogos: logoRes.results || [],
    };
  } catch {
    return { settings: {}, menus: [], services: [], portfolios: [], articles: [], clientLogos: [] };
  }
}

export async function getSiteSettings(Astro) {
  const db = getDb(Astro);
  if (!db) return {};
  try {
    const { results } = await db.prepare('SELECT key, value FROM site_settings').all();
    const settings = {};
    (results || []).forEach((r) => {
      settings[r.key] = r.value;
    });
    return settings;
  } catch {
    return {};
  }
}

export async function getNavigation(Astro) {
  const db = getDb(Astro);
  if (!db) return [];
  try {
    const { results } = await db
      .prepare('SELECT * FROM navigation_menus WHERE is_active = 1 ORDER BY sort_order ASC, id ASC')
      .all();
    return results || [];
  } catch {
    return [];
  }
}

export async function getServices(Astro) {
  const db = getDb(Astro);
  if (!db) return [];
  try {
    const { results } = await db
      .prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order ASC')
      .all();
    return (results || []).map((s) => {
      let bullets = [];
      try {
        bullets = JSON.parse(s.bullet_points || '[]');
      } catch {
        bullets = s.bullet_points ? s.bullet_points.split('\n').filter(Boolean) : [];
      }
      return { ...s, bullet_points: bullets };
    });
  } catch {
    return [];
  }
}

export async function getPortfolios(Astro) {
  const db = getDb(Astro);
  if (!db) return [];
  try {
    const { results } = await db
      .prepare('SELECT * FROM portfolios WHERE is_active = 1 ORDER BY sort_order ASC, id DESC')
      .all();
    return (results || []).map((p) => {
      let tags_meta = {};
      let gallery_images = [];
      try { tags_meta = JSON.parse(p.tags_meta || '{}'); } catch {}
      try { gallery_images = JSON.parse(p.gallery_images || '[]'); } catch {}
      return { ...p, tags_meta, gallery_images };
    });
  } catch {
    return [];
  }
}

export async function getPortfolioBySlug(Astro, slug) {
  const db = getDb(Astro);
  if (!db) return null;
  try {
    const item = await db
      .prepare('SELECT * FROM portfolios WHERE (slug = ? OR id = ?) AND is_active = 1')
      .bind(slug, slug)
      .first();
    if (!item) return null;
    let tags_meta = {};
    let gallery_images = [];
    try { tags_meta = JSON.parse(item.tags_meta || '{}'); } catch {}
    try { gallery_images = JSON.parse(item.gallery_images || '[]'); } catch {}
    return { ...item, tags_meta, gallery_images };
  } catch {
    return null;
  }
}

export async function getArticles(Astro) {
  const db = getDb(Astro);
  if (!db) return [];
  try {
    const { results } = await db
      .prepare('SELECT * FROM articles WHERE status = "published" ORDER BY published_at DESC')
      .all();
    return (results || []).map((a) => {
      let tags_meta = {};
      try { tags_meta = JSON.parse(a.tags_meta || '{}'); } catch {}
      return { ...a, tags_meta };
    });
  } catch {
    return [];
  }
}

export async function getArticleBySlug(Astro, slug) {
  const db = getDb(Astro);
  if (!db) return null;
  try {
    const item = await db
      .prepare('SELECT * FROM articles WHERE (slug = ? OR id = ?) AND status = "published"')
      .bind(slug, slug)
      .first();
    if (!item) return null;
    let tags_meta = {};
    try { tags_meta = JSON.parse(item.tags_meta || '{}'); } catch {}
    return { ...item, tags_meta };
  } catch {
    return null;
  }
}

export async function getClientLogos(Astro) {
  const db = getDb(Astro);
  if (!db) return [];
  try {
    const { results } = await db
      .prepare('SELECT * FROM client_logos WHERE is_active = 1 ORDER BY sort_order ASC')
      .all();
    return results || [];
  } catch {
    return [];
  }
}

export async function getCustomPageBySlug(Astro, slug) {
  const db = getDb(Astro);
  if (!db) return null;
  try {
    const item = await db
      .prepare('SELECT * FROM custom_pages WHERE (slug = ? OR id = ?) AND is_active = 1')
      .bind(slug, slug)
      .first();
    return item || null;
  } catch {
    return null;
  }
}

export function extractYouTubeId(url) {
  if (!url) return '';
  if (url.includes('youtube.com/watch?v=')) {
    return url.split('v=')[1]?.split('&')[0] || '';
  }
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1]?.split('?')[0] || '';
  }
  if (url.includes('youtube.com/shorts/')) {
    return url.split('shorts/')[1]?.split('?')[0] || '';
  }
  if (url.includes('youtube.com/embed/')) {
    return url.split('embed/')[1]?.split('?')[0] || '';
  }
  return '';
}
