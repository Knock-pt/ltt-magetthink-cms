'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../lib/LanguageContext';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
  const { language, t } = useLanguage();
  const [services, setServices] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [articles, setArticles] = useState([]);
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

    fetch('https://ltt-backend.thunchanok-raj.workers.dev/api/public/articles')
      .then(r => r.json())
      .then(d => { if (d.success) setArticles(d.data); }).catch(() => {});
  }, []);

  const heroBadge = language === 'en' ? (settings.hero_badge_en || t('hero_badge')) : (settings.hero_badge || t('hero_badge'));
  const heroHeadline = language === 'en' ? (settings.hero_headline_en || t('hero_title')) : (settings.hero_headline || t('hero_title'));
  const heroSubheadline = language === 'en' ? (settings.hero_subheadline_en || t('hero_subtitle')) : (settings.hero_subheadline || t('hero_subtitle'));

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-36 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.18),rgba(255,255,255,0))]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{heroBadge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
            {heroHeadline}
          </h1>

          <p className="mt-6 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {heroSubheadline}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact-us"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-600/30 transition flex items-center justify-center gap-2"
            >
              <span>{t('hero_contact')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/portfolio"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm border border-slate-800 transition"
            >
              {t('hero_explore')}
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="glass-card p-5 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{settings.stat_projects || '150+'}</div>
              <div className="text-xs text-slate-400 mt-1">{language === 'en' ? 'Completed Projects' : 'โปรเจกต์สำเร็จ'}</div>
            </div>
            <div className="glass-card p-5 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{settings.stat_brands || '80+'}</div>
              <div className="text-xs text-slate-400 mt-1">{language === 'en' ? 'Trusted Brands' : 'แบรนด์ชั้นนำไว้วางใจ'}</div>
            </div>
            <div className="glass-card p-5 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{settings.stat_views || '25M+'}</div>
              <div className="text-xs text-slate-400 mt-1">{language === 'en' ? 'Organic Views' : 'ยอด Organic Video Views'}</div>
            </div>
            <div className="glass-card p-5 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{settings.stat_retention || '96%'}</div>
              <div className="text-xs text-slate-400 mt-1">{language === 'en' ? 'Client Satisfaction' : 'ลูกค้าพึงพอใจและต่อสัญญา'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 border-t border-slate-900 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              {language === 'en' ? 'OUR SERVICES' : 'บริการของเรา'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">{t('services_title')}</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-3">{t('services_subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.slice(0, 4).map((s, idx) => {
              const title = (language === 'en' && s.title_en) ? s.title_en : s.title;
              const subtitle = (language === 'en' && s.subtitle_en) ? s.subtitle_en : (s.subtitle || s.description);

              return (
                <div key={s.id || idx} className="glass-card p-6 rounded-2xl hover:border-blue-500/50 transition duration-300 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-white mb-2">{title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{subtitle}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-800">
                    <Link href="/our-service" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      <span>{language === 'en' ? 'Explore details' : 'ดูรายละเอียด'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Portfolios */}
      <section className="py-20 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                {language === 'en' ? 'SELECTED PORTFOLIO' : 'ผลงานที่โดดเด่น'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">{t('portfolio_title')}</h2>
            </div>
            <Link href="/portfolio" className="mt-4 md:mt-0 text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <span>{t('portfolio_view_all')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {portfolios.slice(0, 3).map((p) => {
              const title = (language === 'en' && p.title_en) ? p.title_en : p.title;
              const summary = (language === 'en' && p.summary_en) ? p.summary_en : p.summary;
              const linkHref = `/portfolio/${p.slug || p.id}`;

              return (
                <div key={p.id} className="glass-card rounded-2xl overflow-hidden group border border-slate-800/80 hover:border-slate-700 transition">
                  <Link href={linkHref} className="h-52 overflow-hidden block">
                    <img src={p.cover_image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </Link>
                  <div className="p-6">
                    <span className="text-[11px] font-semibold text-blue-400 block mb-1">{p.client_name}</span>
                    <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition">
                      <Link href={linkHref}>{title}</Link>
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{summary}</p>
                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                      <Link href={linkHref} className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <span>{t('portfolio_view_detail')}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Insights & Articles */}
      <section className="py-20 border-t border-slate-900 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                {language === 'en' ? 'INSIGHTS & TRENDS' : 'บทความ & ข่าวสาร'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">{t('blog_title')}</h2>
            </div>
            <Link href="/blog" className="mt-4 md:mt-0 text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <span>{language === 'en' ? 'View All Articles' : 'ดูบทความทั้งหมด'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.slice(0, 3).map((art) => {
              const title = (language === 'en' && art.title_en) ? art.title_en : art.title;
              const summary = (language === 'en' && art.summary_en) ? art.summary_en : art.summary;
              const linkHref = `/blog/${art.slug || art.id}`;

              return (
                <div key={art.id} className="glass-card rounded-2xl overflow-hidden group border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between">
                  <div>
                    {art.cover_image && (
                      <Link href={linkHref} className="h-48 overflow-hidden block">
                        <img src={art.cover_image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      </Link>
                    )}
                    <div className="p-6">
                      <span className="text-[11px] font-semibold text-blue-400 block mb-1">
                        {new Date(art.published_at || art.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'th-TH')}
                      </span>
                      <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition">
                        <Link href={linkHref}>{title}</Link>
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">{summary}</p>
                    </div>
                  </div>
                  <div className="p-6 pt-0 border-t border-slate-800/60 mt-2 flex justify-end">
                    <Link href={linkHref} className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      <span>{t('blog_read_more')}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
