CREATE TABLE IF NOT EXISTS site_settings (
key TEXT PRIMARY KEY,
value TEXT NOT NULL,
description TEXT,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS services (
id INTEGER PRIMARY KEY AUTOINCREMENT,
title TEXT NOT NULL,
slug TEXT UNIQUE NOT NULL,
subtitle TEXT,
description TEXT,
icon TEXT,
bullet_points TEXT,
sort_order INTEGER DEFAULT 0,
is_active INTEGER DEFAULT 1,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS categories (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
slug TEXT UNIQUE NOT NULL,
sort_order INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS portfolios (
id INTEGER PRIMARY KEY AUTOINCREMENT,
title TEXT NOT NULL,
slug TEXT UNIQUE NOT NULL,
client_name TEXT NOT NULL,
category_slug TEXT NOT NULL,
cover_image TEXT NOT NULL,
gallery_images TEXT,
summary TEXT,
details TEXT,
featured INTEGER DEFAULT 0,
sort_order INTEGER DEFAULT 0,
is_active INTEGER DEFAULT 1,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS articles (
id INTEGER PRIMARY KEY AUTOINCREMENT,
title TEXT NOT NULL,
slug TEXT UNIQUE NOT NULL,
summary TEXT,
content TEXT NOT NULL,
cover_image TEXT,
author TEXT DEFAULT 'LTT Team',
tags TEXT,
status TEXT DEFAULT 'published',
published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS client_logos (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
logo_url TEXT NOT NULL,
website_url TEXT,
sort_order INTEGER DEFAULT 0,
is_active INTEGER DEFAULT 1,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS inquiries (
id INTEGER PRIMARY KEY AUTOINCREMENT,
full_name TEXT NOT NULL,
email TEXT NOT NULL,
phone TEXT NOT NULL,
company TEXT,
service_interested TEXT,
budget_range TEXT,
message TEXT NOT NULL,
status TEXT DEFAULT 'new',
ip_address TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
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
CREATE INDEX IF NOT EXISTS idx_services_active ON services (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_portfolios_active ON portfolios (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_portfolios_featured ON portfolios (featured, is_active);
CREATE INDEX IF NOT EXISTS idx_portfolios_category ON portfolios (category_slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_logos_active ON client_logos (is_active, sort_order);