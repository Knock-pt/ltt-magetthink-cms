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
(1, 'Digital Marketing & Social Media', 'digital-marketing', 'วางแผนกลยุทธ์และบริหารช่องทางโซเชียลแบบครบวงจร', 'ดูแลเพจธุรกิจของคุณเสมือนเป็นทีมการตลาดส่วนตัว วางแผนกลยุทธ์คอนเทนต์รายเดือน (Content Calendar) ยิงแอดโฆษณา และบริหารจัดการ Facebook, Instagram, TikTok และ LINE OA อย่างมีประสิทธิภาพ', 'TrendingUp', '["Monthly Content Planning & Calendar", "Ad Campaign Strategy & Optimization", "Social Media Account Management", "Performance Analytics & Monthly Reporting"]', 1, 1),
(2, 'Commercial Photography & Production', 'photography-production', 'บริการถ่ายภาพสินค้า อาหาร และสถาปัตยกรรมระดับพรีเมียม', 'ทีมช่างภาพและโปรดักชันมืออาชีพ ถ่ายทอดเอกลักษณ์ของแบรนด์ ทั้งงานภาพถ่ายสินค้า อาหาร และงานภาพสถาปัตยกรรมภายใน/ภายนอก (Interior & Exterior) สำหรับโรงแรม รีสอร์ท และคอนโดมิเนียม', 'Camera', '["Hotel & Resort Architecture Photography", "Interior & Exterior Commercial Shoots", "Food & Beverage Styling & Photography", "Product Catalog & Studio Shoots"]', 2, 1),
(3, 'Creative Content & Short Video', 'creative-video', 'ออกแบบกราฟิก ตัดต่อวิดีโอสั้น Viral Reels & Shorts', 'ผลิตสื่อมีเดียที่ดึงดูดสายตาและสร้างยอด Engagement ออกแบบอาร์ตเวิร์กกราฟิกที่ตรงกับ Brand CI รวมถึงการตัดต่อวิดีโอสั้น (Short-Form Video / Reels / TikTok) พร้อมจัดทำ Script และ Storyboard', 'Video', '["Viral Short-Form Reels / TikTok Production", "Graphic Design & Brand Key Visuals", "Creative Scriptwriting & Storyboard", "Motion Graphics & Sound Design"]', 3, 1),
(4, 'Influencer & KOL Marketing', 'kol-marketing', 'คัดเลือกและประสานงานอินฟลูเอนเซอร์ที่ตรงกลุ่มเป้าหมาย', 'เชื่อมโยงแบรนด์ของคุณกับ Creators, Influencers และ KOLs ที่มีอิทธิพลตรงกลุ่ม คัดสรรด้วย Data เพื่อสร้างการรับรู้ (Awareness) รีวิวเชิงลึก และผลักดันยอดขายจริง', 'Users', '["Data-Driven KOL & Creator Matching", "Briefing, Coordination & Quality Check", "Performance Tracking & Engagement Report", "Omnichannel Cross-Posting"]', 4, 1);
INSERT OR REPLACE INTO portfolios (id, title, slug, client_name, category_slug, cover_image, gallery_images, summary, details, featured, sort_order, is_active) VALUES
(1, 'Cross Pattaya Oceanphere — Luxury Pool Villa Storytelling', 'cross-pattaya-oceanphere', 'Cross Pattaya Oceanphere', 'hotels-resorts', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', '["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80"]', 'งานถ่ายภาพสถาปัตยกรรมและโปรดักชันคอนเทนต์วิดีโอวิลล่าระดับ 5 ดาว ถ่ายทอดความสงบและความหรูหรา', 'โปรเจกต์การถ่ายภาพและผลิตมีเดียเต็มรูปแบบสำหรับ Cross Pattaya Oceanphere โดยเน้นสถาปัตยกรรม Geometric, สระว่ายน้ำส่วนตัว และบรรยากาศ Private Dining นำเสนอผ่านวิดีโอสั้นและอัลบั้มภาพที่ทำยอด Reach รวมกว่า 1.2 ล้านวิว', 1, 1, 1),
(2, 'The Politan Aqua — Waterfront High-Rise Showcase', 'the-politan-aqua', 'The Politan Aqua', 'real-estate', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', '["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"]', 'โปรดักชันถ่ายภาพอาคารสูงริมแม่น้ำเจ้าพระยา และงานตัดต่อวิดีโอพาทัวร์ห้องตัวอย่าง', 'การถ่ายภาพ Exterior สถาปัตยกรรมริมน้ำยามค่ำคืนและห้องจำลองสไตล์โมเดิร์น พร้อมสื่อสารจุดขายวิวแม่น้ำแบบ Panoramic 180 องศาเพื่อสนับสนุนทีมขายอสังหาริมทรัพย์', 1, 2, 1),
(3, 'Pavilion Samui Villas & Resort — Tropical Paradise Branding', 'pavilion-samui', 'Pavilion Samui Villas & Resort', 'hotels-resorts', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80', '["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"]', 'บริการถ่ายภาพโรงแรมติดชายหาดหาดละไมและจัดทำแคมเปญอินฟลูเอนเซอร์ช่วง High Season', 'ยกระดับภาพลักษณ์บูทีครีสอร์ทริมทะเลเกาะสมุย เน้นเฉดสีธรรมชาติ แสงแดดเขตร้อน และการพักผ่อนเพื่อสุขภาพ', 1, 3, 1),
(4, 'Rachabura Hotel — Riverside Industrial Chic', 'rachabura-hotel', 'Rachabura Hotel', 'hotels-resorts', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', '["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"]', 'งานภาพถ่ายดีไซน์อิฐแดงและสถาปัตยกรรมร่วมสมัยริมแม่น้ำแม่กลอง จังหวัดราชบุรี', 'ชูจุดเด่นสถาปัตยกรรมที่มีเอกลักษณ์ ผสมผสานความดิบของอิฐและสายน้ำ เพื่อดึงดูดกลุ่มนักท่องเที่ยวสายถ่ายภาพและคาเฟ่ฮอปเปอร์', 0, 4, 1),
(5, 'Suncave Cafe & Roastery — Signature Menu & Social Launch', 'suncave-cafe', 'Suncave Cafe', 'food-beverage', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80', '["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80"]', 'การถ่ายภาพอาหารและเครื่องดื่ม Specialty Coffee พร้อมแคมเปญเปิดตัวบน TikTok', 'สร้าง Storytelling ผ่านภาพเมล็ดกาแฟคั่วพิเศษ กลิ่นหอม และเบเกอรีอบสดใหม่ ดันยอด Engagement สูงสุดในสัปดาห์แรกของการเปิดร้าน', 1, 5, 1);
INSERT OR REPLACE INTO articles (id, title, slug, summary, content, cover_image, author, tags, status, published_at) VALUES
(1, 'เจาะลึก 5 เทรนด์ Short-Form Video ที่แบรนด์โรงแรมและร้านอาหารต้องรู้ในปี 2026', '5-short-video-trends-2026', 'วิดีโอสั้นไม่ใช่แค่เรื่องของความสนุก แต่คือเครื่องมือปิดการขายที่ทรงพลังที่สุดสำหรับธุรกิจท่องเที่ยวและบริการ', 'เนื้อหาบทความวิเคราะห์ถึงพฤติกรรมผู้บริโภคที่เปลี่ยนไป การใช้ Micro-influencer ร่วมกับ Short-form storytelling และการวางโครงสร้าง 3 วินาทีแรก (Hook) เพื่อดึงดูดสายตา...', 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80', 'LTT Content Team', '["ShortVideo", "DigitalMarketing", "Hospitality"]', 'published', CURRENT_TIMESTAMP),
(2, 'ทำไมภาพถ่าย Interior & Exterior ถึงส่งผลต่ออัตราการจองโรงแรมมากกว่าราคาห้องพัก', 'power-of-architectural-photography', 'ถอดรหัสจิตวิทยาลูกค้ากับการตัดสินใจเลือกจองที่พักจากรูปถ่ายเชิงสถาปัตยกรรมและการจัดแสง', 'เมื่อผู้เข้าชมเข้ามาในแพลตฟอร์ม OTA หรือหน้าเว็บไซต์ รูปภาพคือสิ่งแรกที่กำหนดความคาดหวัง การใช้ช่างภาพสถาปัตยกรรมมืออาชีพช่วยเพิ่ม Conversion Rate ได้สูงถึง 42%...', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80', 'LTT Production Team', '["Photography", "HotelBranding", "ConversionRate"]', 'published', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO client_logos (id, name, logo_url, website_url, sort_order, is_active) VALUES
(1, 'Cross Hotels & Resorts', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80', 'https://crosshotelsandresorts.com', 1, 1),
(2, 'The Politan Aqua', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80', 'https://thepolitancondo.com', 2, 1),
(3, 'Pavilion Samui', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80', 'https://pavilionsamui.com', 3, 1),
(4, 'Rachabura Hotel', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80', 'https://rachaburahotel.com', 4, 1),
(5, 'Suncave Cafe', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80', 'https://suncavecafe.com', 5, 1);
INSERT OR REPLACE INTO inquiries (id, full_name, email, phone, company, service_interested, budget_range, message, status) VALUES
(1, 'คุณกิตติศักดิ์ อัศวเดช', 'kittisak@resortandspa.com', '081-234-5678', 'Andaman Luxury Villas', 'Commercial Photography & Production', '50,000 - 100,000 THB', 'สนใจทีมงานเข้าไปถ่ายภาพรีสอร์ทเปิดใหม่ที่ภูเก็ต ทั้งหมด 12 พูลวิลล่า และต้องการวิดีโอสั้นสำหรับทำแคมเปญช่วงต้นเดือนหน้าครับ', 'new'),
(2, 'คุณพิมลวรรณ สุขสมบูรณ์', 'pim@craftbakery.co', '089-876-5432', 'The Artisans Bakery', 'Digital Marketing & Social Media', '30,000 - 50,000 THB/เดือน', 'ต้องการให้ดูแลเพจ Facebook และทำคอนเทนต์ TikTok รายเดือนเพื่อโปรโมทสาขาใหม่ที่อารีย์ค่ะ', 'contacted');
INSERT OR REPLACE INTO navigation_menus (id, label, path, is_external, sort_order, is_active) VALUES
(1, 'หน้าแรก', '/', 0, 1, 1),
(2, 'บริการของเรา', '/our-service', 0, 2, 1),
(3, 'ผลงาน', '/portfolio', 0, 3, 1),
(4, 'เกี่ยวกับเรา', '/about-us', 0, 4, 1),
(5, 'บทความ & ข่าวสาร', '/blog', 0, 5, 1),
(6, 'ติดต่อเรา', '/contact-us', 0, 6, 1);
