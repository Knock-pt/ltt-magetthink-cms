'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetch('https://ltt-backend.thunchanok-raj.workers.dev/api/public/portfolios')
      .then(r => r.json())
      .then(d => { if (d.success) setPortfolios(d.data); })
      .catch(() => {});
  }, []);

  const categories = [
    { id: 'all', label: 'ทั้งหมด (All)' },
    { id: 'hotels-resorts', label: 'Hotels & Resorts' },
    { id: 'real-estate', label: 'Real Estate' },
    { id: 'food-beverage', label: 'Food & Beverage' },
  ];

  const filtered = activeCategory === 'all'
    ? portfolios
    : portfolios.filter(p => p.category_slug === activeCategory);

  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      <section className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">PORTFOLIO SHOWCASE</span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-3">ผลงานของเรา</h1>
            <p className="text-sm text-slate-400 mt-4">
              ชมตัวอย่างผลงานการถ่ายภาพ โปรดักชันวิดีโอ และแคมเปญการตลาดที่เราสร้างสรรค์ร่วมกับแบรนด์ชั้นนำ
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
            {filtered.map(item => (
              <div key={item.id} className="glass-card rounded-3xl overflow-hidden group border border-slate-800/80 flex flex-col">
                <div className="h-64 overflow-hidden relative">
                  <img
                    src={item.cover_image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur border border-slate-700 text-[10px] font-bold text-blue-400">
                      {item.category_slug}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-400">{item.client_name}</span>
                    <h3 className="font-bold text-base text-white mt-1">{item.title}</h3>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">{item.summary}</p>
                    {item.details && (
                      <p className="text-[11px] text-slate-500 mt-2 line-clamp-3">{item.details}</p>
                    )}
                  </div>
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
