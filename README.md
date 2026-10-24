# LTT Ma getThink Web CMS (Cloudflare Global Edge Platform)

ระบบบริหารจัดการเว็บไซต์และเนื้อหา (CMS) สำหรับ **บริษัท แอล ที ที มา เกท ธิงค์ จำกัด (LTT Ma getThink Co., Ltd.)** ออกแบบสถาปัตยกรรมแบบ Decoupled แยกหน้าบ้านและหลังบ้านอย่างอิสระ พร้อมระบบซิงก์ข้อมูลแบบ Real-Time และความปลอดภัยระดับ Zero-Trust ผ่าน Cloudflare Global Network

---

## 🏛️ โครงสร้างระบบ (Architecture Overview)

* **ระบบหน้าบ้าน (Frontend):** โฮสต์บน **Cloudflare Pages** (`https://www.lttmagetthink.co`) ออกแบบตามอัตลักษณ์ของ [lttmagetthink.co](https://lttmagetthink.co/) เน้นความหรูหรา โหลดเร็วระดับมิลลิวินาที สวยงาม รองรับทุกขนาดหน้าจอ
* **ระบบหลังบ้าน (Backend CMS):** โฮสต์บน **Cloudflare Workers** (`https://cms.lttmagetthink.co`)
  * ไม่ต้องมีระบบ Login เอง: ป้องกันด้วย **Cloudflare Zero Trust (Access)** คัดกรองอีเมลและ OTP ระดับเครือข่าย Edge
  * Single Page Application Dashboard เมนูครบครัน: Dashboard, Portfolios, Services, Blog & Events, Client Logos, Inquiries (Leads Inbox), Media Library, และ Site Settings & SEO
* **ฐานข้อมูล (Database):** **Cloudflare D1** (Serverless SQLite at Edge)
* **คลังจัดเก็บสื่อ (Object Storage):** **Cloudflare R2** (Zero Egress fee)
* **กลไกการ Sync ข้อมูล:** เขียนลง D1 โดยตรง พร้อมส่งคำสั่ง Cache Purge Webhook ไปยังหน้าบ้านเพื่ออัปเดตแบบ Real-Time ทันทีที่บันทึก

---

## 📁 โครงสร้างโปรเจกต์ (Directory Structure)

```text
/Users/navi/GeminiCLI/CMS/
├── backend/                        # Cloudflare Worker API & CMS Backoffice
│   ├── src/
│   │   ├── index.ts                # Worker Entrypoint
│   │   ├── types.ts                # TypeScript Types & Interfaces
│   │   ├── middleware/
│   │   │   ├── auth.ts             # Cloudflare Access Zero Trust Middleware
│   │   │   └── security.ts         # Security Headers, CORS & XSS Sanitizer
│   │   ├── routes/
│   │   │   ├── public.ts           # Public API for Frontend (D1 Queries)
│   │   │   └── admin.ts            # Protected Admin API for CMS CRUD
│   │   └── views/
│   │       └── adminUi.ts          # Embedded Modern Admin SPA Dashboard
│   ├── schema.sql                  # D1 Database Schema
│   ├── seed.sql                    # Initial Data (Matching lttmagetthink.co)
│   ├── wrangler.toml               # Worker, D1 & R2 Configuration
│   └── package.json
│
├── frontend/                       # Cloudflare Pages Frontend Website
│   ├── public/
│   │   └── index.html              # High-Performance UI matching lttmagetthink.co
│   ├── wrangler.toml               # Cloudflare Pages Configuration
│   └── package.json
│
└── devsecops/                      # Security & Deployment Architecture
    ├── cloudflare-access-setup.md  # คู่มือตั้งค่า Cloudflare Zero Trust Access
    └── security-audit.md           # รายงานการตรวจสอบความปลอดภัย OWASP Top 10
```

---

## 🛠️ ขั้นตอนการรันและทดสอบระบบบนเครื่อง Local

### 1. ติดตั้ง Dependencies และทดสอบ Backend CMS:
```bash
cd backend
npm install

# ติดตั้ง D1 Local Database และ Seed ข้อมูล
npx wrangler d1 execute ltt-cms-db --local --file=./schema.sql
npx wrangler d1 execute ltt-cms-db --local --file=./seed.sql

# รัน Worker Dev Server (พอร์ต 8787)
npx wrangler dev
```
* เข้าใช้งานระบบจัดการหลังบ้านได้ที่: `http://localhost:8787/admin`
* ตรวจสอบ Public API ได้ที่: `http://localhost:8787/api/public/services`

### 2. รันหน้าบ้าน Frontend:
```bash
cd ../frontend
npx serve public -l 3000
```
* เปิดเบราว์เซอร์เข้าชมเว็บหน้าบ้านได้ที่: `http://localhost:3000`

---

## 🚀 ขั้นตอนการ Deploy ขึ้น Cloudflare จริง

### 1. สร้าง Cloudflare D1 Database และ R2 Bucket:
```bash
# สร้าง D1 Database
npx wrangler d1 create ltt-cms-db

# สร้าง R2 Storage
npx wrangler r2 bucket create ltt-cms-media
```
*(นำ database_id ที่ได้ไปอัปเดตในไฟล์ `backend/wrangler.toml`)*

### 2. Initialize Database บน Cloudflare D1:
```bash
cd backend
npx wrangler d1 execute ltt-cms-db --remote --file=./schema.sql
npx wrangler d1 execute ltt-cms-db --remote --file=./seed.sql
```

### 3. Deploy Backend CMS (Cloudflare Worker):
```bash
cd backend
npx wrangler deploy
```

### 4. Deploy Frontend (Cloudflare Pages):
```bash
cd ../frontend
npx wrangler pages deploy public --project-name=ltt-website
```

### 5. ตั้งค่า Cloudflare Zero Trust (Access) ให้ระบบหลังบ้าน:
ทำตามขั้นตอนใน [devsecops/cloudflare-access-setup.md](file:///Users/navi/GeminiCLI/CMS/devsecops/cloudflare-access-setup.md) เพื่อกำหนดสิทธิ์ให้อนุญาตเฉพาะทีมงานที่ผ่าน Cloudflare Access เท่านั้น
