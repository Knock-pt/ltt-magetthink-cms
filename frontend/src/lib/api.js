export const BACKEND_ORIGIN = 'https://ltt-backend.thunchanok-raj.workers.dev';
export const API_BASE = `${BACKEND_ORIGIN}/api/public`;

/**
 * Normalize media URLs so /media/... is served directly from ltt-website R2 route
 * (never blocked by Cloudflare Zero Trust Access on ltt-backend)
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

async function fetchApiFallback(endpoint, fallback = null) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return fallback;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return fallback;
    const json = await res.json();
    return json && json.success && json.data !== undefined ? json.data : fallback;
  } catch {
    return fallback;
  }
}

export async function getSiteSettings(Astro) {
  const db = getDb(Astro);
  if (db) {
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
  return (await fetchApiFallback('/site-settings', {})) || {};
}

export async function getNavigation(Astro) {
  const db = getDb(Astro);
  if (db) {
    try {
      const { results } = await db
        .prepare('SELECT * FROM navigation_menus WHERE is_active = 1 ORDER BY sort_order ASC, id ASC')
        .all();
      return results || [];
    } catch {
      return [];
    }
  }
  return (await fetchApiFallback('/navigation', [])) || [];
}

export async function getServices(Astro) {
  const db = getDb(Astro);
  if (db) {
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
  return (await fetchApiFallback('/services', [])) || [];
}

export async function getPortfolios(Astro) {
  const db = getDb(Astro);
  if (db) {
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
  return (await fetchApiFallback('/portfolios', [])) || [];
}

export async function getPortfolioBySlug(Astro, slug) {
  const db = getDb(Astro);
  if (db) {
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
  return await fetchApiFallback(`/portfolios/${encodeURIComponent(slug)}`, null);
}

export async function getArticles(Astro) {
  const db = getDb(Astro);
  if (db) {
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
  return (await fetchApiFallback('/articles', [])) || [];
}

export async function getArticleBySlug(Astro, slug) {
  const db = getDb(Astro);
  if (db) {
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
  return await fetchApiFallback(`/articles/${encodeURIComponent(slug)}`, null);
}

export async function getClientLogos(Astro) {
  const db = getDb(Astro);
  if (db) {
    try {
      const { results } = await db
        .prepare('SELECT * FROM client_logos WHERE is_active = 1 ORDER BY sort_order ASC')
        .all();
      return results || [];
    } catch {
      return [];
    }
  }
  return (await fetchApiFallback('/client-logos', [])) || [];
}

export async function getCustomPageBySlug(Astro, slug) {
  const db = getDb(Astro);
  if (db) {
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
  return await fetchApiFallback(`/pages/${encodeURIComponent(slug)}`, null);
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
