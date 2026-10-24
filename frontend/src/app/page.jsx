'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowRight, Sparkles, TrendingUp, Camera, Video, Users, CheckCircle2, Star, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  const [services, setServices] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    fetch('https://ltt-backend.thunchanok-raj.workers.dev/api/public/site-settings')
      .then(r => r.json())
      .then(d => { if (d.success) setSettings(d.data); }).catch(() => {});

    fetch('https://ltt-backend.thunchanok-raj.workers.dev/api/public/services')
      .then(r => r.json())
      .then(d => { if (d.success) setServices(d.data); }).catch(() => {});

    fetch('https://ltt-backend.thunchanok-raj.workers.dev/api/public/portfolios')
      .then(r => r.json())
      .then(d => { if (d.success) setPortfolios(d.data); }).catch(() => {});
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-36 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.18),rgba(255,255,255,0))]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{settings.hero_badge || 'CREATIVE & DIGITAL MARKETING AGENCY'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
            {settings.hero_headline || 'ยกระดับแบรนด์ของคุณด้วยการตลาดและมีเดียโปรดักชันครบวงจร'}
          </h1>

          <p className="mt-6 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {settings.hero_subheadline || 'ดูแลแบรนด์แบบฟูลทีม ตั้งแต่วางแผนกลยุทธ์ ถ่ายภาพ โปรดักชันวิดีโอ ไปจนถึงอินฟลูเอนเซอร์มาร์เก็ตติงเพื่อสร้างผลลัพธ์ที่วัดผลได้จริง'}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact-us"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-600/30 transition flex items-center justify-center gap-2"
            >
              <span>เริ่มต้นปรึกษาโปรเจกต์</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/portfolio"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm border border-slate-800 transition"
            >
              ดูผลงานทั้งหมด
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="glass-card p-5 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{settings.stat_projects || '150+'}</div>
              <div className="text-xs text-slate-400 mt-1">โปรเจกต์สำเร็จ</div>
            </div>
            <div className="glass-card p-5 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{settings.stat_brands || '80+'}</div>
              <div className="text-xs text-slate-400 mt-1">แบรนด์ชั้นนำไว้วางใจ</div>
            </div>
            <div className="glass-card p-5 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{settings.stat_views || '25M+'}</div>
              <div className="text-xs text-slate-400 mt-1">ยอด Organic Video Views</div>
            </div>
            <div className="glass-card p-5 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{settings.stat_retention || '96%'}</div>
              <div className="text-xs text-slate-400 mt-1">ลูกค้าพึงพอใจและต่อสัญญา</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 border-t border-slate-900 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">OUR SERVICES</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">บริการหลักของเรา</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-3">โซลูชันการตลาดและการผลิตสื่อครบวงจร ออกแบบมาเพื่อกลุ่ม Hospitality & Real Estate โดยเฉพาะ</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(services.length > 0 ? services : [
              { id: 1, title: 'Digital Marketing', subtitle: 'วางแผนกลยุทธ์และยิงแอดโซเชียลมีเดีย', icon: 'TrendingUp' },
              { id: 2, title: 'Commercial Photography', subtitle: 'ถ่ายภาพโรงแรม สินค้า และสถาปัตยกรรม', icon: 'Camera' },
              { id: 3, title: 'Creative Video & Reels', subtitle: 'โปรดักชันคลิปสั้น Viral TikTok & Reels', icon: 'Video' },
              { id: 4, title: 'Influencer & KOL Matching', subtitle: 'คัดสรรและประสานงานอินฟลูเอนเซอร์ตรงกลุ่มเป้าหมาย', icon: 'Users' },
            ]).map((s, idx) => (
              <div key={s.id || idx} className="glass-card p-6 rounded-2xl hover:border-blue-500/50 transition duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-white mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.subtitle || s.description}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <Link href="/our-service" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <span>ดูรายละเอียด</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Portfolios */}
      <section className="py-20 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">SHOWCASE</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">ผลงานไฮไลต์ของเรา</h2>
            </div>
            <Link href="/portfolio" className="mt-4 md:mt-0 text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <span>ดูผลงานทั้งหมด</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(portfolios.length > 0 ? portfolios.slice(0, 3) : [
              { id: 1, title: 'Cross Pattaya Oceanphere', client_name: 'Cross Hotels', cover_image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', summary: 'โปรดักชันถ่ายภาพสถาปัตยกรรมระดับ 5 ดาว' },
              { id: 2, title: 'The Politan Aqua', client_name: 'The Politan', cover_image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', summary: 'โปรดักชันถ่ายภาพอาคารสูงริมแม่น้ำเจ้าพระยา' },
              { id: 3, title: 'Pavilion Samui Villas', client_name: 'Pavilion Samui', cover_image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80', summary: 'บริการถ่ายภาพและแคมเปญอินฟลูเอนเซอร์ช่วง High Season' }
            ]).map((p) => (
              <div key={p.id} className="glass-card rounded-2xl overflow-hidden group">
                <div className="h-52 overflow-hidden">
                  <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <div className="p-6">
                  <span className="text-[11px] font-semibold text-blue-400 block mb-1">{p.client_name}</span>
                  <h3 className="font-bold text-sm text-white">{p.title}</h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{p.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
