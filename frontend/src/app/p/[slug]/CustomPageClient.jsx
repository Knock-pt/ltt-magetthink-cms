'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { useLanguage } from '../../../lib/LanguageContext';
import { ArrowLeft, Layers, Calendar } from 'lucide-react';

export default function CustomPageClient({ slug }) {
  const { language, t } = useLanguage();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://ltt-backend.thunchanok-raj.workers.dev/api/public/pages/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setPageData(data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  const displayTitle = (language === 'en' && pageData?.title_en) ? pageData.title_en : (pageData?.title || 'Page');
  const displayContent = (language === 'en' && pageData?.content_en) ? pageData.content_en : (pageData?.content || '');

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
          <span>{language === 'en' ? 'Back to Home' : 'กลับสู่หน้าหลัก'}</span>
        </Link>

        {loading ? (
          <div className="py-24 text-center text-slate-500 text-sm">กำลังโหลดหน้าเพจ...</div>
        ) : !pageData ? (
          <div className="py-24 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">ไม่พบหน้าเพจที่ต้องการ (404)</h2>
            <p className="text-xs text-slate-400 mb-6">หน้าเพจนี้อาจถูกย้ายหรือยังไม่ได้รับการเผยแพร่</p>
            <Link href="/" className="px-5 py-2.5 rounded-xl bg-blue-600 font-bold text-xs text-white">
              กลับสู่หน้าหลัก
            </Link>
          </div>
        ) : (
          <article className="space-y-10">
            {/* Page Header */}
            <header className="space-y-4 border-b border-slate-900 pb-8">
              <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold tracking-wider uppercase">
                <Layers className="w-4 h-4" />
                <span>LTT Special Page</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {displayTitle}
              </h1>
              {pageData.meta_description && (
                <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
                  {pageData.meta_description}
                </p>
              )}
            </header>

            {/* Page Body Content */}
            <div
              className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm sm:text-base space-y-6"
              dangerouslySetInnerHTML={{ __html: displayContent }}
            />
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
