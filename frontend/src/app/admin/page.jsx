'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Compass,
  Briefcase,
  Sparkles,
  Newspaper,
  Building2,
  Inbox,
  Settings,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  Download,
  Mail,
  Image as ImageIcon,
  Layers,
  FileText,
  ArrowUpRight,
  ShieldCheck,
  Check,
  X,
  ExternalLink
} from 'lucide-react';

const API_BASE = 'https://ltt-backend.thunchanok-raj.workers.dev/api/admin';

export default function AdminCMS() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isPurging, setIsPurging] = useState(false);
  const [stats, setStats] = useState({
    total_inquiries: 0,
    new_inquiries: 0,
    total_portfolios: 0,
    total_services: 0,
    total_articles: 0,
    recent_inquiries: []
  });
  const [portfolios, setPortfolios] = useState([]);
  const [services, setServices] = useState([]);
  const [articles, setArticles] = useState([]);
  const [clientLogos, setClientLogos] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [navMenus, setNavMenus] = useState([]);
  const [settingsMap, setSettingsMap] = useState({});

  // Modals State
  const [navModalOpen, setNavModalOpen] = useState(false);
  const [navForm, setNavForm] = useState({ id: null, label: '', path: '/', is_external: 0, sort_order: 1, is_active: 1 });

  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({
    title: '', client_name: '', category_slug: 'hotels-resorts', cover_image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', summary: '', featured: 1
  });

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ name: '', logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80', website_url: '', sort_order: 1 });

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({ id: null, customerName: '', notes: '' });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [s, p, sv, a, cl, inq, nav, set] = await Promise.all([
        fetch(`${API_BASE}/dashboard/stats`).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE}/portfolios`).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE}/services`).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE}/articles`).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE}/client-logos`).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE}/inquiries`).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE}/navigation`).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE}/site-settings`).then(r => r.json()).catch(() => ({}))
      ]);

      if (s.data) setStats(s.data);
      if (p.data) setPortfolios(p.data);
      if (sv.data) setServices(sv.data);
      if (a.data) setArticles(a.data);
      if (cl.data) setClientLogos(cl.data);
      if (inq.data) setInquiries(inq.data);
      if (nav.data) setNavMenus(nav.data);
      if (set.data) {
        const m = {};
        set.data.forEach(item => { m[item.key] = item.value; });
        setSettingsMap(m);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  }

  // Navigation Menu Actions
  function openCreateNavMenu() {
    setNavForm({ id: null, label: '', path: '/', is_external: 0, sort_order: (navMenus.length + 1), is_active: 1 });
    setNavModalOpen(true);
  }

  function openEditNavMenu(item) {
    setNavForm({ id: item.id, label: item.label, path: item.path, is_external: item.is_external || 0, sort_order: item.sort_order || 1, is_active: item.is_active ?? 1 });
    setNavModalOpen(true);
  }

  async function submitNavMenu(e) {
    e.preventDefault();
    if (!navForm.label || !navForm.path) return alert('กรุณากรอกชื่อเมนูและ Path');
    const isEdit = !!navForm.id;
    const url = isEdit ? `${API_BASE}/navigation/${navForm.id}` : `${API_BASE}/navigation`;
    const method = isEdit ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(navForm)
    });
    setNavModalOpen(false);
    await loadAll();
  }

  async function deleteNavMenu(id) {
    if (!confirm('ยืนยันลบเมนูนี้?')) return;
    await fetch(`${API_BASE}/navigation/${id}`, { method: 'DELETE' });
    await loadAll();
  }

  // Portfolio Actions
  async function submitPortfolio(e) {
    e.preventDefault();
    await fetch(`${API_BASE}/portfolios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(portfolioForm)
    });
    setPortfolioModalOpen(false);
    await loadAll();
  }

  async function deletePortfolio(id) {
    if (!confirm('ยืนยันลบผลงานนี้?')) return;
    await fetch(`${API_BASE}/portfolios/${id}`, { method: 'DELETE' });
    await loadAll();
  }

  // Client Logo Actions
  async function submitClientLogo(e) {
    e.preventDefault();
    await fetch(`${API_BASE}/client-logos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientForm)
    });
    setClientModalOpen(false);
    await loadAll();
  }

  async function deleteClientLogo(id) {
    if (!confirm('ยืนยันลบลูกค้ารายนี้?')) return;
    await fetch(`${API_BASE}/client-logos/${id}`, { method: 'DELETE' });
    await loadAll();
  }

  // Inquiries & Notes
  function openEditNote(inq) {
    setNoteForm({ id: inq.id, customerName: inq.full_name, notes: inq.admin_notes || '' });
    setNoteModalOpen(true);
  }

  async function submitNote(e) {
    e.preventDefault();
    await fetch(`${API_BASE}/inquiries/${noteForm.id}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: noteForm.notes })
    });
    setNoteModalOpen(false);
    await loadAll();
  }

  async function updateStatus(id, st) {
    await fetch(`${API_BASE}/inquiries/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: st })
    });
    await loadAll();
  }

  // Services & Settings
  async function saveService(svc) {
    await fetch(`${API_BASE}/services/${svc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(svc)
    });
    alert('บันทึกข้อมูลบริการเรียบร้อย');
  }

  async function saveSettings(e) {
    e.preventDefault();
    const list = Object.keys(settingsMap).map(k => ({ key: k, value: settingsMap[k] }));
    await fetch(`${API_BASE}/site-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: list })
    });
    alert('บันทึกการตั้งค่าเว็บไซต์เรียบร้อย');
  }

  async function deleteArticle(id) {
    if (!confirm('ยืนยันลบบทความนี้?')) return;
    await fetch(`${API_BASE}/articles/${id}`, { method: 'DELETE' });
    await loadAll();
  }

  async function triggerCachePurge() {
    setIsPurging(true);
    await fetch(`${API_BASE}/sync/purge-cache`, { method: 'POST' });
    alert('ส่งคำสั่ง Sync & Purge Cache เรียบร้อยแล้ว!');
    setIsPurging(false);
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 z-20">
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/30">
            L
          </div>
          <div>
            <h1 className="font-bold text-sm text-white">LTT Ma getThink</h1>
            <p className="text-[11px] text-blue-400 font-medium">Next.js Edge Backoffice</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard ภาพรวม', icon: LayoutDashboard },
            { id: 'navigation', label: 'Navigation เมนูหลัก', icon: Compass },
            { id: 'portfolios', label: 'Portfolios ผลงาน', icon: Briefcase },
            { id: 'services', label: 'Services บริการ', icon: Sparkles },
            { id: 'articles', label: 'Blog & Events บทความ', icon: Newspaper },
            { id: 'clients', label: 'Client Logos ลูกค้า', icon: Building2 },
            { id: 'inquiries', label: 'Inquiries ข้อความติดต่อ', icon: Inbox, badge: stats.new_inquiries },
            { id: 'settings', label: 'Site Settings & SEO', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Zero Trust Protected</span>
            </div>
            <p className="text-slate-400 truncate">thunchanok.raj@gmail.com</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Strict CSP (No unsafe-eval)</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-slate-800 bg-slate-950/40 backdrop-blur px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white capitalize">{currentTab}</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-blue-400 border border-slate-700/60 font-mono">
              Cloudflare D1 Live
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-800 transition"
            >
              <span>เปิดหน้าบ้าน</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={triggerCachePurge}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPurging ? 'animate-spin' : ''}`} />
              <span>Sync & Purge Cache</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* TAB 1: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="glass-card p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
                    <span>ข้อความติดต่อทั้งหมด</span>
                    <Mail className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.total_inquiries}</div>
                  <p className="text-[11px] text-emerald-400 mt-2 font-medium flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>{stats.new_inquiries}</span> ข้อความใหม่
                  </p>
                </div>
                <div className="glass-card p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
                    <span>ผลงานในระบบ</span>
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.total_portfolios}</div>
                  <p className="text-[11px] text-slate-400 mt-2">แสดงบนหน้าแรกและ Showcase</p>
                </div>
                <div className="glass-card p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
                    <span>บริการหลัก</span>
                    <Layers className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.total_services}</div>
                  <p className="text-[11px] text-slate-400 mt-2">Bullet points ครบถ้วน</p>
                </div>
                <div className="glass-card p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
                    <span>บทความ & ข่าวสาร</span>
                    <FileText className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.total_articles}</div>
                  <p className="text-[11px] text-slate-400 mt-2">อัปเดตเทรนด์การตลาด</p>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">ข้อความติดต่อล่าสุด (Recent Leads)</h3>
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="pb-3">ชื่อลูกค้า</th>
                      <th className="pb-3">บริษัท</th>
                      <th className="pb-3">บริการ</th>
                      <th className="pb-3">สถานะ</th>
                      <th className="pb-3">วันที่</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {stats.recent_inquiries?.map(inq => (
                      <tr key={inq.id} className="hover:bg-slate-800/30">
                        <td className="py-3 font-medium text-white">{inq.full_name}</td>
                        <td className="py-3 text-slate-300">{inq.company || '-'}</td>
                        <td className="py-3 text-slate-300">{inq.service_interested || '-'}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {inq.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">
                          {new Date(inq.created_at).toLocaleDateString('th-TH')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: NAVIGATION MENUS */}
          {currentTab === 'navigation' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">จัดการเมนูหลักของเว็บไซต์ (Navigation Menus)</h3>
                  <p className="text-xs text-slate-400">เพิ่ม ลบ แก้ไข และจัดเรียงเมนูบนแถบ Navigation หน้าบ้าน</p>
                </div>
                <button
                  type="button"
                  onClick={openCreateNavMenu}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ เพิ่มเมนูหลักใหม่</span>
                </button>
              </div>

              <div className="glass-card rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
                    <tr>
                      <th className="p-4 font-semibold">ลำดับ</th>
                      <th className="p-4 font-semibold">ชื่อเมนู (Label)</th>
                      <th className="p-4 font-semibold">URL Path (เช่น /our-service)</th>
                      <th className="p-4 font-semibold">ประเภท</th>
                      <th className="p-4 font-semibold">สถานะ</th>
                      <th className="p-4 font-semibold text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {navMenus.map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/30">
                        <td className="p-4 text-slate-400 font-semibold">{item.sort_order}</td>
                        <td className="p-4 font-bold text-white">{item.label}</td>
                        <td className="p-4 text-blue-400 font-mono text-[11px]">{item.path}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            item.is_external
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {item.is_external ? 'ภายนอก (Link)' : 'ภายในเว็บ (Page)'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            item.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                          }`}>
                            {item.is_active ? 'เปิดใช้งาน' : 'ปิด'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => openEditNavMenu(item)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteNavMenu(item.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-900/30 text-rose-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PORTFOLIOS */}
          {currentTab === 'portfolios' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">จัดการผลงาน (Portfolios)</h3>
                <button
                  type="button"
                  onClick={() => setPortfolioModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ เพิ่มผลงานใหม่</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {portfolios.map(item => (
                  <div key={item.id} className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between">
                    <img src={item.cover_image} className="w-full h-44 object-cover" alt="" />
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-white">{item.title}</h4>
                        <p className="text-xs text-blue-400 mt-1">{item.client_name}</p>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">{item.summary}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
                        <button
                          type="button"
                          onClick={() => deletePortfolio(item.id)}
                          className="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบผลงาน</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SERVICES */}
          {currentTab === 'services' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-white">จัดการบริการ (Services)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.map(svc => (
                  <div key={svc.id} className="glass-card rounded-2xl p-6 space-y-4">
                    <h4 className="font-bold text-sm text-white">{svc.title}</h4>
                    <input
                      type="text"
                      value={svc.subtitle || ''}
                      onChange={e => {
                        const updated = services.map(s => s.id === svc.id ? { ...s, subtitle: e.target.value } : s);
                        setServices(updated);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                    />
                    <textarea
                      rows={3}
                      value={svc.description || ''}
                      onChange={e => {
                        const updated = services.map(s => s.id === svc.id ? { ...s, description: e.target.value } : s);
                        setServices(updated);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => saveService(svc)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white"
                      >
                        บันทึกการแก้ไข
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ARTICLES */}
          {currentTab === 'articles' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-white">บทความ & ข่าวสาร</h3>
              <div className="glass-card rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
                    <tr>
                      <th className="p-4">ชื่อบทความ</th>
                      <th className="p-4">วันที่</th>
                      <th className="p-4 text-right">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {articles.map(art => (
                      <tr key={art.id}>
                        <td className="p-4 font-medium text-white">{art.title}</td>
                        <td className="p-4 text-slate-400">{new Date(art.published_at).toLocaleDateString('th-TH')}</td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => deleteArticle(art.id)}
                            className="text-rose-400 hover:text-rose-300"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: CLIENT LOGOS */}
          {currentTab === 'clients' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">โลโก้ลูกค้า (Client Logos)</h3>
                <button
                  type="button"
                  onClick={() => setClientModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ เพิ่มโลโก้ลูกค้า</span>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {clientLogos.map(cl => (
                  <div key={cl.id} className="glass-card rounded-xl p-4 flex flex-col items-center justify-center text-center relative group">
                    <button
                      type="button"
                      onClick={() => deleteClientLogo(cl.id)}
                      className="absolute top-2 right-2 text-rose-400 hover:text-rose-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <img src={cl.logo_url} className="h-10 object-contain mb-2 opacity-80 group-hover:opacity-100" alt="" />
                    <span className="text-xs font-medium text-slate-300">{cl.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: INQUIRIES */}
          {currentTab === 'inquiries' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">กล่องข้อความติดต่อ (Leads & Inquiries)</h3>
                <a
                  href={`${API_BASE}/inquiries/export.csv`}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export เป็น CSV</span>
                </a>
              </div>

              <div className="glass-card rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
                    <tr>
                      <th className="p-4">ลูกค้า</th>
                      <th className="p-4">เบอร์/อีเมล</th>
                      <th className="p-4">ข้อความ & โน้ตภายใน</th>
                      <th className="p-4">ต้นทาง</th>
                      <th className="p-4">สถานะ</th>
                      <th className="p-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {inquiries.map(inq => (
                      <tr key={inq.id}>
                        <td className="p-4 font-semibold text-white">{inq.full_name}</td>
                        <td className="p-4 text-slate-300">
                          <div>{inq.email}</div>
                          <div className="text-[11px] text-blue-400">{inq.phone}</div>
                        </td>
                        <td className="p-4 text-slate-300 max-w-xs">
                          <div className="line-clamp-2">{inq.message}</div>
                          {inq.admin_notes && (
                            <div className="mt-1 p-1.5 rounded bg-blue-950/60 border border-blue-800/40 text-[11px] text-blue-300 font-medium">
                              📌 โน้ต: {inq.admin_notes}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-slate-400 font-mono text-[11px]">
                          {inq.source_page || '/contact-us'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            inq.status === 'new'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/20'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {inq.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => openEditNote(inq)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition"
                          >
                            📝 โน้ต
                          </button>
                          <select
                            value={inq.status}
                            onChange={e => updateStatus(inq.id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200"
                          >
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="contacted">Contacted</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: SITE SETTINGS */}
          {currentTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-white">ตั้งค่าเว็บไซต์ & SEO</h3>
              <form onSubmit={saveSettings} className="glass-card rounded-2xl p-6 space-y-4 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">ชื่อบริษัท</label>
                    <input
                      type="text"
                      value={settingsMap.company_name || ''}
                      onChange={e => setSettingsMap({ ...settingsMap, company_name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">เบอร์โทร</label>
                    <input
                      type="text"
                      value={settingsMap.phone || ''}
                      onChange={e => setSettingsMap({ ...settingsMap, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">Hero Headline</label>
                    <input
                      type="text"
                      value={settingsMap.hero_headline || ''}
                      onChange={e => setSettingsMap({ ...settingsMap, hero_headline: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">Hero Subheadline</label>
                    <textarea
                      rows={2}
                      value={settingsMap.hero_subheadline || ''}
                      onChange={e => setSettingsMap({ ...settingsMap, hero_subheadline: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20"
                >
                  บันทึกการตั้งค่าทั้งหมด
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* ==================== MODALS ==================== */}
      {/* Navigation Modal */}
      {navModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-sm">
                {navForm.id ? 'แก้ไขเมนูหลัก' : 'เพิ่มเมนูหลักใหม่'}
              </h4>
              <button type="button" onClick={() => setNavModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitNavMenu} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">ชื่อเมนู (Label) *</label>
                <input
                  type="text"
                  required
                  value={navForm.label}
                  onChange={e => setNavForm({ ...navForm, label: e.target.value })}
                  placeholder="เช่น บริการของเรา, ผลงาน, ติดต่อเรา"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">URL Path *</label>
                <input
                  type="text"
                  required
                  value={navForm.path}
                  onChange={e => setNavForm({ ...navForm, path: e.target.value })}
                  placeholder="เช่น /our-service หรือ https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">ลำดับการแสดงผล</label>
                  <input
                    type="number"
                    value={navForm.sort_order}
                    onChange={e => setNavForm({ ...navForm, sort_order: Number(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">ประเภทลิงก์</label>
                  <select
                    value={navForm.is_external}
                    onChange={e => setNavForm({ ...navForm, is_external: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={0}>หน้าภายในเว็บ (Page)</option>
                    <option value={1}>ลิงก์ภายนอก (External)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={navForm.is_active === 1}
                    onChange={e => setNavForm({ ...navForm, is_active: e.target.checked ? 1 : 0 })}
                    className="rounded bg-slate-950 border-slate-800 text-blue-600"
                  />
                  <span className="text-xs text-slate-300">เปิดแสดงผลเมนูนี้บนหน้าเว็บไซต์</span>
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNavModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Portfolio Modal */}
      {portfolioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-sm">เพิ่มผลงานใหม่ (New Portfolio)</h4>
              <button type="button" onClick={() => setPortfolioModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitPortfolio} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">ชื่อผลงาน (Title) *</label>
                <input
                  type="text"
                  required
                  value={portfolioForm.title}
                  onChange={e => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                  placeholder="เช่น Cross Pattaya Oceanphere — Luxury Pool Villa"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">ชื่อลูกค้า (Client Name) *</label>
                  <input
                    type="text"
                    required
                    value={portfolioForm.client_name}
                    onChange={e => setPortfolioForm({ ...portfolioForm, client_name: e.target.value })}
                    placeholder="เช่น Cross Hotels & Resorts"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">หมวดหมู่ (Category)</label>
                  <select
                    value={portfolioForm.category_slug}
                    onChange={e => setPortfolioForm({ ...portfolioForm, category_slug: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="hotels-resorts">Hotels & Resorts</option>
                    <option value="real-estate">Real Estate</option>
                    <option value="food-beverage">Food & Beverage</option>
                    <option value="lifestyle-wellness">Lifestyle & Wellness</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">URL รูปภาพปก (Cover Image URL) *</label>
                <input
                  type="text"
                  required
                  value={portfolioForm.cover_image}
                  onChange={e => setPortfolioForm({ ...portfolioForm, cover_image: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">สรุปรายละเอียดสั้นๆ (Summary)</label>
                <textarea
                  rows={2}
                  value={portfolioForm.summary}
                  onChange={e => setPortfolioForm({ ...portfolioForm, summary: e.target.value })}
                  placeholder="อธิบายภาพรวมผลงาน เช่น งานถ่ายภาพสถาปัตยกรรมระดับพรีเมียม"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPortfolioModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20"
                >
                  บันทึกผลงาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Logo Modal */}
      {clientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-sm">เพิ่มโลโก้ลูกค้าใหม่</h4>
              <button type="button" onClick={() => setClientModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitClientLogo} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">ชื่อลูกค้า/แบรนด์ *</label>
                <input
                  type="text"
                  required
                  value={clientForm.name}
                  onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                  placeholder="เช่น Cross Hotels & Resorts"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">URL โลโก้ *</label>
                <input
                  type="text"
                  required
                  value={clientForm.logo_url}
                  onChange={e => setClientForm({ ...clientForm, logo_url: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">เว็บไซต์ของลูกค้า (ถ้ามี)</label>
                <input
                  type="text"
                  value={clientForm.website_url}
                  onChange={e => setClientForm({ ...clientForm, website_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20"
                >
                  บันทึกโลโก้
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-white text-sm">จดบันทึกภายใน (Internal Notes)</h4>
                <p className="text-[11px] text-blue-400 mt-0.5">ลูกค้า: {noteForm.customerName}</p>
              </div>
              <button type="button" onClick={() => setNoteModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitNote} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">บันทึกข้อความสำหรับทีมงานภายใน</label>
                <textarea
                  rows={4}
                  value={noteForm.notes}
                  onChange={e => setNoteForm({ ...noteForm, notes: e.target.value })}
                  placeholder="เช่น นัดคุยงานวันจันทร์ 10.00 น. หรือ ส่งใบเสนอราคาแล้ว"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20"
                >
                  บันทึกโน้ต
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
