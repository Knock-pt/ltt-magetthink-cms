import Link from 'next/link';

export default function Footer() {
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
              ผู้เชี่ยวชาญด้านการตลาดดิจิทัลและมีเดียโปรดักชันครบวงจรสำหรับธุรกิจโรงแรม รีสอร์ท อสังหาฯ และ F&B
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-xs text-white uppercase tracking-wider mb-3">เมนูนำทาง</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/" className="hover:text-blue-400 transition">หน้าแรก</Link></li>
              <li><Link href="/our-service" className="hover:text-blue-400 transition">บริการของเรา</Link></li>
              <li><Link href="/portfolio" className="hover:text-blue-400 transition">ผลงาน</Link></li>
              <li><Link href="/about-us" className="hover:text-blue-400 transition">เกี่ยวกับเรา</Link></li>
              <li><Link href="/blog" className="hover:text-blue-400 transition">บทความ & ข่าวสาร</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-xs text-white uppercase tracking-wider mb-3">บริการหลัก</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Digital Marketing & Social Media</li>
              <li>Commercial Photography</li>
              <li>Creative Content & Short Video</li>
              <li>Influencer & KOL Matching</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-xs text-white uppercase tracking-wider mb-3">ติดต่อบริษัท</h4>
            <p className="text-xs text-slate-400 mb-1">โทร: 096-042-9083</p>
            <p className="text-xs text-slate-400 mb-1">อีเมล: contact@lttmagetthink.co</p>
            <p className="text-xs text-slate-400">LINE OA: @lttmagetthink</p>
          </div>
        </div>
        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} LTT Ma getThink Co., Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/contact-us" className="hover:text-slate-400">ติดต่อเรา</Link>
            <a href="https://ltt-backend.thunchanok-raj.workers.dev/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Edge CMS Backoffice</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
