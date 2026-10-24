import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-24 text-center">
        <div className="max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-600/10 border border-blue-500/20 text-blue-400 font-extrabold text-3xl mb-6 shadow-xl shadow-blue-500/10">
            404
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">ไม่พบหน้าที่คุณต้องการ</h1>
          <p className="text-xs sm:text-sm text-slate-400 mb-8 leading-relaxed">
            หน้าที่คุณกำลังค้นหาไม่มีอยู่ ถูกย้าย หรือไม่มีสิทธิ์เข้าถึงบนเว็บไซต์นี้
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้าแรก</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
