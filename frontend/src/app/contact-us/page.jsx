'use client';

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
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
        alert('เกิดข้อผิดพลาด: ' + (data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (err) {
      alert('ขอบคุณสำหรับข้อความ ทีมงานจะติดต่อกลับโดยเร็วที่สุดครับ');
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      <section className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">GET IN TOUCH</span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-3">ติดต่อเรา</h1>
            <p className="text-sm text-slate-400 mt-4">
              ปรึกษาแนวทางการตลาด ขอใบเสนอราคา หรือร่วมงานกับเรา กรอกข้อมูลด้านล่าง ทีมงานจะติดต่อกลับภายใน 24 ชม.
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
                  <h3 className="font-bold text-white text-sm">เบอร์โทรศัพท์</h3>
                  <p className="text-xs text-slate-400 mt-1">096-042-9083 (คุณธัญชนก)</p>
                  <p className="text-[11px] text-blue-400 mt-0.5">จันทร์ - เสาร์ 09:00 - 18:00</p>
                </div>
              </div>

              <div className="glass-card p-6 rounded-3xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">อีเมลติดต่อ</h3>
                  <p className="text-xs text-slate-400 mt-1">contact@lttmagetthink.co</p>
                  <p className="text-[11px] text-blue-400 mt-0.5">ตอบกลับภายในวันทำการ</p>
                </div>
              </div>

              <div className="glass-card p-6 rounded-3xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">ที่อยู่บริษัท</h3>
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
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-xl text-white mb-2">ส่งข้อมูลเรียบร้อยแล้ว</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      ขอบคุณที่สนใจบริการของ LTT Ma getThink ทีมงานได้รับข้อมูลแล้วและจะติดต่อกลับโดยเร็วที่สุดครับ
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">ชื่อ-นามสกุล *</label>
                        <input
                          type="text"
                          required
                          value={formData.full_name}
                          onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">เบอร์โทรศัพท์ *</label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">อีเมล *</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">ชื่อแบรนด์ / บริษัท</label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={e => setFormData({ ...formData, company: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">บริการที่สนใจ</label>
                        <select
                          value={formData.service_interested}
                          onChange={e => setFormData({ ...formData, service_interested: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option>Digital Marketing & Social Media</option>
                          <option>Commercial Photography & Production</option>
                          <option>Creative Content & Short Video</option>
                          <option>Influencer & KOL Matching</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">งบประมาณที่วางไว้</label>
                        <select
                          value={formData.budget_range}
                          onChange={e => setFormData({ ...formData, budget_range: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option>30,000 - 50,000 THB</option>
                          <option>50,000 - 100,000 THB</option>
                          <option>100,000 - 250,000 THB</option>
                          <option>250,000+ THB</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">รายละเอียดโปรเจกต์ *</label>
                      <textarea
                        rows={4}
                        required
                        value={formData.message}
                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                        placeholder="บอกเล่ารายละเอียด Scope งาน วันที่ต้องการเริ่ม หรือเป้าหมายของแคมเปญ"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูลติดต่อ'}</span>
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
