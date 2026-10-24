'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react';

const DEFAULT_MENUS = [
  { id: 1, label: 'หน้าแรก', path: '/' },
  { id: 2, label: 'บริการของเรา', path: '/our-service' },
  { id: 3, label: 'ผลงาน', path: '/portfolio' },
  { id: 4, label: 'เกี่ยวกับเรา', path: '/about-us' },
  { id: 5, label: 'บทความ & ข่าวสาร', path: '/blog' },
  { id: 6, label: 'ติดต่อเรา', path: '/contact-us' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menus, setMenus] = useState(DEFAULT_MENUS);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch('https://ltt-backend.thunchanok-raj.workers.dev/api/public/navigation')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setMenus(data.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition duration-300">
            L
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block">
              LTT Ma getThink
            </span>
            <span className="text-[11px] text-blue-400 font-semibold tracking-wider uppercase block">
              Creative & Marketing
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 border border-slate-800/80 p-1.5 rounded-full">
          {menus.map((item) => {
            const isActive = pathname === item.path;
            const isExternal = item.is_external || item.path.startsWith('http');
            if (isExternal) {
              return (
                <a
                  key={item.id}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                >
                  {item.label}
                </a>
              );
            }
            return (
              <Link
                key={item.id}
                href={item.path}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <Link
            href="/contact-us"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition duration-300"
          >
            <span>ปรึกษาทีมงาน</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle Navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 py-5 space-y-2">
          {menus.map((item) => {
            const isActive = pathname === item.path;
            const isExternal = item.is_external || item.path.startsWith('http');
            if (isExternal) {
              return (
                <a
                  key={item.id}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-900"
                >
                  {item.label}
                </a>
              );
            }
            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-800">
            <Link
              href="/contact-us"
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 font-bold text-xs text-white"
            >
              <span>ติดต่อปรึกษาฟรี</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
