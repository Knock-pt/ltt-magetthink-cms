'use client';

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useLanguage } from '../../lib/LanguageContext';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    service_interested: 'Digital Marketing & Social Media',
    budget_range: '50,000 - 100,000 THB',
    message: '',
    source_page: '/contact-us',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('https://ltt-backend.thunchanok-raj.workers.dev/api/public/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        alert(data.error || 'กรุณากรอกข้อมูลให้ครบถ้วน');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{t('contact_badge')}</span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-3">{t('contact_title')}</h1>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed">
              {t('contact_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-card p-6 rounded-3xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{t('contact_phone')}</h3>
                  <p className="text-xs text-slate-400 mt-1">096-042-9083 (คุณธัญชนก)</p>
                  <p className="text-[11px] text-blue-400 mt-0.5">จันทร์ - เสาร์ 09:00 - 18:00</p>
                </div>
              </div>

              <div className="glass-card p-6 rounded-3xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{t('contact_email')}</h3>
                  <p className="text-xs text-slate-400 mt-1">contact@lttmagetthink.co</p>
                  <p className="text-[11px] text-blue-400 mt-0.5">ตอบกลับภายใน 24 ชม.</p>
                </div>
              </div>

              <div className="glass-card p-6 rounded-3xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{t('contact_address')}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    บริษัท แอล ที ที มา เกท ธิงค์ จำกัด<br />
                    65/73 หมู่ 6 ต.ลำลูกกา อ.ลำลูกกา จ.ปทุมธานี 12150
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-7">
              <div className="glass-card p-8 sm:p-10 rounded-3xl border border-slate-800">
                {submitted ? (
                  <div className="py-16 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white">{t('contact_form_success_title')}</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      {t('contact_form_success_desc')}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          full_name: '',
                          email: '',
                          phone: '',
                          company: '',
                          service_interested: 'Digital Marketing & Social Media',
                          budget_range: '50,000 - 100,000 THB',
                          message: '',
                          source_page: '/contact-us',
                        });
                      }}
                      className="px-6 py-2.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
                    >
                      ส่งข้อความใหม่อีกครั้ง
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">
                          {t('contact_form_name')}
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                          placeholder="เช่น คุณสมชาย ใจดี"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">
                          {t('contact_form_phone')}
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                          placeholder="081-234-5678"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">
                          {t('contact_form_email')}
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                          placeholder="contact@yourcompany.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">
                          {t('contact_form_company')}
                        </label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                          placeholder="เช่น Cross Pattaya Resort"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">
                          {t('contact_form_service')}
                        </label>
                        <select
                          value={formData.service_interested}
                          onChange={(e) => setFormData({ ...formData, service_interested: e.target.value })}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                        >
                          <option value="Digital Marketing & Social Media">Digital Marketing & Social Media</option>
                          <option value="Commercial Photography">Commercial Photography</option>
                          <option value="Creative Content & Video Production">Creative Content & Video Production</option>
                          <option value="Influencer & KOL Matching">Influencer & KOL Matching</option>
                          <option value="Other">บริการอื่นๆ (Other)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">
                          {t('contact_form_budget')}
                        </label>
                        <select
                          value={formData.budget_range}
                          onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                        >
                          <option value="30,000 - 50,000 THB">30,000 - 50,000 THB</option>
                          <option value="50,000 - 100,000 THB">50,000 - 100,000 THB</option>
                          <option value="100,000 - 300,000 THB">100,000 - 300,000 THB</option>
                          <option value="300,000+ THB">300,000+ THB</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">
                        {t('contact_form_message')}
                      </label>
                      <textarea
                        required
                        rows="4"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                        placeholder="ระบุรายละเอียดโปรเจกต์ วัตถุประสงค์ หรือวันที่ต้องการเริ่มงาน..."
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? t('contact_form_submitting') : t('contact_form_submit')}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
