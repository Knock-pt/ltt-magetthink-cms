CREATE TABLE IF NOT EXISTS navigation_menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    path TEXT NOT NULL,
    is_external INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nav_menus_active ON navigation_menus (is_active, sort_order);

INSERT OR REPLACE INTO navigation_menus (id, label, path, is_external, sort_order, is_active) VALUES
(1, 'หน้าแรก', '/', 0, 1, 1),
(2, 'บริการของเรา', '/our-service', 0, 2, 1),
(3, 'ผลงาน', '/portfolio', 0, 3, 1),
(4, 'เกี่ยวกับเรา', '/about-us', 0, 4, 1),
(5, 'บทความ & ข่าวสาร', '/blog', 0, 5, 1),
(6, 'ติดต่อเรา', '/contact-us', 0, 6, 1);

-- New columns for inquiries tracking and admin notes
ALTER TABLE inquiries ADD COLUMN admin_notes TEXT;
ALTER TABLE inquiries ADD COLUMN source_page TEXT DEFAULT 'contact-us';
