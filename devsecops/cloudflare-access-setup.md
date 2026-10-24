# Cloudflare Zero Trust (Access) Setup Guide
**Domain:** `cms.lttmagetthink.co` (Backend CMS)

ระบบหลังบ้านออกแบบตามมาตรฐาน **Zero Trust Architecture** ไม่จำเป็นต้องพัฒนาระบบ Login / Password ด้วยตนเอง โดยใช้ **Cloudflare Access** เป็นเกตเวย์คัดกรองความปลอดภัยระดับ Edge

---

## 🚀 ขั้นตอนการตั้งค่าใน Cloudflare Dashboard

### ขั้นตอนที่ 1: เปิดใช้งาน Cloudflare Zero Trust
1. ล็อกอินเข้าสู่ [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. ในแถบเมนูด้านซ้าย เลือก **Zero Trust**
3. หากเป็นการใช้งานครั้งแรก ตั้งค่า Team Name (เช่น `lttmagetthink`) แล้วเลือก Free Plan (รองรับได้สูงสุด 50 ผู้ใช้งานฟรี)

### ขั้นตอนที่ 2: เพิ่ม Self-Hosted Access Application
1. ภายใน Zero Trust Dashboard ไปที่ **Access** > **Applications**
2. คลิกปุ่ม **Add an application** แล้วเลือก **Self-hosted**
3. กำหนดค่าพื้นฐานของ Application:
   * **Application name:** `LTT CMS Backoffice`
   * **Session Duration:** `24 hours`
   * **Application domain:**
     * Subdomain: `cms`
     * Domain: `lttmagetthink.co` (หรือโดเมนของคุณ)
     * Path: ว่างไว้ (เพื่อคลุมทั้งเว็บหลังบ้าน `/*`)

### ขั้นตอนที่ 3: กำหนด Policy การเข้าถึง (ใครมีสิทธิ์เข้าได้บ้าง)
1. ในหน้า **Add Access Policy**:
   * **Policy name:** `Authorized Staff Only`
   * **Action:** `Allow`
2. กำหนดกฎ **Configure rules (Include)**:
   * **Selector:** `Emails` หรือ `Emails ending in`
   * **Value:** ระบุอีเมลของทีมงาน เช่น `admin@lttmagetthink.co`, หรือโดเมน `@lttmagetthink.co`
3. ในส่วน **Authentication method**:
   * เลือก **One-Time PIN (OTP)**: ผู้ใช้จะได้รับรหัส PIN 6 หลักทางอีเมลทุกครั้งที่เข้าสู่ระบบ
   * หรือเชื่อมต่อกับ **Google Workspace / Microsoft Entra ID (Azure AD)**

### ขั้นตอนที่ 4: เชื่อมต่อ Worker กับ Cloudflare Access Audience Tag
1. เมื่อสร้าง Application เสร็จ ให้คัดลอกค่า **AUD (Audience Tag)** ของ Application
2. นำไปใส่ใน `backend/wrangler.toml`:
   ```toml
   [vars]
   CF_ACCESS_POLICY_AUD = "xxxx-your-audience-tag-xxxx"
   CF_ACCESS_TEAM_DOMAIN = "https://lttmagetthink.cloudflareaccess.com"
   ```
3. รันคำสั่ง `npx wrangler deploy` เพื่ออัปเดต Worker

---

## 🛡️ กลไกความปลอดภัยฝั่ง Worker (Defense-in-Depth)
ถึงแม้ผู้ไม่ประสงค์ดีจะพยายาม Bypass หรือยิง Request ตรงเข้ามายัง Worker ตัว Worker จะตรวจจับ Header:
* `Cf-Access-Jwt-Assertion`
* `CF-Access-Authenticated-User-Email`

หากไม่พบ Header ที่ถูกต้อง หรือ Signature ไม่ตรงกับ Cloudflare Edge Worker จะปฏิเสธการเข้าถึงด้วย HTTP `401 Unauthorized` ทันที!
