'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useLanguage } from '../../lib/LanguageContext';
import { Calendar, User, ArrowRight } from 'lucide-react';

export default function BlogPage() {
  const { language, t } = useLanguage();
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    fetch('https://ltt-backend.thunchanok-raj.workers.dev/api/public/articles')
      .then(r => r.json())
      .then(d => { if (d.success) setArticles(d.data); })
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">INSIGHTS & TRENDS</span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-3">
              {t('blog_title')}
            </h1>
            <p className="text-sm text-slate-400 mt-4">
              {t('blog_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {articles.map(art => {
              const title = (language === 'en' && art.title_en) ? art.title_en : art.title;
              const summary = (language === 'en' && art.summary_en) ? art.summary_en : art.summary;
              const linkHref = `/blog/${art.slug || art.id}`;

              return (
                <div key={art.id} className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between group border border-slate-800/80 hover:border-slate-700 transition">
                  <div>
                    {art.cover_image && (
                      <Link href={linkHref} className="h-60 overflow-hidden block">
                        <img
                          src={art.cover_image}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      </Link>
                    )}
                    <div className="p-8">
                      <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          {new Date(art.published_at || art.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'th-TH')}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {art.author || 'LTT Team'}
                        </span>
                      </div>
                      <h2 className="font-bold text-lg text-white group-hover:text-blue-400 transition mb-3">
                        <Link href={linkHref}>{title}</Link>
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed line-clamp-3">{summary}</p>
                    </div>
                  </div>

                  <div className="p-8 pt-0 flex justify-end">
                    <Link
                      href={linkHref}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition"
                    >
                      <span>{t('blog_read_more')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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
