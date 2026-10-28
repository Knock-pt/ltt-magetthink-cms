-- ========================================================================
-- Cloudflare D1 Database Schema for LTT Ma getThink CMS
-- Engineered under DevSecOps Standards (Zero-Trust, Parameterized Safe)
-- ========================================================================

-- 1. Site Settings (Key-Value configuration for contact, social, SEO, Hero)
CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Services Management
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    subtitle TEXT,
    description TEXT,
    icon TEXT,
    bullet_points TEXT, -- JSON Array string
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Portfolio Categories
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- 4. Portfolio / Case Studies
CREATE TABLE IF NOT EXISTS portfolios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    gallery_images TEXT, -- JSON Array string of image URLs
    summary TEXT,
    details TEXT,
    featured INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Articles / Blog / News
CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    cover_image TEXT,
    author TEXT DEFAULT 'LTT Team',
    tags TEXT, -- JSON Array string
    status TEXT DEFAULT 'published', -- 'draft', 'published'
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Client Logos & Partners
CREATE TABLE IF NOT EXISTS client_logos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    website_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Inquiries & Leads (Customer Contact Submissions)
CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    company TEXT,
    service_interested TEXT,
    budget_range TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new', -- 'new', 'in_progress', 'contacted', 'closed'
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Media Library Assets (Cloudflare R2 Tracking)
CREATE TABLE IF NOT EXISTS media_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT NOT NULL,
    file_key TEXT UNIQUE NOT NULL,
    file_url TEXT NOT NULL,
    mime_type TEXT,
    file_size INTEGER,
    category TEXT DEFAULT 'general',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-performance edge querying
CREATE INDEX IF NOT EXISTS idx_services_active ON services (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_portfolios_active ON portfolios (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_portfolios_featured ON portfolios (featured, is_active);
CREATE INDEX IF NOT EXISTS idx_portfolios_category ON portfolios (category_slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_logos_active ON client_logos (is_active, sort_order);

-- 9. Custom Pages (Built with Page Builder)
CREATE TABLE IF NOT EXISTS custom_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    content_json TEXT,
    meta_description TEXT,
    cover_image TEXT,
    template_style TEXT DEFAULT 'visual-columns',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_custom_pages_slug ON custom_pages (slug, is_active);

