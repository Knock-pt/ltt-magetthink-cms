-- ========================================================================
-- Cloudflare D1 All-in-One Setup Script (Schema + Seed Data)
-- Copy and paste this ENTIRE script into the Cloudflare D1 Console
-- ========================================================================

-- 1. Create Tables
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

-- 2. Create Indexes
CREATE INDEX IF NOT EXISTS idx_services_active ON services (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_portfolios_active ON portfolios (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_portfolios_featured ON portfolios (featured, is_active);
CREATE INDEX IF NOT EXISTS idx_portfolios_category ON portfolios (category_slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_logos_active ON client_logos (is_active, sort_order);

-- 3. Insert Initial Data (Seed)
INSERT OR REPLACE INTO site_settings (key, value, description) VALUES
('company_name', 'LTT Ma getThink (บริษัท แอล ที ที มา เกท ธิงค์ จำกัด)', 'Official Company Name'),
('tagline', 'One-Stop Service Marketing & Creative Production Agency', 'Brand Tagline'),
('hero_headline', 'ยกระดับแบรนด์ของคุณด้วยการตลาดและมีเดียโปรดักชันครบวงจร', 'Homepage Hero Headline'),
('hero_subheadline', 'ดูแลแบรนด์แบบฟูลทีม ตั้งแต่วางแผนกลยุทธ์ ถ่ายภาพ โปรดักชันวิดีโอ ไปจนถึงอินฟลูเอนเซอร์มาร์เก็ตติง', 'Homepage Hero Subheadline'),
('hero_badge', 'CREATIVE & DIGITAL MARKETING AGENCY', 'Hero Top Badge'),
('phone', '096-042-9083', 'Contact Phone Number'),
('email', 'contact@lttmagetthink.co', 'Contact Email'),
('line_oa', '@lttmagetthink', 'LINE Official Account'),
('facebook_url', 'https://www.facebook.com/lttmagetthink', 'Facebook Page URL'),
('instagram_url', 'https://www.instagram.com/lttmagetthink', 'Instagram Profile URL'),
('tiktok_url', 'https://www.tiktok.com/@lttmagetthink', 'TikTok Profile URL'),
('address', '65/73 หมู่ 6 ต.ลำลูกกา อ.ลำลูกกา จ.ปทุมธานี 12150', 'Company Office Address'),
('stat_projects', '150+', 'Projects Completed Statistic'),
('stat_brands', '80+', 'Partner Brands Statistic'),
('stat_views', '25M+', 'Organic Video Views Statistic'),
('stat_retention', '96%', 'Client Satisfaction & Retention');

INSERT OR REPLACE INTO categories (id, name, slug, sort_order) VALUES
(1, 'All Projects', 'all', 0),
(2, 'Hotels & Resorts', 'hotels-resorts', 1),
(3, 'Real Estate', 'real-estate', 2),
(4, 'Food & Beverage', 'food-beverage', 3),
(5, 'Lifestyle & Wellness', 'lifestyle-wellness', 4);

INSERT OR REPLACE INTO services (id, title, slug, subtitle, description, icon, bullet_points, sort_order, is_active) VALUES
(1, 'Digital Marketing & Social Media', 'digital-marketing', 'วางแผนกลยุทธ์และบริหารช่องทางโซเชียลแบบครบวงจร', 'ดูแลเพจธุรกิจของคุณเสมือนเป็นทีมการตลาดส่วนตัว วางแผนกลยุทธ์คอนเทนต์รายเดือน ยิงแอดโฆษณา และบริหารจัดการ Facebook, Instagram, TikTok, LINE OA อย่างมีประสิทธิภาพ', 'TrendingUp', '["Monthly Content Planning & Calendar", "Ad Campaign Strategy & Optimization", "Social Media Account Management", "Performance Analytics & Monthly Reporting"]', 1, 1),
(2, 'Commercial Photography & Production', 'photography-production', 'บริการถ่ายภาพสินค้า อาหาร และสถาปัตยกรรมระดับพรีเมียม', 'ทีมช่างภาพและโปรดักชันมืออาชีพ ถ่ายทอดเอกลักษณ์ของแบรนด์ ทั้งงานภาพถ่ายสินค้า อาหาร และงานภาพสถาปัตยกรรมภายใน/ภายนอก สำหรับโรงแรม รีสอร์ท และคอนโดมิเนียม', 'Camera', '["Hotel & Resort Architecture Photography", "Interior & Exterior Commercial Shoots", "Food & Beverage Styling & Photography", "Product Catalog & Studio Shoots"]', 2, 1),
(3, 'Creative Content & Short Video', 'creative-video', 'ออกแบบกราฟิก ตัดต่อวิดีโอสั้น Viral Reels & Shorts', 'ผลิตสื่อมีเดียที่ดึงดูดสายตาและสร้างยอด Engagement ออกแบบอาร์ตเวิร์กกราฟิกที่ตรงกับ Brand CI รวมถึงการตัดต่อวิดีโอสั้นพร้อมจัดทำ Script และ Storyboard', 'Video', '["Viral Short-Form Reels / TikTok Production", "Graphic Design & Brand Key Visuals", "Creative Scriptwriting & Storyboard", "Motion Graphics & Sound Design"]', 3, 1),
(4, 'Influencer & KOL Marketing', 'kol-marketing', 'คัดเลือกและประสานงานอินฟลูเอนเซอร์ที่ตรงกลุ่มเป้าหมาย', 'เชื่อมโยงแบรนด์ของคุณกับ Creators, Influencers และ KOLs ที่มีอิทธิพลตรงกลุ่ม คัดสรรด้วย Data เพื่อสร้างการรับรู้ รีวิวเชิงลึก และผลักดันยอดขายจริง', 'Users', '["Data-Driven KOL & Creator Matching", "Briefing, Coordination & Quality Check", "Performance Tracking & Engagement Report", "Omnichannel Cross-Posting"]', 4, 1);

INSERT OR REPLACE INTO portfolios (id, title, slug, client_name, category_slug, cover_image, gallery_images, summary, details, featured, sort_order, is_active) VALUES
(1, 'Cross Pattaya Oceanphere — Luxury Pool Villa Storytelling', 'cross-pattaya-oceanphere', 'Cross Pattaya Oceanphere', 'hotels-resorts', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', '["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80"]', 'งานถ่ายภาพสถาปัตยกรรมและโปรดักชันคอนเทนต์วิดีโอวิลล่าระดับ 5 ดาว ถ่ายทอดความสงบและความหรูหรา', 'โปรเจกต์การถ่ายภาพและผลิตมีเดียเต็มรูปแบบสำหรับ Cross Pattaya Oceanphere โดยเน้นสถาปัตยกรรม Geometric, สระว่ายน้ำส่วนตัว และบรรยากาศ Private Dining นำเสนอผ่านวิดีโอสั้นและอัลบั้มภาพที่ทำยอด Reach รวมกว่า 1.2 ล้านวิว', 1, 1, 1),
(2, 'The Politan Aqua — Waterfront High-Rise Showcase', 'the-politan-aqua', 'The Politan Aqua', 'real-estate', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', '["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80"]', 'โปรดักชันถ่ายภาพอาคารสูงริมแม่น้ำเจ้าพระยา และงานตัดต่อวิดีโอพาทัวร์ห้องตัวอย่าง', 'การถ่ายภาพ Exterior สถาปัตยกรรมริมน้ำยามค่ำคืนและห้องจำลองสไตล์โมเดิร์น พร้อมสื่อสารจุดขายวิวแม่น้ำแบบ Panoramic 180 องศาเพื่อสนับสนุนทีมขายอสังหาริมทรัพย์', 1, 2, 1),
(3, 'Pavilion Samui Villas & Resort — Tropical Paradise Branding', 'pavilion-samui', 'Pavilion Samui Villas & Resort', 'hotels-resorts', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80', '["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80"]', 'บริการถ่ายภาพโรงแรมติดชายหาดหาดละไมและจัดทำแคมเปญอินฟลูเอนเซอร์ช่วง High Season', 'ยกระดับภาพลักษณ์บูทีครีสอร์ทริมทะเลเกาะสมุย เน้นเฉดสีธรรมชาติ แสงแดดเขตร้อน และการพักผ่อนเพื่อสุขภาพ', 1, 3, 1),
(4, 'Rachabura Hotel — Riverside Industrial Chic', 'rachabura-hotel', 'Rachabura Hotel', 'hotels-resorts', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', '["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"]', 'งานภาพถ่ายดีไซน์อิฐแดงและสถาปัตยกรรมร่วมสมัยริมแม่น้ำแม่กลอง จังหวัดราชบุรี', 'ชูจุดเด่นสถาปัตยกรรมที่มีเอกลักษณ์ ผสมผสานความดิบของอิฐและสายน้ำ เพื่อดึงดูดกลุ่มนักท่องเที่ยวสายถ่ายภาพและคาเฟ่ฮอปเปอร์', 0, 4, 1),
(5, 'Suncave Cafe & Roastery — Signature Menu & Social Launch', 'suncave-cafe', 'Suncave Cafe', 'food-beverage', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80', '["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80"]', 'การถ่ายภาพอาหารและเครื่องดื่ม Specialty Coffee พร้อมแคมเปญเปิดตัวบน TikTok', 'สร้าง Storytelling ผ่านภาพเมล็ดกาแฟคั่วพิเศษ กลิ่นหอม และเบเกอรีอบสดใหม่ ดันยอด Engagement สูงสุดในสัปดาห์แรกของการเปิดร้าน', 1, 5, 1);

INSERT OR REPLACE INTO client_logos (id, name, logo_url, sort_order, is_active) VALUES
(1, 'Cross Hotels & Resorts', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80', 1, 1),
(2, 'The Politan Aqua', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80', 2, 1),
(3, 'Pavilion Samui', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80', 3, 1),
(4, 'Rachabura Hotel', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80', 4, 1),
(5, 'Suncave Cafe', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80', 5, 1);

INSERT OR REPLACE INTO articles (id, title, slug, summary, content, cover_image, author, tags, status, published_at) VALUES
(1, 'เจาะลึก 5 เทรนด์ Short-Form Video ที่แบรนด์โรงแรมและร้านอาหารต้องรู้ในปี 2026', '5-short-video-trends-2026', 'วิดีโอสั้นไม่ใช่แค่เรื่องของความสนุก แต่คือเครื่องมือปิดการขายที่ทรงพลังที่สุดสำหรับธุรกิจท่องเที่ยวและบริการ', 'เนื้อหาบทความวิเคราะห์ถึงพฤติกรรมผู้บริโภคที่เปลี่ยนไป...', 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80', 'LTT Content Team', '["ShortVideo", "DigitalMarketing"]', 'published', CURRENT_TIMESTAMP),
(2, 'ทำไมภาพถ่าย Interior & Exterior ถึงส่งผลต่ออัตราการจองโรงแรมมากกว่าราคาห้องพัก', 'power-of-architectural-photography', 'ถอดรหัสจิตวิทยาลูกค้ากับการตัดสินใจเลือกจองที่พักจากรูปถ่ายเชิงสถาปัตยกรรมและการจัดแสง', 'เมื่อผู้เข้าชมเข้ามาในแพลตฟอร์ม OTA หรือหน้าเว็บไซต์ รูปภาพคือสิ่งแรกที่กำหนดความคาดหวัง...', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80', 'LTT Production Team', '["Photography", "HotelBranding"]', 'published', CURRENT_TIMESTAMP);
