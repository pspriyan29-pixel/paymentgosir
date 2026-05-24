import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Key, 
  Globe, 
  ToggleLeft, 
  ToggleRight, 
  Copy, 
  Check, 
  AlertCircle, 
  Building,
  DollarSign,
  ArrowRightLeft
} from "lucide-react";
import { Project, BalanceWithdrawal } from "../types";

interface ProjectManagerProps {
  projects: Project[];
  withdrawals: BalanceWithdrawal[];
  onAddProject: (p: { name: string; webhookUrl: string; redirectUrl: string; qrisOnly: boolean }) => void;
  onEditProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onWithdrawFunds: (amount: number, bankName: string, accountNumber: string, accountName: string) => Promise<boolean>;
  balance: number;
}

export default function ProjectManager({
  projects,
  withdrawals,
  onAddProject,
  onEditProject,
  onDeleteProject,
  onWithdrawFunds,
  balance
}: ProjectManagerProps) {
  // New Project Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjWebhook, setNewProjWebhook] = useState("");
  const [newProjRedirect, setNewProjRedirect] = useState("");
  const [newProjQrisOnly, setNewProjQrisOnly] = useState(false);

  // Withdrawal Form State
  const [showWdForm, setShowWdForm] = useState(false);
  const [wdAmount, setWdAmount] = useState<number>(0);
  const [wdBank, setWdBank] = useState("Bank Mandiri");
  const [wdAccountNum, setWdAccountNum] = useState("");
  const [wdAccountName, setWdAccountName] = useState("");
  const [wdError, setWdError] = useState("");
  const [wdSuccess, setWdSuccess] = useState(false);

  // UI helpers
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [showApiKeyId, setShowApiKeyId] = useState<string | null>(null);

  const handleCopy = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleAddProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    onAddProject({
      name: newProjName,
      webhookUrl: newProjWebhook,
      redirectUrl: newProjRedirect,
      qrisOnly: newProjQrisOnly,
    });
    // Reset
    setNewProjName("");
    setNewProjWebhook("");
    setNewProjRedirect("");
    setNewProjQrisOnly(false);
    setShowAddForm(false);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWdError("");
    setWdSuccess(false);

    if (wdAmount <= 10000) {
      setWdError("Minimal penarikan dana adalah Rp 10.000.");
      return;
    }
    if (wdAmount > balance) {
      setWdError("Saldo Anda tidak mencukupi untuk penarikan ini.");
      return;
    }
    if (!wdAccountNum || !wdAccountName) {
      setWdError("Harap isi seluruh informasi rekening bank dengan lengkap.");
      return;
    }

    const ok = await onWithdrawFunds(wdAmount, wdBank, wdAccountNum, wdAccountName);
    if (ok) {
      setWdSuccess(true);
      setWdAmount(0);
      setWdAccountNum("");
      setWdAccountName("");
      setTimeout(() => {
        setWdSuccess(false);
        setShowWdForm(false);
      }, 3000);
    } else {
      setWdError("Terjadi kesalahan sistem saat memproses penarikan Dana.");
    }
  };

  const activeWithdrawalValue = balance > 4500 ? balance - 4500 : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      
      {/* Top Banner & Quick Analytics */}
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Total Balance Card */}
        <div id="balance_card" className="bg-white border-4 border-ink p-6 shadow-brutal flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Total Saldo Terkumpul</span>
              <span className="px-2 py-0.5 bg-neon text-ink border-2 border-ink text-[9px] font-black uppercase tracking-wider">
                SIAP TARIK
              </span>
            </div>
            <div className="text-4xl font-mono font-black text-ink mb-2">
              Rp {balance.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-slate-600 font-bold leading-relaxed mb-4">
              Pencairan diproses instan ke rekening Anda dengan biaya transfer bank flat Rp 4.500.
            </p>
          </div>
          <button
            onClick={() => {
              setWdAmount(activeWithdrawalValue);
              setShowWdForm(!showWdForm);
              setWdError("");
            }}
            className="w-full py-3 bg-neon hover:bg-white text-ink border-3 border-ink font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#000] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowRightLeft className="w-4 h-4 text-ink shrink-0" />
            Tarik Saldo Rekening
          </button>
        </div>

        {/* Info Box 1 */}
        <div className="bg-white border-4 border-ink p-6 shadow-brutal flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Aktivasi Akun</span>
              <span className="px-2 py-0.5 bg-neon text-ink border-2 border-ink text-[9px] font-black uppercase">
                AKTIF SEKETIKA
              </span>
            </div>
            <h4 className="text-xl font-black uppercase text-ink mb-1">Akses Instan 100%</h4>
            <p className="text-xs text-slate-600 font-bold leading-relaxed">
              Akun merchant Anda saat ini berada di jaringan Live Produksi. Anda dapat membuat ribuan proyek terpisah tanpa perlu proses aktivasi birokrasi yang rumit.
            </p>
          </div>
          <div className="border-t-2 border-ink pt-3 mt-4 flex items-center justify-between text-xs text-ink font-black uppercase tracking-wider">
            <span>Dikelola oleh Gosir</span>
            <span className="text-emerald-700">✓ Verifikasi OK</span>
          </div>
        </div>

        {/* Info Box 2 */}
        <div className="bg-white border-4 border-ink p-6 shadow-brutal flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Statistik Proyek</span>
              <span className="text-xs font-mono font-black text-ink bg-neon px-2 py-0.5 border-2 border-ink">{projects.length} AKTIF</span>
            </div>
            <h4 className="text-xl font-black uppercase text-ink mb-1">Dukungan Multi-Unit</h4>
            <p className="text-xs text-slate-600 font-bold leading-relaxed">
              Masing-masing proyek memiliki Slug, Callback Webhook, dan API Key rahasia sendiri. Cocok untuk mengelola pembayaran multi-website.
            </p>
          </div>
          <div className="border-t-2 border-ink pt-3 mt-4 text-xs font-black uppercase tracking-wider text-slate-500">
            QRIS & Virtual Account Siap Digunakan
          </div>
        </div>

      </div>

      {/* Withdrawal Form Section */}
      {showWdForm && (
        <div className="bg-white text-ink border-4 border-ink p-6 shadow-brutal-lg max-w-4xl mx-auto transition-all">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-3 border-ink">
            <h3 className="text-xl font-black uppercase flex items-center gap-2">
              <Building className="text-ink w-5 h-5" />
              FORMULIR PENARIKAN DANA (WITHDRAWAL)
            </h3>
            <button 
              onClick={() => setShowWdForm(false)}
              className="text-xs bg-ink text-white border-2 border-ink px-3 py-1 font-black uppercase hover:bg-neon hover:text-ink transition-all cursor-pointer"
            >
              Tutup [X]
            </button>
          </div>

          <form onSubmit={handleWithdrawSubmit} className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-ink mb-1.5">
                  Nominal Penarikan
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-black">Rp</span>
                  <input
                    type="number"
                    value={wdAmount || ""}
                    onChange={(e) => setWdAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="Contoh: 50000"
                    className="w-full pl-9 pr-4 py-2 bg-paper border-2 border-ink text-ink font-mono font-black text-sm focus:bg-white focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-bold mt-1">
                  *Dana tersisa di saldo harus mencukupi biaya transfer.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-ink mb-1.5">
                  Bank Tujuan
                </label>
                <select
                  value={wdBank}
                  onChange={(e) => setWdBank(e.target.value)}
                  className="w-full px-3 py-2 bg-paper border-2 border-ink text-ink font-bold text-sm focus:bg-white focus:outline-none"
                >
                  <option value="Bank Mandiri">Bank Mandiri</option>
                  <option value="Bank BRI">Bank BRI</option>
                  <option value="Bank BNI">Bank BNI</option>
                  <option value="Bank BCA">Bank BCA</option>
                  <option value="Bank Permata">Bank Permata</option>
                  <option value="Bank CIMB Niaga">Bank CIMB Niaga</option>
                  <option value="OVO">e-Wallet OVO</option>
                  <option value="DANA">e-Wallet DANA</option>
                  <option value="GoPay">e-Wallet GoPay</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-ink mb-1.5">
                  Nomor Rekening / No. HP eWallet
                </label>
                <input
                  type="text"
                  value={wdAccountNum}
                  onChange={(e) => setWdAccountNum(e.target.value)}
                  placeholder="Contoh: 1350012345678"
                  className="w-full px-3 py-2 bg-paper border-2 border-ink text-ink font-mono font-black text-sm focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-ink mb-1.5">
                  Nama Pemilik Rekening
                </label>
                <input
                  type="text"
                  value={wdAccountName}
                  onChange={(e) => setWdAccountName(e.target.value)}
                  placeholder="Contoh: Rudi Hartono"
                  className="w-full px-3 py-2 bg-paper border-2 border-ink text-ink font-bold text-sm focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-2 border-t-3 border-ink pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-700 font-bold">
                <span className="font-black">Rincian:</span> Biaya Transfer Bank Flat <span className="font-mono font-black text-red-600">Rp 4.500</span> dibebankan dari saldo penarikan.
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowWdForm(false)}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-paper hover:bg-neon border-2 border-ink font-black uppercase text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-neon hover:bg-white border-2 border-ink font-black uppercase text-xs transition-all shadow-[2px_2px_0px_#000] cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4 shrink-0" />
                  Konfirmasi Tarik Dana
                </button>
              </div>
            </div>

            {wdError && (
              <div className="md:col-span-2 bg-red-100 border-2 border-ink text-ink p-3.5 font-bold text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{wdError}</span>
              </div>
            )}

            {wdSuccess && (
              <div className="md:col-span-2 bg-neon border-2 border-ink text-ink p-3.5 font-black text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-ink shrink-0 font-black" />
                <span>Simulasi Penarikan Saldo Berhasil! Dana ditransfer ke rekening bank Anda.</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Heading of Projects & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
        <div>
          <h2 className="text-3xl font-black text-ink tracking-tight uppercase">Daftar Proyek Pembayaran</h2>
          <p className="text-sm text-slate-500 font-bold">Kelola credentials, url bayar, webhook callback dan pengaturan QRIS instan.</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-3 bg-neon hover:bg-white text-ink border-3 border-ink font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#000] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 cursor-pointer select-none ml-auto sm:ml-0"
        >
          <Plus className="w-4.5 h-4.5 font-black" />
          <span>Buat Proyek Baru</span>
        </button>
      </div>

      {/* Add New Project Inline Form */}
      {showAddForm && (
        <form 
          onSubmit={handleAddProjectSubmit}
          className="bg-white border-4 border-ink p-6 shadow-brutal space-y-4"
        >
          <h3 className="text-lg font-black text-ink uppercase flex items-center gap-1.5">
            <Plus className="w-5 h-5 text-ink font-black" />
            Konfigurasi Proyek Pembayaran Baru
          </h3>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase mb-1">
                Nama Proyek <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                placeholder="Contoh: Toko Buku Online"
                className="w-full px-3 py-2 bg-paper border-2 border-ink font-semibold text-sm focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-600 uppercase mb-1">
                Webhook Callback URL (Opsional)
              </label>
              <input
                type="url"
                value={newProjWebhook}
                onChange={(e) => setNewProjWebhook(e.target.value)}
                placeholder="Contoh: https://server.com/api/payment-webhook"
                className="w-full px-3 py-2 bg-paper border-2 border-ink font-semibold text-sm focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-600 uppercase mb-1">
                Redirect URL Setelah Bayar (Opsional)
              </label>
              <input
                type="url"
                value={newProjRedirect}
                onChange={(e) => setNewProjRedirect(e.target.value)}
                placeholder="Contoh: https://toko.com/invoice/thankyou"
                className="w-full px-3 py-2 bg-paper border-2 border-ink font-semibold text-sm focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <button
                type="button"
                onClick={() => setNewProjQrisOnly(!newProjQrisOnly)}
                className="text-ink focus:outline-none cursor-pointer"
              >
                {newProjQrisOnly ? (
                  <ToggleRight className="w-8 h-8 text-black" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
              <div>
                <label className="block text-xs font-black text-ink uppercase leading-normal select-none">
                  Batasi Hanya Menerima QRIS
                </label>
                <p className="text-[10px] text-slate-500 font-bold">Pembeli hanya dapat melakukan pembayaran melalui QRIS.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t-2 border-ink">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-black uppercase text-slate-600 hover:text-ink cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-neon hover:bg-white border-2 border-ink font-black uppercase text-xs shadow-[2px_2px_0px_#000] cursor-pointer"
            >
              Simpan Proyek
            </button>
          </div>
        </form>
      )}

      {/* Projects Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {projects.length === 0 ? (
          <div className="lg:col-span-2 bg-white text-slate-500 py-16 text-center border-4 border-dashed border-ink shadow-brutal">
            <span className="block text-xl font-black text-ink uppercase mb-2">Belum Ada Proyek Pembayaran</span>
            <p className="text-xs font-bold text-slate-600">Silakan klik "Buat Proyek Baru" di atas untuk memulainya.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div 
              key={project.id}
              className="bg-white border-4 border-ink shadow-brutal overflow-hidden"
            >
              {/* Header */}
              <div className="bg-paper border-b-3 border-ink p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold uppercase text-ink text-xl leading-tight">{project.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] font-mono bg-white border border-ink text-ink px-1.5 py-0.5 rounded-xs font-bold">
                      slug: {project.slug}
                    </span>
                    {project.qrisOnly && (
                      <span className="text-[9px] bg-red-100 border border-red-400 text-red-800 font-black px-1.5 py-0.5 rounded-xs uppercase tracking-wide">
                        QRIS Only
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onDeleteProject(project.id)}
                  title="Hapus Proyek"
                  className="px-2.5 py-1.5 text-xs bg-white text-red-600 hover:bg-red-50 border-2 border-ink font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#000]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus
                </button>
              </div>

              {/* Secrets & Settings Body */}
              <div className="p-5 space-y-4">
                
                {/* API Key Box */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 tracking-wider uppercase mb-1.5 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-ink shrink-0" />
                    Live API Key Secret (Bearer Authorization)
                  </label>
                  <div className="flex items-center gap-2 bg-[#1C1C1C] text-white p-3 border-2 border-ink font-mono text-xs relative">
                    <input
                      type={showApiKeyId === project.id ? "text" : "password"}
                      readOnly
                      value={project.apiKey}
                      className="bg-transparent border-0 outline-none text-white font-mono w-full pr-16 text-xs font-black select-all"
                    />
                    <div className="absolute right-2 flex items-center gap-1.5 bg-[#1C1C1C] pl-2">
                      <button
                        onClick={() => setShowApiKeyId(showApiKeyId === project.id ? null : project.id)}
                        className="text-[10px] bg-white text-ink border border-ink font-black px-1.5 py-0.5 hover:bg-neon transition-all cursor-pointer"
                      >
                        {showApiKeyId === project.id ? "HIDE" : "SHOW"}
                      </button>
                      <button
                        onClick={() => handleCopy(project.apiKey, project.id)}
                        className="p-1 bg-white text-ink border border-ink hover:bg-neon transition-all shrink-0 cursor-pointer"
                      >
                        {copiedKeyId === project.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Slug integration display */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 tracking-wider uppercase mb-1.5 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-ink shrink-0" />
                    Slug endpoint Pembayaran Langsung (URL)
                  </label>
                  <div className="bg-paper p-3 border-2 border-ink font-mono text-xs text-ink flex items-center justify-between">
                    <span className="truncate pr-4 text-[11px] font-bold">
                      {`/pay/${project.slug}/{amount}?order_id=INV-xxx`}
                    </span>
                    <button
                      onClick={() => handleCopy(`${window.location.origin}/pay/${project.slug}/50000?order_id=INV-TEST-DEB`, `${project.id}_slug`)}
                      className="p-1 bg-white text-ink border border-ink hover:bg-neon shrink-0 cursor-pointer"
                    >
                      {copiedKeyId === `${project.id}_slug` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Inline Editing elements */}
                <div className="grid sm:grid-cols-2 gap-4 pt-3 border-t-2 border-ink">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                      Webhook Callback URL
                    </label>
                    <input
                      type="url"
                      value={project.webhookUrl}
                      onChange={(e) => onEditProject(project.id, { webhookUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-2.5 py-1.5 bg-paper border-2 border-ink font-mono text-[11px] text-ink outline-none focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                      Redirect URL Setelah Pembayaran
                    </label>
                    <input
                      type="url"
                      value={project.redirectUrl}
                      onChange={(e) => onEditProject(project.id, { redirectUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-2.5 py-1.5 bg-paper border-2 border-ink font-mono text-[11px] text-ink outline-none focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* QRIS limit option container block */}
                <div className="flex justify-between items-center bg-paper p-3 border-2 border-ink">
                  <span className="text-[11px] font-black uppercase text-ink">Batasi Hanya QRIS untuk Proyek ini?</span>
                  <button
                    type="button"
                    onClick={() => onEditProject(project.id, { qrisOnly: !project.qrisOnly })}
                    className="text-ink cursor-pointer focus:outline-none shrink-0"
                  >
                    {project.qrisOnly ? (
                      <ToggleRight className="w-7 h-7" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-400" />
                    )}
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Withdrawal Logs Historical Table Card */}
      <div className="bg-white border-4 border-ink shadow-brutal overflow-hidden">
        <div className="bg-paper border-b-3 border-ink p-5">
          <h3 className="text-xl font-black text-ink uppercase leading-tight">Riwayat Penarikan Dana</h3>
          <p className="text-xs text-slate-500 font-bold mt-1">Daftar pencairan saldo simulasi Anda ke rekening bank terdaftar.</p>
        </div>
        
        {withdrawals.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-bold italic">
            Belum ada data riwayat penarikan dana.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="bg-paper border-b-3 border-ink font-black text-ink uppercase">
                  <th className="p-4 pl-6">ID Penarikan</th>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Tujuan Transfer</th>
                  <th className="p-4">Biaya Transfer</th>
                  <th className="p-4">Nominal Bersih</th>
                  <th className="p-4 pr-6 text-right">Status Penarikan</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((wd) => (
                  <tr key={wd.id} className="border-b-2 border-ink last:border-0 hover:bg-neon/10 transition-colors">
                    <td className="p-4 pl-6 font-mono text-xs font-bold text-ink">{wd.id}</td>
                    <td className="p-4 text-xs font-bold text-slate-600">
                      {new Date(wd.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">
                      <div className="font-extrabold text-ink uppercase">{wd.bankName}</div>
                      <div className="text-[10px] text-slate-600 font-semibold">{wd.accountNumber} - a.n {wd.accountName}</div>
                    </td>
                    <td className="p-4 font-mono font-bold text-red-655">
                      Rp {wd.fee.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 font-mono font-black text-emerald-800 text-sm">
                      Rp {wd.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <span className="inline-block px-3 py-1 text-[9px] font-black uppercase bg-neon text-ink border-2 border-ink">
                        {wd.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
