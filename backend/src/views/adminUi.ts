export function renderAdminHtml(userEmail: string): string {
  return `<!DOCTYPE html>
<html lang="th" class="h-full bg-slate-900 text-slate-100">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LTT Ma getThink — Edge CMS Backoffice</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', 'Noto Sans Thai', sans-serif; }
    .glass-card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
    .active-nav { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.39); }
    [x-cloak] { display: none !important; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.8/dist/cdn.min.js" defer></script>
</head>
<body class="h-full flex overflow-hidden" x-data="adminApp()" x-init="init()">

  <!-- Sidebar -->
  <aside class="w-64 bg-slate-950/80 border-r border-slate-800/80 flex flex-col shrink-0 z-20">
    <div class="h-16 flex items-center px-6 gap-3 border-b border-slate-800">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/30">
        L
      </div>
      <div>
        <h1 class="font-bold text-sm tracking-wide text-white">LTT Ma getThink</h1>
        <p class="text-[11px] text-blue-400 font-medium">Edge Backoffice CMS</p>
      </div>
    </div>

    <!-- Nav Items -->
    <nav class="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
      <button @click="currentTab = 'dashboard'" :class="currentTab === 'dashboard' ? 'active-nav' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all">
        <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
        <span>Dashboard ภาพรวม</span>
      </button>

      <button @click="currentTab = 'portfolios'" :class="currentTab === 'portfolios' ? 'active-nav' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all">
        <i data-lucide="briefcase" class="w-4 h-4"></i>
        <span>Portfolios ผลงาน</span>
      </button>

      <button @click="currentTab = 'services'" :class="currentTab === 'services' ? 'active-nav' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all">
        <i data-lucide="sparkles" class="w-4 h-4"></i>
        <span>Services บริการ</span>
      </button>

      <button @click="currentTab = 'articles'" :class="currentTab === 'articles' ? 'active-nav' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all">
        <i data-lucide="newspaper" class="w-4 h-4"></i>
        <span>Blog & Events บทความ</span>
      </button>

      <button @click="currentTab = 'clients'" :class="currentTab === 'clients' ? 'active-nav' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all">
        <i data-lucide="building-2" class="w-4 h-4"></i>
        <span>Client Logos ลูกค้า</span>
      </button>

      <button @click="currentTab = 'inquiries'" :class="currentTab === 'inquiries' ? 'active-nav' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all justify-between">
        <div class="flex items-center gap-3">
          <i data-lucide="inbox" class="w-4 h-4"></i>
          <span>Inquiries ข้อความติดต่อ</span>
        </div>
        <span x-show="stats.new_inquiries > 0" x-text="stats.new_inquiries" class="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"></span>
      </button>

      <button @click="currentTab = 'settings'" :class="currentTab === 'settings' ? 'active-nav' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all">
        <i data-lucide="settings" class="w-4 h-4"></i>
        <span>Site Settings & SEO</span>
      </button>
    </nav>

    <!-- Cloudflare Access Badge -->
    <div class="p-3 border-t border-slate-800/80">
      <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
        <div class="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Zero Trust Protected</span>
        </div>
        <p class="text-slate-400 truncate" title="${userEmail}">${userEmail}</p>
        <p class="text-[10px] text-slate-500 mt-1">Cloudflare Access Active</p>
      </div>
    </div>
  </aside>

  <!-- Main Content Area -->
  <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
    <!-- Top Bar -->
    <header class="h-16 border-b border-slate-800 bg-slate-950/40 backdrop-blur px-8 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-3">
        <h2 class="text-base font-bold text-white capitalize" x-text="currentTab"></h2>
        <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">Cloudflare D1 Live</span>
      </div>

      <div class="flex items-center gap-3">
        <button @click="triggerCachePurge()" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition">
          <i data-lucide="refresh-cw" class="w-3.5 h-3.5" :class="isPurging ? 'animate-spin' : ''"></i>
          <span>Sync & Purge Cache</span>
        </button>
        <a href="/" target="_blank" class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-md shadow-blue-500/20 transition">
          <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
          <span>ดูเว็บหน้าบ้าน</span>
        </a>
      </div>
    </header>

    <!-- Scrollable Body -->
    <main class="flex-1 overflow-y-auto p-8 space-y-8">

      <!-- ================= 1. TAB: DASHBOARD ================= -->
      <section x-show="currentTab === 'dashboard'" class="space-y-6">
        <!-- Stats Row -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div class="glass-card p-5 rounded-2xl">
            <div class="flex items-center justify-between text-slate-400 text-xs mb-3">
              <span>ข้อความติดต่อทั้งหมด</span>
              <i data-lucide="mail" class="w-4 h-4 text-blue-400"></i>
            </div>
            <div class="text-2xl font-bold text-white" x-text="stats.total_inquiries">0</div>
            <p class="text-[11px] text-emerald-400 mt-2 font-medium flex items-center gap-1">
              <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
              <span x-text="stats.new_inquiries">0</span> ข้อความใหม่ที่ยังไม่ได้ติดต่อ
            </p>
          </div>

          <div class="glass-card p-5 rounded-2xl">
            <div class="flex items-center justify-between text-slate-400 text-xs mb-3">
              <span>ผลงานในระบบ (Portfolios)</span>
              <i data-lucide="image" class="w-4 h-4 text-indigo-400"></i>
            </div>
            <div class="text-2xl font-bold text-white" x-text="stats.total_portfolios">0</div>
            <p class="text-[11px] text-slate-400 mt-2">แสดงบนหน้าแรกและหมวดหมู่อสังหาฯ/โรงแรม</p>
          </div>

          <div class="glass-card p-5 rounded-2xl">
            <div class="flex items-center justify-between text-slate-400 text-xs mb-3">
              <span>บริการหลัก (Services)</span>
              <i data-lucide="layers" class="w-4 h-4 text-emerald-400"></i>
            </div>
            <div class="text-2xl font-bold text-white" x-text="stats.total_services">0</div>
            <p class="text-[11px] text-slate-400 mt-2">พร้อม Bullet points และไอคอนครบถ้วน</p>
          </div>

          <div class="glass-card p-5 rounded-2xl">
            <div class="flex items-center justify-between text-slate-400 text-xs mb-3">
              <span>บทความ & ข่าวสาร</span>
              <i data-lucide="file-text" class="w-4 h-4 text-amber-400"></i>
            </div>
            <div class="text-2xl font-bold text-white" x-text="stats.total_articles">0</div>
            <p class="text-[11px] text-slate-400 mt-2">อัปเดตเทรนด์การตลาดสม่ำเสมอ</p>
          </div>
        </div>

        <!-- Recent Inquiries Section -->
        <div class="glass-card rounded-2xl p-6">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-sm font-bold text-white">ข้อความติดต่อล่าสุด (Recent Leads)</h3>
              <p class="text-xs text-slate-400">ลูกค้าที่สนใจบริการและกรอกฟอร์มจากหน้าบ้าน</p>
            </div>
            <button @click="currentTab = 'inquiries'" class="text-xs text-blue-400 hover:text-blue-300 font-medium">ดูทั้งหมด &rarr;</button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="text-slate-400 border-b border-slate-800">
                <tr>
                  <th class="pb-3 font-semibold">ชื่อลูกค้า</th>
                  <th class="pb-3 font-semibold">บริษัท / ธุรกิจ</th>
                  <th class="pb-3 font-semibold">บริการที่สนใจ</th>
                  <th class="pb-3 font-semibold">สถานะ</th>
                  <th class="pb-3 font-semibold">วันที่</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                <template x-for="inq in stats.recent_inquiries" :key="inq.id">
                  <tr class="hover:bg-slate-800/30">
                    <td class="py-3 font-medium text-white" x-text="inq.full_name"></td>
                    <td class="py-3 text-slate-300" x-text="inq.company || '-'"></td>
                    <td class="py-3 text-slate-300" x-text="inq.service_interested || '-'"></td>
                    <td class="py-3">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        :class="inq.status === 'new' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'"
                        x-text="inq.status"></span>
                    </td>
                    <td class="py-3 text-slate-400" x-text="formatDate(inq.created_at)"></td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ================= 2. TAB: PORTFOLIOS ================= -->
      <section x-show="currentTab === 'portfolios'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold text-white">จัดการผลงาน (Portfolio Management)</h3>
            <p class="text-xs text-slate-400">ผลงานสำหรับแสดงในหน้าแรกและหน้า Showcase ตามแบบ lttmagetthink.co</p>
          </div>
          <button @click="openCreatePortfolioModal()" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>เพิ่มผลงานใหม่</span>
          </button>
        </div>

        <!-- Portfolios Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <template x-for="item in portfolios" :key="item.id">
            <div class="glass-card rounded-2xl overflow-hidden group hover:border-slate-700 transition flex flex-col">
              <div class="relative h-44 w-full bg-slate-800 overflow-hidden">
                <img :src="item.cover_image" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="">
                <span class="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur text-[10px] font-semibold text-white uppercase tracking-wider" x-text="item.category_slug"></span>
                <span x-show="item.featured" class="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-blue-500 text-[10px] font-bold text-white">Featured</span>
              </div>
              <div class="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 class="font-bold text-sm text-white mb-1" x-text="item.title"></h4>
                  <p class="text-xs text-blue-400 font-medium mb-2" x-text="item.client_name"></p>
                  <p class="text-xs text-slate-400 line-clamp-2" x-text="item.summary"></p>
                </div>
                <div class="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span class="text-[11px] text-slate-500">ลำดับ: <span x-text="item.sort_order"></span></span>
                  <div class="flex items-center gap-2">
                    <button @click="editPortfolio(item)" class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition">
                      <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                    <button @click="deletePortfolio(item.id)" class="p-1.5 rounded-lg hover:bg-rose-900/30 text-rose-400 hover:text-rose-300 transition">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </section>

      <!-- ================= 3. TAB: SERVICES ================= -->
      <section x-show="currentTab === 'services'" class="space-y-6">
        <div>
          <h3 class="text-base font-bold text-white">จัดการบริการ (Services Management)</h3>
          <p class="text-xs text-slate-400">แก้ไขเนื้อหาบริการ จุดเด่น (Bullet Points) และไอคอน</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <template x-for="svc in services" :key="svc.id">
            <div class="glass-card rounded-2xl p-6 space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    <i data-lucide="check-circle" class="w-5 h-5"></i>
                  </div>
                  <div>
                    <h4 class="font-bold text-sm text-white" x-text="svc.title"></h4>
                    <span class="text-[11px] text-slate-400" x-text="svc.slug"></span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
              </div>

              <div>
                <label class="text-[11px] text-slate-400 font-semibold block mb-1">คำโปรย (Subtitle)</label>
                <input type="text" x-model="svc.subtitle" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500">
              </div>

              <div>
                <label class="text-[11px] text-slate-400 font-semibold block mb-1">รายละเอียด (Description)</label>
                <textarea x-model="svc.description" rows="3" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"></textarea>
              </div>

              <div class="flex justify-end">
                <button @click="saveService(svc)" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition">
                  บันทึกบริการนี้
                </button>
              </div>
            </div>
          </template>
        </div>
      </section>

      <!-- ================= 4. TAB: ARTICLES ================= -->
      <section x-show="currentTab === 'articles'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold text-white">บทความ & ข่าวสาร (Blog & Events)</h3>
            <p class="text-xs text-slate-400">เขียนและเผยแพร่บทความเพื่อสร้างความน่าเชื่อถือและ SEO</p>
          </div>
          <button @click="openCreateArticleModal()" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>เขียนบทความใหม่</span>
          </button>
        </div>

        <div class="glass-card rounded-2xl overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="text-slate-400 border-b border-slate-800 bg-slate-950/40">
              <tr>
                <th class="p-4 font-semibold">ชื่อบทความ</th>
                <th class="p-4 font-semibold">ผู้เขียน</th>
                <th class="p-4 font-semibold">สถานะ</th>
                <th class="p-4 font-semibold">วันที่เผยแพร่</th>
                <th class="p-4 font-semibold text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <template x-for="art in articles" :key="art.id">
                <tr class="hover:bg-slate-800/30">
                  <td class="p-4 font-medium text-white max-w-xs truncate" x-text="art.title"></td>
                  <td class="p-4 text-slate-300" x-text="art.author"></td>
                  <td class="p-4">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase" x-text="art.status"></span>
                  </td>
                  <td class="p-4 text-slate-400" x-text="formatDate(art.published_at)"></td>
                  <td class="p-4 text-right">
                    <button @click="deleteArticle(art.id)" class="p-1.5 rounded-lg hover:bg-rose-900/30 text-rose-400 transition">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ================= 5. TAB: CLIENT LOGOS ================= -->
      <section x-show="currentTab === 'clients'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold text-white">โลโก้ลูกค้า & แบรนด์พาร์ทเนอร์</h3>
            <p class="text-xs text-slate-400">สำหรับแสดงบนแถบ Infinite Carousel หน้าแรก</p>
          </div>
          <button @click="addClientPrompt()" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>เพิ่มโลโก้ใหม่</span>
          </button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <template x-for="cl in clientLogos" :key="cl.id">
            <div class="glass-card rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3 relative group">
              <button @click="deleteClientLogo(cl.id)" class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 transition">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
              </button>
              <img :src="cl.logo_url" class="h-10 w-24 object-contain rounded filter grayscale hover:grayscale-0 transition" alt="">
              <span class="text-xs font-medium text-slate-300" x-text="cl.name"></span>
            </div>
          </template>
        </div>
      </section>

      <!-- ================= 6. TAB: INQUIRIES ================= -->
      <section x-show="currentTab === 'inquiries'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold text-white">กล่องข้อความติดต่อ (Inquiries & Leads)</h3>
            <p class="text-xs text-slate-400">ข้อความจากลูกค้าที่ต้องการขอใบเสนอราคาหรือปรึกษาโปรเจกต์</p>
          </div>
          <a href="/api/admin/inquiries/export.csv" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition">
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>Export เป็น CSV</span>
          </a>
        </div>

        <div class="glass-card rounded-2xl overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="text-slate-400 border-b border-slate-800 bg-slate-950/40">
              <tr>
                <th class="p-4 font-semibold">ชื่อลูกค้า</th>
                <th class="p-4 font-semibold">อีเมล & เบอร์โทร</th>
                <th class="p-4 font-semibold">บริษัท / บริการ</th>
                <th class="p-4 font-semibold">งบประมาณ & ข้อความ</th>
                <th class="p-4 font-semibold">สถานะ</th>
                <th class="p-4 font-semibold">วันที่</th>
                <th class="p-4 font-semibold text-right">เปลี่ยนสถานะ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <template x-for="inq in inquiries" :key="inq.id">
                <tr class="hover:bg-slate-800/30">
                  <td class="p-4 font-semibold text-white" x-text="inq.full_name"></td>
                  <td class="p-4 text-slate-300">
                    <div x-text="inq.email"></div>
                    <div class="text-[11px] text-blue-400" x-text="inq.phone"></div>
                  </td>
                  <td class="p-4 text-slate-300">
                    <div class="font-medium" x-text="inq.company || '-'"></div>
                    <div class="text-[11px] text-slate-400" x-text="inq.service_interested"></div>
                  </td>
                  <td class="p-4 text-slate-300 max-w-xs">
                    <div class="text-amber-400 text-[11px] font-semibold" x-text="inq.budget_range"></div>
                    <p class="text-slate-400 line-clamp-2 mt-1" x-text="inq.message"></p>
                  </td>
                  <td class="p-4">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                      :class="{
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30': inq.status === 'new',
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30': inq.status === 'in_progress',
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30': inq.status === 'contacted',
                        'bg-slate-500/20 text-slate-400 border border-slate-500/30': inq.status === 'closed'
                      }"
                      x-text="inq.status"></span>
                  </td>
                  <td class="p-4 text-slate-400" x-text="formatDate(inq.created_at)"></td>
                  <td class="p-4 text-right">
                    <select @change="updateInquiryStatus(inq.id, $event.target.value)" class="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none">
                      <option value="new" :selected="inq.status === 'new'">New</option>
                      <option value="in_progress" :selected="inq.status === 'in_progress'">In Progress</option>
                      <option value="contacted" :selected="inq.status === 'contacted'">Contacted</option>
                      <option value="closed" :selected="inq.status === 'closed'">Closed</option>
                    </select>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ================= 7. TAB: SITE SETTINGS & SEO ================= -->
      <section x-show="currentTab === 'settings'" class="space-y-6">
        <div>
          <h3 class="text-base font-bold text-white">ตั้งค่าเว็บไซต์ & SEO (Site Settings)</h3>
          <p class="text-xs text-slate-400">แก้ไขข้อมูลการติดต่อ, Social Media, และข้อความพาดหัว Hero หน้าแรก</p>
        </div>

        <div class="glass-card rounded-2xl p-6 space-y-6 max-w-4xl">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="text-xs text-slate-400 font-semibold block mb-1.5">ชื่อบริษัท / องค์กร</label>
              <input type="text" x-model="settingsMap.company_name" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500">
            </div>

            <div>
              <label class="text-xs text-slate-400 font-semibold block mb-1.5">Brand Tagline</label>
              <input type="text" x-model="settingsMap.tagline" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500">
            </div>

            <div class="md:col-span-2">
              <label class="text-xs text-slate-400 font-semibold block mb-1.5">Hero Headline (พาดหัวหลักหน้าแรก)</label>
              <input type="text" x-model="settingsMap.hero_headline" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500">
            </div>

            <div class="md:col-span-2">
              <label class="text-xs text-slate-400 font-semibold block mb-1.5">Hero Subheadline (คำโปรยใต้พาดหัว)</label>
              <textarea x-model="settingsMap.hero_subheadline" rows="2" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"></textarea>
            </div>

            <div>
              <label class="text-xs text-slate-400 font-semibold block mb-1.5">เบอร์โทรศัพท์ติดต่อ</label>
              <input type="text" x-model="settingsMap.phone" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500">
            </div>

            <div>
              <label class="text-xs text-slate-400 font-semibold block mb-1.5">อีเมลติดต่อ</label>
              <input type="email" x-model="settingsMap.email" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500">
            </div>

            <div>
              <label class="text-xs text-slate-400 font-semibold block mb-1.5">LINE Official ID</label>
              <input type="text" x-model="settingsMap.line_oa" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500">
            </div>

            <div>
              <label class="text-xs text-slate-400 font-semibold block mb-1.5">Facebook Page URL</label>
              <input type="text" x-model="settingsMap.facebook_url" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500">
            </div>

            <div class="md:col-span-2">
              <label class="text-xs text-slate-400 font-semibold block mb-1.5">ที่ตั้งสำนักงาน</label>
              <input type="text" x-model="settingsMap.address" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500">
            </div>
          </div>

          <div class="pt-4 border-t border-slate-800 flex justify-end">
            <button @click="saveSiteSettings()" class="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition">
              บันทึกการตั้งค่าทั้งหมด
            </button>
          </div>
        </div>
      </section>

    </main>
  </div>

  <script>
    function adminApp() {
      return {
        currentTab: 'dashboard',
        isPurging: false,
        stats: { total_inquiries: 0, new_inquiries: 0, total_portfolios: 0, total_services: 0, total_articles: 0, recent_inquiries: [] },
        portfolios: [],
        services: [],
        articles: [],
        clientLogos: [],
        inquiries: [],
        settingsMap: {},

        async init() {
          await this.loadAll();
          this.$nextTick(() => { lucide.createIcons(); });
        },

        async loadAll() {
          await Promise.all([
            this.loadStats(),
            this.loadPortfolios(),
            this.loadServices(),
            this.loadArticles(),
            this.loadClientLogos(),
            this.loadInquiries(),
            this.loadSettings()
          ]);
          this.$nextTick(() => { lucide.createIcons(); });
        },

        async loadStats() {
          try {
            const res = await fetch('/api/admin/dashboard/stats');
            const data = await res.json();
            if (data.success) this.stats = data.data;
          } catch (e) { console.error(e); }
        },

        async loadPortfolios() {
          try {
            const res = await fetch('/api/admin/portfolios');
            const data = await res.json();
            if (data.success) this.portfolios = data.data;
          } catch (e) { console.error(e); }
        },

        async loadServices() {
          try {
            const res = await fetch('/api/admin/services');
            const data = await res.json();
            if (data.success) this.services = data.data;
          } catch (e) { console.error(e); }
        },

        async loadArticles() {
          try {
            const res = await fetch('/api/admin/articles');
            const data = await res.json();
            if (data.success) this.articles = data.data;
          } catch (e) { console.error(e); }
        },

        async loadClientLogos() {
          try {
            const res = await fetch('/api/admin/client-logos');
            const data = await res.json();
            if (data.success) this.clientLogos = data.data;
          } catch (e) { console.error(e); }
        },

        async loadInquiries() {
          try {
            const res = await fetch('/api/admin/inquiries');
            const data = await res.json();
            if (data.success) this.inquiries = data.data;
          } catch (e) { console.error(e); }
        },

        async loadSettings() {
          try {
            const res = await fetch('/api/admin/site-settings');
            const data = await res.json();
            if (data.success) {
              const map = {};
              data.data.forEach(item => { map[item.key] = item.value; });
              this.settingsMap = map;
            }
          } catch (e) { console.error(e); }
        },

        async triggerCachePurge() {
          this.isPurging = true;
          try {
            const res = await fetch('/api/admin/sync/purge-cache', { method: 'POST' });
            const data = await res.json();
            alert(data.message || 'Cache purged successfully!');
          } catch (e) {
            alert('Cache purge completed.');
          } finally {
            this.isPurging = false;
          }
        },

        async saveSiteSettings() {
          const list = Object.keys(this.settingsMap).map(k => ({ key: k, value: this.settingsMap[k] }));
          const res = await fetch('/api/admin/site-settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: list })
          });
          const data = await res.json();
          alert(data.message || 'บันทึกเรียบร้อย');
        },

        async saveService(svc) {
          const res = await fetch('/api/admin/services/' + svc.id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(svc)
          });
          const data = await res.json();
          alert(data.message || 'บันทึกเรียบร้อย');
        },

        async updateInquiryStatus(id, newStatus) {
          await fetch('/api/admin/inquiries/' + id + '/status', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          await this.loadInquiries();
          await this.loadStats();
        },

        async deletePortfolio(id) {
          if (!confirm('ยืนยันลบผลงานนี้?')) return;
          await fetch('/api/admin/portfolios/' + id, { method: 'DELETE' });
          await this.loadPortfolios();
          await this.loadStats();
        },

        async deleteArticle(id) {
          if (!confirm('ยืนยันลบบทความนี้?')) return;
          await fetch('/api/admin/articles/' + id, { method: 'DELETE' });
          await this.loadArticles();
          await this.loadStats();
        },

        async deleteClientLogo(id) {
          if (!confirm('ยืนยันลบโลโก้นี้?')) return;
          await fetch('/api/admin/client-logos/' + id, { method: 'DELETE' });
          await this.loadClientLogos();
        },

        async openCreatePortfolioModal() {
          const title = prompt('ชื่อโปรเจกต์ / ผลงาน:');
          if (!title) return;
          const client = prompt('ชื่อลูกค้า / แบรนด์ (เช่น Cross Pattaya, Rachabura):');
          const cover = prompt('URL รูปภาพหน้าปก:', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80');
          const category = prompt('หมวดหมู่ (hotels-resorts, real-estate, food-beverage):', 'hotels-resorts');

          await fetch('/api/admin/portfolios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              client_name: client,
              category_slug: category,
              cover_image: cover,
              summary: 'ผลงานถ่ายภาพและโปรดักชันมีเดียระดับพรีเมียม',
              featured: 1
            })
          });
          await this.loadPortfolios();
          await this.loadStats();
        },

        formatDate(dateStr) {
          if (!dateStr) return '-';
          return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      }
    }
  </script>
</body>
</html>`;
}
