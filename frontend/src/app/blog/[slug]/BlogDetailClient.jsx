'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { useLanguage } from '../../../lib/LanguageContext';
import { ArrowLeft, Calendar, User, Video, MapPin, Share2 } from 'lucide-react';

export default function BlogDetailClient({ slug }) {
  const { language, t } = useLanguage();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://ltt-backend.thunchanok-raj.workers.dev/api/public/articles/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setItem(data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  const displayTitle = (language === 'en' && item?.title_en) ? item.title_en : (item?.title || 'Article Detail');
  const displaySummary = (language === 'en' && item?.summary_en) ? item.summary_en : (item?.summary || '');
  const displayContent = (language === 'en' && item?.content_en) ? item.content_en : (item?.content || '');

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

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
          <span>{t('blog_back')}</span>
        </Link>

        {loading ? (
          <div className="py-24 text-center text-slate-500 text-sm">กำลังโหลดเนื้อหาบทความ...</div>
        ) : !item ? (
          <div className="py-24 text-center">
            <h2 className="text-xl font-bold text-white mb-2">ไม่พบบทความ</h2>
            <Link href="/blog" className="text-xs text-blue-400 hover:underline">
              {t('blog_back')}
            </Link>
          </div>
        ) : (
          <article className="space-y-8">
            {/* Header Area */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="px-3 py-1 rounded-full font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30 uppercase">
                  {item.template_style || 'INSIGHTS'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{new Date(item.published_at || item.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{item.author || 'LTT Team'}</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {displayTitle}
              </h1>

              {displaySummary && (
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-light border-l-2 border-blue-500 pl-4 py-1">
                  {displaySummary}
                </p>
              )}

              {/* Tags 6 Dimensions */}
              {(tagsMeta.country || tagsMeta.type || tagsMeta.destination || tagsMeta.location_name || tagsMeta.activity) && (
                <div className="pt-2 flex flex-wrap gap-2 text-xs">
                  {tagsMeta.country && <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">🌍 {tagsMeta.country}</span>}
                  {tagsMeta.destination && <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">📍 {tagsMeta.destination}</span>}
                  {tagsMeta.location_name && <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-blue-400 font-medium">🏢 {tagsMeta.location_name}</span>}
                  {tagsMeta.activity && <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-medium">✨ {tagsMeta.activity}</span>}
                </div>
              )}
            </div>

            {/* Cover Image */}
            {item.cover_image && (
              <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80">
                <img
                  src={item.cover_image}
                  alt={displayTitle}
                  className="w-full max-h-[500px] object-cover"
                />
              </div>
            )}

            {/* Video Showcase Embed */}
            {youtubeEmbed && (
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Video className="w-4 h-4 text-blue-400" />
                  <span>Video Feature</span>
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

            {/* Article Content */}
            <div
              className="prose prose-invert prose-blue max-w-none text-slate-200 text-base sm:text-lg leading-relaxed py-6 border-t border-slate-800/60"
              dangerouslySetInnerHTML={{ __html: displayContent }}
            />

            {/* Google Maps Embed / Coordinates */}
            {item.map_coords && (
              <div className="space-y-3 pt-6 border-t border-slate-800/60">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>พิกัดสถานที่ในบทความ</span>
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

            {/* Share / Back Bar */}
            <div className="pt-8 border-t border-slate-800/80 flex items-center justify-between">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('blog_back')}</span>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">แชร์บทความ:</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('คัดลอกลิงก์บทความเรียบร้อยแล้ว');
                  }}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
                  title="Copy link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
