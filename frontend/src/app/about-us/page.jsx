'use client';

import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Target, Users, Award, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

export default function AboutPage() {
  const { language, t } = useLanguage();

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Navbar />

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              {language === 'en' ? 'ABOUT LTT MA GETTHINK' : 'เกี่ยวกับเรา'}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-3">
              {language === 'en' ? 'Who We Are & What We Believe' : 'เกี่ยวกับ LTT Ma getThink'}
            </h1>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed">
              {language === 'en'
                ? 'We are a premier digital marketing and creative production agency dedicated to accelerating growth for hospitality, lifestyle, and real estate brands.'
                : 'เราคือทีมผู้เชี่ยวชาญด้านการตลาดดิจิทัลและโปรดักชันที่พร้อมเป็นพาร์ทเนอร์เคียงข้างการเติบโตของแบรนด์คุณ'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="glass-card p-8 rounded-3xl border border-slate-800/80">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">
                {language === 'en' ? 'Our Vision' : 'วิสัยทัศน์ (Our Vision)'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {language === 'en'
                  ? 'To be Southeast Asia\'s leading creative marketing partner for the hospitality and lifestyle industries, bridging the art of architectural photography with data-driven digital marketing to create sustainable brand value.'
                  : 'มุ่งมั่นที่จะเป็น One-Stop Service Creative Marketing Agency ชั้นนำของประเทศไทย ที่ผสมผสานศาสตร์แห่งภาพถ่ายสถาปัตยกรรมระดับสูงเข้ากับการวางกลยุทธ์การตลาดที่สร้างยอดขายและสร้างมูลค่าแบรนด์อย่างยั่งยืน'}
              </p>
            </div>

            <div className="glass-card p-8 rounded-3xl border border-slate-800/80">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">
                {language === 'en' ? 'Our Standards & Craftsmanship' : 'มาตรฐานการทำงาน (Our Standards)'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {language === 'en'
                  ? 'Every deliverable is crafted with cinema-grade equipment and guided by professionals with hands-on hospitality marketing experience, ensuring timely execution and rigorous quality control at every stage.'
                  : 'ทุกชิ้นงานผ่านการคัดสรรอุปกรณ์โปรดักชันคุณภาพสูง ทีมงานที่มีประสบการณ์จริงในธุรกิจโรงแรมและการบริการ พร้อมกระบวนการส่งมอบงานที่รวดเร็ว ตรงเวลา และตรวจสอบคุณภาพทุกขั้นตอน'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
