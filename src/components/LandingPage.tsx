import { useState } from "react";
import { 
  Zap, 
  ShieldCheck, 
  Percent, 
  ArrowRight, 
  Code2, 
  CheckCircle2, 
  Sparkles, 
  Calculator, 
  CreditCard, 
  QrCode 
} from "lucide-react";

interface LandingPageProps {
  onEnterDashboard: () => void;
  onEnterDocs: () => void;
}

export default function LandingPage({ onEnterDashboard, onEnterDocs }: LandingPageProps) {
  const [calcAmount, setCalcAmount] = useState<number>(100000);
  
  // Fee breakdown logic
  const calculateFees = (amount: number) => {
    // QRIS <= 105000: 0.7% + Rp 310
    // QRIS > 105000: 1%
    const qrisFee = amount <= 105000 
      ? Math.round(amount * 0.007 + 310) 
      : Math.round(amount * 0.01);
      
    const vaStandardFee = 3500; // BRI/BNI/CIMB/Maybank/Permata/ATM Bersama
    const vaSpecialFee = 2000;  // Artha Graha/Sampoerna
    
    return {
      qrisFee,
      qrisNet: amount - qrisFee,
      vaStandardFee,
      vaStandardNet: Math.max(0, amount - vaStandardFee),
      vaSpecialFee,
      vaSpecialNet: Math.max(0, amount - vaSpecialFee)
    };
  };

  const fees = calculateFees(calcAmount || 0);

  return (
    <div className="bg-paper text-ink min-h-screen font-sans">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden grid-bg border-b-4 border-ink pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto relative z-10 text-left">
          
          <div className="flex flex-wrap gap-2.5 mb-8">
            <span className="pill bg-neon text-ink">
              ⚡ AKTIVASI INSTAN
            </span>
            <span className="pill bg-ink text-white font-black tracking-normal">
              0% SUBSCRIPTION FEE
            </span>
          </div>
          
          {/* Brutalist Hero Headings */}
          <h1 className="text-5xl sm:text-[90px] font-black tracking-tighter leading-[0.9] text-ink select-none uppercase">
            BAYAR<br />
            <span className="brutal-text-stroke uppercase">TANPA</span><br />
            <span className="bg-neon px-2 inline-block rotate-[-1deg] my-2">RIBET.</span>
          </h1>
          
          <p className="mt-8 text-xl sm:text-2xl max-w-2xl font-bold text-ink leading-relaxed">
            Platform payment link sederhana untuk UMKM dan Developer Indonesia. Buat payment link QRIS & Virtual Account dalam hitungan detik tanpa berkas fisik berlebih.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row justify-start items-stretch sm:items-center gap-4 max-w-lg">
            <button
              onClick={onEnterDashboard}
              className="px-8 py-5 bg-neon hover:bg-white text-ink border-3 border-ink font-black text-sm uppercase tracking-wider brutal-shadow-lg active:translate-y-1 active:shadow-brutal transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Coba Portal Merchant 
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onEnterDocs}
              className="px-8 py-5 bg-white hover:bg-neon text-ink border-3 border-ink font-black text-sm uppercase tracking-wider brutal-shadow-lg active:translate-y-1 active:shadow-brutal transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Code2 className="w-5 h-5" />
              Dokumentasi API & SDK
            </button>
          </div>
          
          {/* Hero Bullet Badges */}
          <div className="mt-16 flex flex-wrap gap-4 text-xs font-black uppercase tracking-wider border-t-3 border-ink pt-8">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border-2 border-ink shadow-[2px_2px_0px_#000]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 font-bold" />
              <span>Bebas Biaya Pendaftaran</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border-2 border-ink shadow-[2px_2px_0px_#000]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 font-bold" />
              <span>Penarikan Dana H+1 Lancar</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border-2 border-ink shadow-[2px_2px_0px_#000]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 font-bold" />
              <span>Mitra PG Berizin Resmi BI</span>
            </div>
          </div>

        </div>
      </section>

      {/* Value Propositions & Fitur Utama */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-left mb-16 max-w-3xl">
          <span className="text-xs font-black uppercase text-slate-500 tracking-widest block mb-2">// KEUNGGULAN UTAMA</span>
          <h2 className="text-4xl font-extrabold text-ink tracking-tight uppercase">
            SEDERHANA, HEMAT, DAN SIAP PAKAI
          </h2>
          <p className="mt-4 text-lg font-bold text-ink/75">
            Gosir didancang khusus bagi mereka yang membutuhkan solusi pembayaran online tanpa proses birokrasi berbelit.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 brutal-border brutal-shadow-lg hover:shadow-none transition-all flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-neon brutal-border flex items-center justify-center text-ink font-bold text-xl mb-6 shadow-[2px_2px_0px_#000]">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black mb-3 uppercase">Aktivasi Instan</h3>
              <p className="text-ink/80 text-sm font-bold leading-relaxed">
                Daftar hari ini dan langsung terima pembayaran hari ini juga. Tanpa perlu melampirkan berkas fisik bertumpuk atau verifikasi berhari-hari.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 brutal-border brutal-shadow-lg hover:shadow-none transition-all flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-neon brutal-border flex items-center justify-center text-ink font-bold text-xl mb-6 shadow-[2px_2px_0px_#000]">
                <Percent className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black mb-3 uppercase">Skema Pay-per-Tx</h3>
              <p className="text-ink/80 text-sm font-bold leading-relaxed">
                Tidak ada biaya bulanan atau berlangganan. Kami hanya membebankan biaya per transaksi sukses. Jika tidak ada transaksi, Anda bayar Rp 0.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 brutal-border brutal-shadow-lg hover:shadow-none transition-all flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-neon brutal-border flex items-center justify-center text-ink font-bold text-xl mb-6 shadow-[2px_2px_0px_#000]">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black mb-3 uppercase">Kemitraan Legal</h3>
              <p className="text-ink/80 text-sm font-bold leading-relaxed">
                Gosir bermitra dengan Payment Gateway resmi berizin Bank Indonesia dan terdaftar di PSE Kominfo. Dana aman dalam kendali sistem PG resmi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Kalkulator Simulasi Biaya Interaktif */}
      <section className="bg-ink text-white py-20 px-4 sm:px-6 lg:px-8 border-y-4 border-ink">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-left mb-12">
            <div className="inline-flex items-center gap-1.5 bg-neon text-ink border-2 border-ink px-3 py-1 font-black uppercase text-xs mb-3 shadow-[2px_2px_0px_#fff]">
              <Calculator className="w-3.5 h-3.5" />
              <span>KATALISATOR TRANSPARAN</span>
            </div>
            <h2 className="text-4xl font-extrabold uppercase my-2">Simulasikan Potongan Transaksi Anda</h2>
            <p className="text-slate-300 max-w-2xl text-sm font-bold">Ketahui persis berapa dana bersih yang Anda terima setelah biaya potongan transaksi Gosir.</p>
          </div>

          {/* Brutalist dual split screen */}
          <div className="grid md:grid-cols-12 gap-8 items-stretch">
            
            {/* Input Side (Span 5) */}
            <div className="md:col-span-5 bg-[#1C1C1C] border-3 border-white p-6 sm:p-8 flex flex-col justify-between shadow-[6px_6px_0px_0px_#00FF5F]">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                  Nominal Transaksi (Rupiah)
                </label>
                <div className="relative mb-6">
                  <span className="absolute left-4 top-3.5 text-slate-400 font-mono font-black text-lg">Rp</span>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="Contoh: 100000"
                    className="w-full pl-12 pr-4 py-3.5 bg-black border-2 border-slate-700 text-white font-mono text-xl font-bold focus:outline-none focus:border-neon"
                  />
                </div>

                <div className="text-xs text-slate-300 space-y-3 pt-4 border-t border-slate-800">
                  <p className="font-black text-neon uppercase">💡 Aturan Tarif Potongan Gosir:</p>
                  
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span>QRIS (≤ Rp105.000)</span>
                    <span className="font-mono font-bold text-neon">0.7% + Rp 310</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span>QRIS (&gt; Rp105.000)</span>
                    <span className="font-mono font-bold text-neon">1.0% flat</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span>VA BRI, BNI, CIMB, Mandiri</span>
                    <span className="font-mono font-bold text-neon">Rp 3.500 flat</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VA Artha Graha, Sampoerna</span>
                    <span className="font-mono font-bold text-neon">Rp 2.000 flat</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Output Side (Span 7) */}
            <div className="md:col-span-7 bg-white text-ink border-3 border-ink p-6 sm:p-8 flex flex-col justify-between shadow-[6px_6px_0px_0px_#00FF5F]">
              <div>
                <h4 className="text-xs font-black text-slate-500 tracking-wider uppercase mb-6">// ESTIMASI PENERIMAAN BERSIH MERCHANT</h4>
                
                <div className="grid sm:grid-cols-3 gap-4">
                  
                  {/* QRIS Line */}
                  <div className="p-4 bg-paper border-2 border-ink shadow-[3px_3px_0px_#000]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <QrCode className="w-4 h-4 text-ink shrink-0" />
                      <span className="text-xs font-black uppercase">METODE QRIS</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mb-1">Potongan: Rp {fees.qrisFee.toLocaleString('id-ID')}</span>
                    <div className="text-lg font-mono font-black text-ink">
                      Rp {fees.qrisNet.toLocaleString('id-ID')}
                    </div>
                  </div>

                  {/* VA Bank Flat */}
                  <div className="p-4 bg-paper border-2 border-ink shadow-[3px_3px_0px_#000]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <CreditCard className="w-4 h-4 text-ink shrink-0" />
                      <span className="text-xs font-black uppercase">VA STANDARD</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mb-1">Potongan: Rp {fees.vaStandardFee.toLocaleString('id-ID')}</span>
                    <div className="text-lg font-mono font-black text-ink">
                      Rp {fees.vaStandardNet.toLocaleString('id-ID')}
                    </div>
                  </div>

                  {/* VA Sampoerna / AG */}
                  <div className="p-4 bg-paper border-2 border-ink shadow-[3px_3px_0px_#000]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <CreditCard className="w-4 h-4 text-ink shrink-0" />
                      <span className="text-xs font-black uppercase">VA SPECIAL</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mb-1">Potongan: Rp {fees.vaSpecialFee.toLocaleString('id-ID')}</span>
                    <div className="text-lg font-mono font-black text-ink">
                      Rp {fees.vaSpecialNet.toLocaleString('id-ID')}
                    </div>
                  </div>

                </div>
              </div>

              <div className="mt-8 text-xs text-slate-600 font-bold border-t border-slate-200 pt-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span>Semua biaya otomatis dipotong saat pelanggan membayar. Dana ditarik ke bank keesokan hari kerja secara berkala.</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Alur Kerja Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-center text-ink tracking-tight uppercase mb-16">
          HANYA 3 LANGKAH MUDAH TERIMA PEMBAYARAN
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 border-3 border-ink shadow-[4px_4px_0px_#000] text-left relative">
            <div className="w-14 h-14 bg-neon text-ink border-3 border-ink rounded-full flex items-center justify-center font-black text-xl mb-6 shadow-[2px_2px_0px_#000]">
              1
            </div>
            <h4 className="text-xl font-bold uppercase mb-3">Buat Proyek</h4>
            <p className="text-sm font-semibold text-slate-700 leading-relaxed">
              Masuk ke portal, buat sebuah “Proyek” untuk website atau toko Anda. Dapatkan API Key dan slug pembayaran unik langsung.
            </p>
          </div>

          <div className="bg-white p-8 border-3 border-ink shadow-[4px_4px_0px_#000] text-left relative">
            <div className="w-14 h-14 bg-neon text-ink border-3 border-ink rounded-full flex items-center justify-center font-black text-xl mb-6 shadow-[2px_2px_0px_#000]">
              2
            </div>
            <h4 className="text-xl font-bold uppercase mb-3">Panggil REST API</h4>
            <p className="text-sm font-semibold text-slate-700 leading-relaxed">
              Arahkan pembeli langsung ke URL pembayaran kami atau buat transaksi dinamis secara otomatis melalui REST API instan.
            </p>
          </div>

          <div className="bg-white p-8 border-3 border-ink shadow-[4px_4px_0px_#000] text-left relative">
            <div className="w-14 h-14 bg-neon text-ink border-3 border-ink rounded-full flex items-center justify-center font-black text-xl mb-6 shadow-[2px_2px_0px_#000]">
              3
            </div>
            <h4 className="text-xl font-bold uppercase mb-3">Kirim Webhook</h4>
            <p className="text-sm font-semibold text-slate-700 leading-relaxed">
              Sistem kami mengirimkan Webhook ke server Anda dalam hitungan milidetik setelah QRIS dipindai atau VA dibayar sukses.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-ink py-16 px-4 sm:px-6 lg:px-8 border-t-4 border-ink">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="max-w-md">
            <div className="flex items-center gap-2 mb-4 font-black italic text-2xl tracking-tighter">
              <span className="w-4 h-4 bg-neon brutal-border-thin inline-block"></span>
              GOSIR
            </div>
            <p className="text-sm font-bold text-slate-700 leading-relaxed mb-6">
              Solusi integrasi gerbang bayar handal. Terpercaya, teregulasi mitra Bank Indonesia, dan patuh regulasi PSE Kominfo.
            </p>
          </div>

          <div className="text-xs space-y-3 font-semibold text-slate-600 md:text-right">
            <div>GOSIR DIGITAL INDONESIA</div>
            <div className="flex md:justify-end items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
              <span>System Operational Live</span>
            </div>
            <div className="text-slate-400 text-[11px] pt-4 border-t border-slate-200">
              © 2026 Gosir. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
