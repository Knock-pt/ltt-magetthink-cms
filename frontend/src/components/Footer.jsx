'use client';

import Link from 'next/link';
import { useLanguage } from '../lib/LanguageContext';

export default function Footer() {
  const { language, t } = useLanguage();

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg text-white">
                L
              </div>
              <span className="font-bold text-white text-base">LTT Ma getThink</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('footer_desc')}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-xs text-white uppercase tracking-wider mb-3">
              {t('footer_nav')}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/" className="hover:text-blue-400 transition">{t('nav_home')}</Link></li>
              <li><Link href="/our-service" className="hover:text-blue-400 transition">{t('nav_services')}</Link></li>
              <li><Link href="/portfolio" className="hover:text-blue-400 transition">{t('nav_portfolio')}</Link></li>
              <li><Link href="/about-us" className="hover:text-blue-400 transition">{t('nav_about')}</Link></li>
              <li><Link href="/blog" className="hover:text-blue-400 transition">{t('nav_blog')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-xs text-white uppercase tracking-wider mb-3">
              {t('footer_services')}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Digital Marketing & Social Media</li>
              <li>Commercial Photography & Videography</li>
              <li>Creative Content & Short Video Production</li>
              <li>Influencer & KOL Campaign Matching</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-xs text-white uppercase tracking-wider mb-3">
              {t('footer_contact')}
            </h4>
            <p className="text-xs text-slate-400 mb-1">{language === 'en' ? 'Phone' : 'โทร'}: 096-042-9083</p>
            <p className="text-xs text-slate-400 mb-1">{language === 'en' ? 'Email' : 'อีเมล'}: contact@lttmagetthink.co</p>
            <p className="text-xs text-slate-400">LINE OA: @lttmagetthink</p>
          </div>
        </div>
        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} LTT Ma getThink Co., Ltd. {t('footer_rights')}</p>
          <div className="flex items-center gap-4">
            <Link href="/contact-us" className="hover:text-slate-400">{t('nav_contact')}</Link>
            <a href="https://ltt-backend.thunchanok-raj.workers.dev/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Edge CMS Backoffice</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
