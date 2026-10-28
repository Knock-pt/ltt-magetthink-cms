'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { useLanguage } from '../../../lib/LanguageContext';
import { ArrowLeft, Calendar, Tag, MapPin, Video, Eye, Share2, CheckCircle2 } from 'lucide-react';

export default function PortfolioDetailClient({ slug }) {
  const { language, t } = useLanguage();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://ltt-backend.thunchanok-raj.workers.dev/api/public/portfolios/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setItem(data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  const displayTitle = (language === 'en' && item?.title_en) ? item.title_en : (item?.title || 'Portfolio Detail');
  const displaySummary = (language === 'en' && item?.summary_en) ? item.summary_en : (item?.summary || '');
  const displayDetails = (language === 'en' && item?.details_en) ? item.details_en : (item?.details || '');

  // Extract YouTube ID if any
  let youtubeEmbed = '';
  if (item?.video_url) {
    const v = item.video_url;
    if (v.includes('youtube.com/watch?v=')) {
      youtubeEmbed = v.split('v=')[1]?.split('&')[0];
    } else if (v.includes('youtu.be/')) {
      youtubeEmbed = v.split('youtu.be/')[1]?.split('?')[0];
    }
  }

  const tagsMeta = item?.tags_meta || {};
  const gallery = Array.isArray(item?.gallery_images) ? item.gallery_images : [];

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Back Link */}
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
          <span>{t('portfolio_back')}</span>
        </Link>

        {loading ? (
          <div className="py-24 text-center text-slate-500 text-sm">กำลังโหลดข้อมูลผลงาน...</div>
        ) : !item ? (
          <div className="py-24 text-center">
            <h2 className="text-xl font-bold text-white mb-2">ไม่พบข้อมูลผลงาน</h2>
            <Link href="/portfolio" className="text-xs text-blue-400 hover:underline">
              {t('portfolio_back')}
            </Link>
          </div>
        ) : (
          <article className="space-y-10">
            {/* Header Area */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                  {item.category_slug || 'Portfolio'}
                </span>
                {item.template_style && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800">
                    {item.template_style}
                  </span>
                )}
                {item.travel_date && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 ml-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.travel_date}</span>
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {displayTitle}
              </h1>

              {displaySummary && (
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-light border-l-2 border-blue-500 pl-4 py-1">
                  {displaySummary}
                </p>
              )}

              {/* Marketing Agency Tags Bar */}
              {(tagsMeta.service || tagsMeta.industry || tagsMeta.platform || tagsMeta.target_audience || tagsMeta.objective || tagsMeta.format || tagsMeta.country || tagsMeta.type) && (
                <div className="pt-2 flex flex-wrap gap-2 text-xs">
                  {(tagsMeta.service || tagsMeta.type) && (
                    <span className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-blue-400 font-semibold">
                      🚀 {tagsMeta.service || tagsMeta.type}
                    </span>
                  )}
                  {(tagsMeta.industry || tagsMeta.country) && (
                    <span className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
                      🏢 {tagsMeta.industry || tagsMeta.country}
                    </span>
                  )}
                  {(tagsMeta.platform || tagsMeta.destination) && (
                    <span className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-indigo-400 font-medium">
                      📱 {tagsMeta.platform || tagsMeta.destination}
                    </span>
                  )}
                  {(tagsMeta.target_audience || tagsMeta.transportation) && (
                    <span className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
                      👥 {tagsMeta.target_audience || tagsMeta.transportation}
                    </span>
                  )}
                  {(tagsMeta.objective || tagsMeta.location_name) && (
                    <span className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-emerald-400 font-medium">
                      🎯 {tagsMeta.objective || tagsMeta.location_name}
                    </span>
                  )}
                  {(tagsMeta.format || tagsMeta.activity) && (
                    <span className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-purple-400 font-medium">
                      📦 {tagsMeta.format || tagsMeta.activity}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Main Cover Image */}
            {item.cover_image && (
              <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80">
                <img
                  src={item.cover_image}
                  alt={displayTitle}
                  className="w-full max-h-[560px] object-cover"
                />
              </div>
            )}

            {/* Video Showcase Embed */}
            {youtubeEmbed && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Video className="w-4 h-4 text-blue-400" />
                  <span>Video Showcase</span>
                </h3>
                <div className="aspect-video rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${youtubeEmbed}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}

            {/* Rich Content Area */}
            {displayDetails && (
              <div
                className="prose prose-invert prose-blue max-w-none text-slate-200 text-sm sm:text-base leading-relaxed py-4 border-t border-slate-800/60"
                dangerouslySetInnerHTML={{ __html: displayDetails }}
              />
            )}

            {/* Google Maps Embed / Coordinates */}
            {item.map_coords && (
              <div className="space-y-3 pt-6 border-t border-slate-800/60">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Location & Map Coordinates</span>
                </h3>
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-mono">{item.map_coords}</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.map_coords)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-blue-400 hover:underline"
                  >
                    เปิดใน Google Maps ↗
                  </a>
                </div>
              </div>
            )}

            {/* Gallery Section */}
            {gallery.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-slate-800/60">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  Photo Gallery
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {gallery.map((imgUrl, idx) => (
                    <div key={idx} className="rounded-2xl overflow-hidden border border-slate-800 group">
                      <img
                        src={imgUrl}
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-56 object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Contact CTA */}
            <div className="glass-card p-8 sm:p-10 rounded-3xl text-center space-y-4 mt-16 border border-blue-500/20">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                พร้อมยกระดับแบรนด์ของคุณด้วยผลงานสร้างสรรค์ระดับพรีเมียม?
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                ปรึกษาทีมงาน LTT Ma getThink เพื่อวางแผนกลยุทธ์ ถ่ายภาพ หรือโปรดักชันวิดีโอสำหรับธุรกิจของคุณ
              </p>
              <div className="pt-2">
                <Link
                  href="/contact-us"
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-lg shadow-blue-500/25 transition"
                >
                  <span>{t('nav_cta')}</span>
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </Link>
              </div>
            </div>
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
