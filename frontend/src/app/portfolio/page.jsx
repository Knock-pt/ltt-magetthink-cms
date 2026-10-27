'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useLanguage } from '../../lib/LanguageContext';
import { ArrowRight, Eye } from 'lucide-react';

export default function PortfolioPage() {
  const { language, t } = useLanguage();
  const [portfolios, setPortfolios] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetch('https://ltt-backend.thunchanok-raj.workers.dev/api/public/portfolios')
      .then(r => r.json())
      .then(d => { if (d.success) setPortfolios(d.data); })
      .catch(() => {});
  }, []);

  const categories = [
    { id: 'all', label: language === 'en' ? 'All' : 'ทั้งหมด' },
    { id: 'hotels-resorts', label: 'Hotels & Resorts' },
    { id: 'real-estate', label: 'Real Estate' },
    { id: 'food-beverage', label: 'Food & Beverage' },
  ];

  const filtered = activeCategory === 'all'
    ? portfolios
    : portfolios.filter(p => p.category_slug === activeCategory);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">PORTFOLIO SHOWCASE</span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-3">
              {t('portfolio_title')}
            </h1>
            <p className="text-sm text-slate-400 mt-4">
              {t('portfolio_subtitle')}
            </p>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              {categories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                    activeCategory === c.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(item => {
              const title = (language === 'en' && item.title_en) ? item.title_en : item.title;
              const summary = (language === 'en' && item.summary_en) ? item.summary_en : item.summary;
              const linkHref = `/portfolio/${item.slug || item.id}`;

              return (
                <div key={item.id} className="glass-card rounded-3xl overflow-hidden group border border-slate-800/80 flex flex-col hover:border-slate-700 transition">
                  <Link href={linkHref} className="h-64 overflow-hidden relative block">
                    <img
                      src={item.cover_image}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur border border-slate-700 text-[10px] font-bold text-blue-400">
                        {item.category_slug}
                      </span>
                    </div>
                  </Link>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-medium text-slate-400">{item.client_name}</span>
                      <h3 className="font-bold text-base text-white mt-1 group-hover:text-blue-400 transition">
                        <Link href={linkHref}>{title}</Link>
                      </h3>
                      <p className="text-xs text-slate-400 mt-3 leading-relaxed line-clamp-2">{summary}</p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <Link
                        href={linkHref}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition"
                      >
                        <span>{t('portfolio_view_detail')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
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
