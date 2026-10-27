'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { useLanguage } from '../../lib/LanguageContext';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function ServicesPage() {
  const { language, t } = useLanguage();
  const [services, setServices] = useState([]);

  useEffect(() => {
    fetch('https://ltt-backend.thunchanok-raj.workers.dev/api/public/services')
      .then(r => r.json())
      .then(d => { if (d.success) setServices(d.data); })
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">SERVICES & SOLUTIONS</span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-3">
              {t('services_title')}
            </h1>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed">
              {t('services_subtitle')}
            </p>
          </div>

          <div className="space-y-12">
            {services.map((svc, idx) => {
              const title = (language === 'en' && svc.title_en) ? svc.title_en : svc.title;
              const subtitle = (language === 'en' && svc.subtitle_en) ? svc.subtitle_en : svc.subtitle;
              const description = (language === 'en' && svc.description_en) ? svc.description_en : svc.description;
              const bullets = Array.isArray(svc.bullet_points) ? svc.bullet_points : [];

              return (
                <div key={svc.id || idx} className="glass-card p-8 sm:p-10 rounded-3xl border border-slate-800/80">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    {/* Left: Info */}
                    <div className="flex-1 max-w-2xl">
                      <span className="text-xs font-bold text-blue-400 uppercase">Service 0{idx + 1}</span>
                      <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 mb-2">{title}</h2>
                      {subtitle && <p className="text-xs sm:text-sm text-blue-300 font-medium mb-3">{subtitle}</p>}
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">{description}</p>
                      
                      {bullets.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {bullets.map((bp, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>{bp}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Image / Action */}
                    <div className="lg:w-80 shrink-0 flex flex-col gap-4 items-center">
                      {svc.image_url && (
                        <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-800 shadow">
                          <img src={svc.image_url} alt={title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <Link
                        href="/contact-us"
                        className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition"
                      >
                        <span>{t('nav_cta')}</span>
                        <ArrowRight className="w-4 h-4" />
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
