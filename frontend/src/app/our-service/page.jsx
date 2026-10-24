'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

export default function ServicesPage() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    fetch('https://ltt-backend.thunchanok-raj.workers.dev/api/public/services')
      .then(r => r.json())
      .then(d => { if (d.success) setServices(d.data); })
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      <section className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">SERVICES & SOLUTIONS</span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-3">บริการของเรา</h1>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed">
              เราให้บริการด้านการตลาด คอนเทนต์มีเดีย และโปรดักชันอย่างเต็มรูปแบบเพื่อตอบโจทย์การเติบโตของธุรกิจในยุคดิจิทัล
            </p>
          </div>

          <div className="space-y-12">
            {services.map((svc, idx) => (
              <div key={svc.id || idx} className="glass-card p-8 sm:p-10 rounded-3xl border border-slate-800/80">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div className="max-w-2xl">
                    <span className="text-xs font-bold text-blue-400 uppercase">Service 0{idx + 1}</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 mb-3">{svc.title}</h2>
                    <p className="text-xs sm:text-sm text-blue-300 font-medium mb-3">{svc.subtitle}</p>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">{svc.description}</p>
                    
                    {svc.bullet_points && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {svc.bullet_points.map((bp, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{bp}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="lg:w-72 shrink-0">
                    <Link
                      href="/contact-us"
                      className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition"
                    >
                      <span>ขอใบเสนอราคา</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
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
