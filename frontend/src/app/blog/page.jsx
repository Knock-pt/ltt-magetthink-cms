'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calendar, User, ArrowRight } from 'lucide-react';

export default function BlogPage() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    fetch('https://ltt-backend.thunchanok-raj.workers.dev/api/public/articles')
      .then(r => r.json())
      .then(d => { if (d.success) setArticles(d.data); })
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      <section className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">INSIGHTS & TRENDS</span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-3">บทความ & ข่าวสาร</h1>
            <p className="text-sm text-slate-400 mt-4">
              อัปเดตเทรนด์การตลาดดิจิทัล การผลิตสื่อ Short Video และกลยุทธ์การสร้างแบรนด์ที่น่าจับตามอง
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {articles.map(art => (
              <div key={art.id} className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between group">
                <div>
                  {art.cover_image && (
                    <div className="h-60 overflow-hidden">
                      <img
                        src={art.cover_image}
                        alt={art.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>
                  )}
                  <div className="p-8">
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-400" />{new Date(art.published_at).toLocaleDateString('th-TH')}</span>
                      <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" />{art.author || 'LTT Team'}</span>
                    </div>
                    <h2 className="font-bold text-lg text-white group-hover:text-blue-400 transition mb-3">{art.title}</h2>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{art.summary}</p>
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
