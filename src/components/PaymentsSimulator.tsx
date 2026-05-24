import React, { useState, useEffect } from "react";
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  CreditCard, 
  Plus, 
  RefreshCw, 
  Terminal, 
  Eye, 
  SmartphoneIcon,
  Shield,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { Project, Transaction, WebhookLog, PaymentMethodId } from "../types";
import { QRCodeSVG } from "qrcode.react";

interface PaymentsSimulatorProps {
  projects: Project[];
  transactions: Transaction[];
  webhookLogs: WebhookLog[];
  onCreateManualTransaction: (data: {
    projectId: string;
    amount: number;
    orderId: string;
    method: PaymentMethodId;
    customerName: string;
    customerEmail: string;
    notes: string;
  }) => Promise<any>;
  onPayTransaction: (id: string) => Promise<any>;
  onCancelTransaction: (id: string) => Promise<any>;
  onRefreshData: () => void;
}

export default function PaymentsSimulator({
  projects,
  transactions,
  webhookLogs,
  onCreateManualTransaction,
  onPayTransaction,
  onCancelTransaction,
  onRefreshData
}: PaymentsSimulatorProps) {
  
  // Selected Transaction for details and active pay-link simulator
  const [activeTx, setActiveTx] = useState<Transaction | null>(null);
  
  // Create Manual Tx Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formProjId, setFormProjId] = useState("");
  const [formAmount, setFormAmount] = useState<number>(50000);
  const [formOrderId, setFormOrderId] = useState("");
  const [formMethod, setFormMethod] = useState<PaymentMethodId>("qris");
  const [formCustName, setFormCustName] = useState("");
  const [formCustEmail, setFormCustEmail] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");

  // Customer UI interaction inside mobile mockup
  const [copiedCodeText, setCopiedCodeText] = useState(false);
  
  // Webhooks view controls
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  // Copy transaction link indicator
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  // Auto-allocate first project if available
  useEffect(() => {
    if (projects.length > 0 && !formProjId) {
      setFormProjId(projects[0].id);
    }
  }, [projects]);

  // Set default formOrderId if empty
  useEffect(() => {
    if (!formOrderId) {
      setFormOrderId(`ORD-${Date.now().toString().slice(-6)}`);
    }
  }, [showCreateForm]);

  // Select first transaction as active by default to show mockup immediately
  useEffect(() => {
    if (transactions.length > 0 && !activeTx) {
      setActiveTx(transactions[0]);
    }
  }, [transactions]);

  // Sync active transaction when transaction state refreshes on server
  useEffect(() => {
    if (activeTx) {
      const refreshedIdx = transactions.findIndex(t => t.id === activeTx.id);
      if (refreshedIdx !== -1) {
        setActiveTx(transactions[refreshedIdx]);
      }
    }
  }, [transactions, activeTx?.id]);

  const handleCreateTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formProjId) {
      setFormError("Harap pilih proyek pembayaran.");
      return;
    }
    if (!formAmount || formAmount <= 0) {
      setFormError("Jumlah nominal pembayaran harus lebih besar dari 0.");
      return;
    }
    if (!formOrderId.trim()) {
      setFormError("Order ID wajib diisi.");
      return;
    }

    try {
      const resp = await onCreateManualTransaction({
        projectId: formProjId,
        amount: Number(formAmount),
        orderId: formOrderId,
        method: formMethod,
        customerName: formCustName,
        customerEmail: formCustEmail,
        notes: formNotes
      });
      // Reset form
      setFormOrderId("");
      setFormCustName("");
      setFormCustEmail("");
      setFormNotes("");
      setShowCreateForm(false);
      
      // Auto-set as active to inspect
      if (resp && resp.transaction) {
        setActiveTx(resp.transaction);
      }
    } catch (err: any) {
      setFormError(err.message || "Gagal membuat transaksi.");
    }
  };

  const handlePaySimulate = async (id: string) => {
    try {
      await onPayTransaction(id);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelSimulate = async (id: string) => {
    try {
      await onCancelTransaction(id);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const copyPaymentCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeText(true);
    setTimeout(() => setCopiedCodeText(false), 2000);
  };

  // Find associated project for active Tx
  const activeTxProject = activeTx ? projects.find(p => p.id === activeTx.projectId) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      
      {/* Intro info bar */}
      <div className="bg-white text-ink border-4 border-ink p-6 shadow-brutal flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-1.5 uppercase leading-none mb-1">
            <SmartphoneIcon className="w-5 h-5 text-ink" />
            Portal Pembayaran & Verifikasi Transfer Live
          </h2>
          <p className="text-xs text-slate-600 font-bold">
            Di sini pembeli dapat melihat rincian tagihan real-time, mendapati rekening transfers resmi, serta memicu verifikasi pencocokan mutasi dan pengiriman webhook otomatis!
          </p>
        </div>
        <div className="flex items-center gap-3 self-end md:self-center">
          <button 
            onClick={onRefreshData}
            className="px-4 py-2 bg-paper hover:bg-neon hover:text-ink border-2 border-ink text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#000] active:translate-y-0.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Merchant Panel (Ledger & Webhook Listeners) - Span 7 */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Quick Create Transaction Link Button */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-ink uppercase flex items-center gap-2">
              <History className="w-5 h-5 text-ink shrink-0" />
              Log Pembayaran Merchant
            </h3>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-3 py-1.5 bg-ink text-white hover:bg-neon hover:text-ink border-2 border-ink font-black uppercase text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-[2px_2px_0px_#000]"
            >
              <Plus className="w-3.5 h-3.5" />
              Buat Tagihan Manual
            </button>
          </div>

          {/* Form to create Tagihan Manual */}
          {showCreateForm && (
            <form 
              onSubmit={handleCreateTxSubmit}
              className="bg-white border-4 border-ink p-5 shadow-brutal space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b-2 border-ink">
                <h4 className="text-sm font-black text-ink uppercase">// Buat Tautan Pembayaran Simulasi</h4>
                <button 
                  type="button" 
                  onClick={() => setShowCreateForm(false)}
                  className="text-xs font-black hover:text-red-650 uppercase"
                >
                  Tutup [X]
                </button>
              </div>

              {formError && (
                <div className="bg-red-100 border-2 border-ink text-ink p-2.5 rounded-none text-xs flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4 text-xs font-bold">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1">Pilih Proyek Merchant</label>
                  <select
                    value={formProjId}
                    onChange={(e) => setFormProjId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-paper border-2 border-ink text-ink text-xs focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Pilih Proyek --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1">Jumlah Nominal (Rupiah)</label>
                  <input
                    type="number"
                    value={formAmount || ""}
                    onChange={(e) => setFormAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="Contoh: 100000"
                    className="w-full px-3 py-1.5 bg-paper border-2 border-ink text-xs text-ink font-mono font-black focus:bg-white focus:outline-none animate-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1">Order ID</label>
                  <input
                    type="text"
                    required
                    value={formOrderId}
                    onChange={(e) => setFormOrderId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-paper border-2 border-ink text-xs text-ink font-mono font-black focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-555 uppercase mb-1">Metode Utama</label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as PaymentMethodId)}
                    className="w-full px-3 py-1.5 bg-paper border-2 border-ink text-ink text-xs focus:bg-white focus:outline-none"
                  >
                    <option value="qris">QRIS (Semua e-Wallet/QR / DANA HP)</option>
                    <option value="va_mandiri">Virtual Account Mandiri (Live)</option>
                    <option value="va_bri">Virtual Account BRI (Live)</option>
                    <option value="va_bni">Virtual Account BNI</option>
                    <option value="va_cimb">Virtual Account CIMB Niaga</option>
                    <option value="va_permata">Virtual Account Permata</option>
                    <option value="va_maybank">Virtual Account Maybank</option>
                    <option value="va_artha_graha">Virtual Account Artha Graha</option>
                    <option value="va_sampoerna">Virtual Account Sahabat Sampoerna</option>
                    <option value="va_bnc">Virtual Account Bank Neo Commerce</option>
                    <option value="va_atm_bersama">Koneksi ATM Bersama</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1">Nama Customer (Opsional)</label>
                  <input
                    type="text"
                    value={formCustName}
                    onChange={(e) => setFormCustName(e.target.value)}
                    placeholder="Contoh: Budi"
                    className="w-full px-3 py-1.5 bg-paper border-2 border-ink text-xs text-ink focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1">Email Customer (Opsional)</label>
                  <input
                    type="email"
                    value={formCustEmail}
                    onChange={(e) => setFormCustEmail(e.target.value)}
                    placeholder="budi@domain.com"
                    className="w-full px-3 py-1.5 bg-paper border-2 border-ink text-xs text-ink focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1">Catatan Tambahan (Opsional)</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Misal: Pembayaran Tiket Seminar Event X"
                    className="w-full px-3 py-1.5 bg-paper border-2 border-ink text-xs text-ink focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t-2 border-ink">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1.5 font-black uppercase text-xs text-slate-600 hover:text-ink cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neon hover:bg-white text-ink border-2 border-ink font-black uppercase text-xs shadow-[2px_2px_0px_#000] cursor-pointer"
                >
                  Buat Link Transaksi
                </button>
              </div>
            </form>
          )}

          {/* Transactions Ledger Table */}
          <div className="bg-white border-4 border-ink shadow-brutal overflow-hidden">
            {transactions.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs font-bold">
                Belum ada transaksi di database. Silakan klik "Buat Tagihan Manual" di sudut kanan atas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead>
                    <tr className="bg-paper border-b-3 border-ink font-black text-ink uppercase">
                      <th className="p-3 pl-4">Order ID & Proyek</th>
                      <th className="p-3">Waktu</th>
                      <th className="p-3">Link QR</th>
                      <th className="p-3">Metode</th>
                      <th className="p-3">Total Potongan</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 pr-4 text-center">Aksi HP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const isActive = activeTx?.id === tx.id;
                      const txUrl = tx.url || `${window.location.origin}/pay/${tx.projectSlug}/${tx.amount}?order_id=${tx.orderId}&tx_id=${tx.id}`;
                      
                      let statusBadge = "bg-white text-ink border-2 border-ink";
                      if (tx.status === "COMPLETED") statusBadge = "bg-neon text-ink border-2 border-ink font-black";
                      if (tx.status === "CANCELLED") statusBadge = "bg-paper text-slate-500 border-2 border-slate-300 font-bold";
                      if (tx.status === "EXPIRED") statusBadge = "bg-red-550 text-white border-2 border-ink font-black";

                      return (
                        <tr 
                          key={tx.id} 
                          className={`border-b-2 border-ink last:border-0 hover:bg-neon/10 cursor-pointer transition-colors ${
                            isActive ? 'bg-neon/10 font-black' : ''
                          }`}
                          onClick={() => {
                            setActiveTx(tx);
                          }}
                        >
                          <td className="p-3 pl-4">
                            <div className="font-mono text-ink font-black">{tx.orderId}</div>
                            <div className="text-[10px] text-slate-600 font-bold mt-0.5">{tx.projectName}</div>
                          </td>
                          <td className="p-3 text-slate-600 font-bold">
                            {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}, {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <div className="group relative flex items-center justify-start gap-1 cursor-pointer">
                              <QRCodeSVG
                                value={txUrl}
                                size={28}
                                className="border-2 border-ink p-0.5 bg-white shadow-[1px_1px_0px_#000] hover:scale-110 transition-transform shrink-0"
                                title="Klik untuk menyalin link bayar"
                                onClick={() => {
                                  navigator.clipboard.writeText(txUrl);
                                  setCopiedTxId(tx.id);
                                  setTimeout(() => setCopiedTxId(null), 2000);
                                }}
                              />
                              {copiedTxId === tx.id ? (
                                <span className="text-[9px] bg-neon text-ink px-1 border border-ink ml-1 font-black uppercase animate-pulse shrink-0">
                                  COPIED!
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1 font-black leading-none shrink-0">
                                  Salin Link
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-mono font-black uppercase text-ink">
                            {tx.method.toUpperCase().replace("_", " ")}
                          </td>
                          <td className="p-3 text-ink">
                            <div className="font-mono font-black">Rp {tx.amount.toLocaleString('id-ID')}</div>
                            <div className="text-[9px] text-red-650 font-black mt-0.5">Potong: Rp {tx.fee.toLocaleString('id-ID')}</div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-block px-2.5 py-0.5 text-[9px] uppercase tracking-wider ${statusBadge}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="p-3 pr-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-center gap-1">
                              <button
                                onClick={() => {
                                  setActiveTx(tx);
                                }}
                                title="Buka di HP Virtual"
                                className="px-2.5 py-1 bg-white hover:bg-neon text-ink border-2 border-ink font-black text-[10px] uppercase shadow-[2px_2px_0px_#000] active:translate-y-0.5 cursor-pointer flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Inspect
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Webhook Execution Auditor Section */}
          <div className="bg-white border-4 border-ink shadow-brutal overflow-hidden">
            {/* Header */}
            <div className="bg-paper p-4 px-5 flex items-center justify-between border-b-3 border-ink">
              <div className="flex items-center gap-2 text-ink">
                <Terminal className="w-5 h-5 text-ink" />
                <span className="font-black uppercase text-sm tracking-tight text-ink">Live Webhook Dispatcher Auditor</span>
              </div>
              <span className="text-[10px] bg-black text-neon font-mono font-black uppercase px-2 py-0.5 border-2 border-[#fff] shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                SERVER FEED
              </span>
            </div>

            {/* Logs Body */}
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-700 font-bold leading-normal">
                Setiap transaksi yang diselesaikan akan memicu pengiriman webhook POST payload secara otomatis ke web server Anda. Berikut adalah log hasil eksekusi webhook live:
              </p>

              {webhookLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-mono font-bold leading-relaxed border-2 border-dashed border-slate-300">
                  &gt;_ Belum ada log aktivitas webhook terekam. Bayar transaksi pending untuk saksikan pengiriman payload.
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {webhookLogs.map((log) => {
                    const isSelected = selectedLog?.id === log.id;
                    const cleanStatus = log.status || "FAIL / CANNOT REACH";
                    return (
                      <div 
                        key={log.id} 
                        className={`p-3 bg-paper border-2 border-ink cursor-pointer transition-all ${
                          isSelected ? 'bg-neon/10 border-black' : ''
                        }`}
                        onClick={() => setSelectedLog(isSelected ? null : log)}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 mb-2 pb-2 border-b border-ink/10">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-ink">Order: {log.orderId}</span>
                            <span className="text-[9px] font-mono font-black text-slate-500">[{log.projectSlug}]</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[8px] font-mono font-black border border-ink ${
                              log.success ? 'bg-neon text-ink' : 'bg-red-200 text-red-800'
                            }`}>
                              HTTP {cleanStatus}
                            </span>
                            <span className="text-[9px] text-slate-600 font-mono font-bold">
                              {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                            </span>
                          </div>
                        </div>

                        <div className="text-[10px] font-mono text-slate-800 truncate mb-1">
                          POST {log.url}
                        </div>

                        {isSelected && (
                          <div className="mt-3 text-[10px] border-t-2 border-ink pt-3 space-y-3 font-mono text-left">
                            <div>
                              <span className="text-ink block mb-1 font-black uppercase">// Request Signature (X-Gosir-Signature):</span>
                              <pre className="text-[9px] bg-[#1C1C1C] text-slate-300 p-2 border-2 border-ink overflow-x-auto break-all select-all whitespace-pre-wrap">
                                {`X-Gosir-Signature: sha256_hmac_hex(apiKey, payload)`}
                              </pre>
                            </div>
                            
                            <div>
                              <span className="text-ink block mb-1 font-black uppercase">// JSON POST Body Payload:</span>
                              <pre className="text-[9px] bg-[#1C1C1C] text-neon p-2.5 border-2 border-ink whitespace-pre-wrap overflow-x-auto">
                                {log.payload}
                              </pre>
                            </div>

                            <div>
                              <span className="text-ink block mb-1 font-black uppercase">// Response Dari Server Anda (Target Webhook):</span>
                              <pre className="text-[9px] bg-[#1C1C1C] text-slate-300 p-2.5 border-2 border-ink whitespace-pre-wrap overflow-x-auto">
                                {log.response}
                              </pre>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-black uppercase mt-1">
                          <span>{isSelected ? "KLik untuk sembunyikan detail" : "Klik untuk melihat payload & respon URL"}</span>
                          <span className="text-emerald-800 underline">Detail info</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Virtual Mobile Device (Customer Payment Checkout simulation) - Span 5 */}
        <div id="checkout_mockup" className="lg:col-span-5 relative">
          
          <div className="sticky top-24 space-y-4">
            
            <div className="flex items-center justify-between text-slate-500 text-xs px-2 select-none font-bold uppercase">
              <span className="flex items-center gap-1.5">
                <SmartphoneIcon className="w-4 h-4 text-ink shrink-0" />
                Customer Mobile Page View
              </span>
              <span className="text-[10px] bg-neon text-ink border-2 border-ink px-2 py-0.5 font-black uppercase">Sim Simulator</span>
            </div>

            {/* Smart Frame Wrapper */}
            <div className="bg-white p-4 rounded-[40px] border-4 border-ink shadow-brutal-lg relative">
              {/* Speaker Notch */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-28 h-5 bg-paper border-2 border-ink rounded-full z-20 flex items-center justify-center">
                <div className="w-10 h-1 bg-ink rounded-full"></div>
              </div>

              {/* Mobile screen container */}
              <div className="bg-paper text-ink rounded-[30px] overflow-hidden min-h-[580px] border-3 border-ink flex flex-col justify-between pt-7 relative font-sans text-xs">
                
                {activeTx ? (
                  <>
                    {/* Invoice Navigation Line */}
                    <div className="bg-white border-b-2 border-ink p-4 py-3 text-ink flex items-center justify-between shadow-xs select-none">
                      <div className="flex items-center gap-2">
                        <span className="w-4.5 h-4.5 bg-neon border border-ink text-ink flex items-center justify-center font-black text-[9px]">G</span>
                        <span className="font-black text-xs tracking-tight">GOSIR PAY</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-500 font-mono">{activeTx.orderId}</span>
                    </div>

                    {/* Scrollable Body area */}
                    <div className="p-4 flex-1 overflow-y-auto space-y-4 text-left">
                      
                      {/* Merchant Header Billing details */}
                      <div className="bg-white p-4 border-2 border-ink hover:shadow-none transition-all">
                        <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase">Tagihan Merchant</span>
                        <h4 className="text-base font-black text-ink mt-0.5 truncate">{activeTx.projectName}</h4>
                        
                        <div className="flex justify-between items-baseline mt-3 pb-3 border-b-2 border-ink">
                          <span className="text-xs font-bold text-slate-600">Total Tagihan</span>
                          <span className="text-lg font-mono font-black text-ink">
                            Rp {activeTx.amount.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-2 text-[10px] text-slate-550 pt-3 font-semibold">
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase">Customer</span>
                            <p className="font-extrabold text-ink truncate">{activeTx.customerName || "Anonim"}</p>
                          </div>
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase">Email</span>
                            <p className="font-extrabold text-ink truncate">{activeTx.customerEmail || "-"}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase font-sans">Deskripsi</span>
                            <p className="text-slate-700 italic truncate leading-tight mt-0.5">{activeTx.notes || "-"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Main payment screen switch based on status */}
                      {activeTx.status === "PENDING" ? (
                        <div className="space-y-4">
                          {/* Timer block */}
                          <div className="bg-[#FFFCEB] border-2 border-ink text-ink p-3 text-[11px] flex items-center justify-between">
                            <span className="font-black uppercase flex items-center gap-1.5 text-[9px]">
                              <Clock className="w-4 h-4 text-ink shrink-0" />
                              Sisa Waktu Bayar
                            </span>
                            <span className="font-mono font-black text-ink">23:59:50</span>
                          </div>

                          {/* Payment method visual block */}
                          {activeTx.method === "qris" ? (
                            /* QRIS View */
                            <div className="bg-white border-2 border-ink text-center p-4 py-6 space-y-4 relative">
                              <div className="mx-auto w-36 h-36 border-2 border-dashed border-ink p-2.5 bg-paper relative flex items-center justify-center">
                                {/* SCANNING ANIMATION LINE */}
                                <div className="absolute top-2.5 left-2.5 right-2.5 h-[2px] bg-neon opacity-80 animate-bounce"></div>
                                
                                {/* Mock QR Code image */}
                                <div className="w-full h-full relative" style={{ background: "repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50% / 15px 15px text" }}>
                                  <div className="absolute inset-0 bg-white/10"></div>
                                  {/* Center logo text QRIS */}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-24 h-24 bg-white border-2 border-ink flex flex-col items-center justify-center p-1 font-sans shadow-none rounded-none">
                                      <span className="text-[10px] font-black tracking-widest text-slate-950">QRIS</span>
                                      <span className="text-[6px] text-slate-500 scale-90 mt-0.5 leading-none">PAS SAK SAK</span>
                                      <div className="w-6 h-6 bg-slate-900 mt-1 flex items-center justify-center text-[7px] text-white font-bold rounded-xs">
                                        P
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Metode Pembayaran</span>
                                <div className="font-black text-ink text-sm mt-0.5 tracking-tight flex justify-center items-center gap-1 select-none">
                                  <span>GPN</span> • <span>Dukungan QRIS Real-time</span>
                                </div>
                                <p className="text-[10px] text-slate-650 max-w-xs mx-auto mt-2 leading-relaxed font-bold">
                                  Pindai menggunakan GoPay, OVO, ShopeePay, LinkAja, DANA (<span className="text-emerald-700 font-black">085378963269</span>), serta seluruh m-Banking Bank Nasional Indonesia.
                                </p>
                              </div>

                              {/* Manual DANA Company Account banner */}
                              <div className="bg-sky-50 border-2 border-ink p-3 text-[10px] text-slate-800 text-left font-bold relative shadow-[1px_1px_0px_#000]">
                                <span className="font-black text-sky-900 block mb-1">🌀 AUTO TRANSFER DANA GOSIR:</span>
                                <p className="leading-tight">
                                  Kirim Dana langsung ke akun DANA Resmi: <span className="font-mono font-black text-ink">085378963269</span>
                                </p>
                              </div>

                              <button
                                onClick={() => handlePaySimulate(activeTx.id)}
                                className="w-full py-3 bg-neon hover:bg-white text-ink border-2 border-ink font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle2 className="w-4 h-4 text-ink inline" />
                                Simulasikan Scan & Bayar Sukses
                              </button>
                            </div>
                          ) : (
                            /* Virtual Account View */
                            <div className="bg-white border-2 border-ink p-4 space-y-4">
                              <div className="flex items-center gap-2 pb-3 border-b-2 border-ink select-none">
                                <CreditCard className="w-4 h-4 text-ink shrink-0" />
                                <span className="font-black text-ink uppercase text-[11px]">Metode Virtual Account</span>
                              </div>

                              <div className="space-y-3 text-xs font-bold">
                                <div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase">Provider Bank</span>
                                  <div className="font-black text-ink mt-0.5">
                                    {(activeTx.method || "va").toUpperCase().replace("VA_", "").replace("_", " ")}
                                  </div>
                                </div>

                                <div className="bg-paper p-3 border-2 border-ink flex items-center justify-between">
                                  <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">
                                      {activeTx.method === "va_mandiri" || activeTx.method === "va_bri" 
                                        ? "Nomor Rekening Perusahaan (Live)" 
                                        : "Nomor Virtual Account"}
                                    </span>
                                    <span className="font-mono text-base font-black text-ink tracking-wider">
                                      {activeTx.paymentCode}
                                    </span>
                                    {(activeTx.method === "va_mandiri" || activeTx.method === "va_bri") && (
                                      <span className="block text-[8px] font-black text-emerald-700 uppercase mt-0.5">
                                        ✓ terverifikasi otomatis
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => copyPaymentCode(activeTx.paymentCode)}
                                    className="px-2.5 py-1 bg-white hover:bg-neon text-ink border-2 border-ink font-black text-[10px] uppercase shadow-[1px_1px_0px_#000] cursor-pointer"
                                  >
                                    {copiedCodeText ? "SALIN OK" : "COPY"}
                                  </button>
                                </div>
                              </div>

                              {/* VA instructions */}
                              <div className="bg-[#FFFCEB] border-2 border-ink p-3 text-[10px] text-slate-800 leading-normal font-bold">
                                <span className="font-black text-ink block mb-1">💡 Cara Pembayaran:</span>
                                {activeTx.method === "va_mandiri" ? (
                                  <ol className="list-decimal list-inside space-y-0.5 pl-0.5 text-left">
                                    <li>Buka Livin' by Mandiri atau ATM Mandiri Anda.</li>
                                    <li>Pilih menu <b>Transfer ke Rekening Mandiri</b>.</li>
                                    <li>Masukkan Rekening Perusahaan: <b className="font-mono">1080028325505</b>.</li>
                                    <li>Ketik nominal persis, kirim transfer. Sistem memverifikasi otomatis.</li>
                                  </ol>
                                ) : activeTx.method === "va_bri" ? (
                                  <ol className="list-decimal list-inside space-y-0.5 pl-0.5 text-left">
                                    <li>Buka BRImo atau ATM BRI Anda.</li>
                                    <li>Pilih menu <b>Transfer ke Rekening BRI / BRIVA</b>.</li>
                                    <li>Masukkan Rekening Perusahaan: <b className="font-mono">109901070159500</b>.</li>
                                    <li>Ketik nominal persis, jalankan transfer. Verifikasi otomatis aman.</li>
                                  </ol>
                                ) : (
                                  <ol className="list-decimal list-inside space-y-0.5 pl-0.5">
                                    <li>Buka m-Banking atau ATM bank Anda.</li>
                                    <li>Pilih menu <b>Transfer / Virtual Account</b>.</li>
                                    <li>Input nomor VA diatas, masukkan nominal.</li>
                                    <li>Konfirmasi detail penerima, transaksi selesai.</li>
                                  </ol>
                                )}
                              </div>

                              <button
                                onClick={() => handlePaySimulate(activeTx.id)}
                                className="w-full py-3 bg-neon hover:bg-white text-ink border-2 border-ink font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle2 className="w-4 h-4 inline" />
                                {activeTx.method === "va_mandiri" || activeTx.method === "va_bri" 
                                  ? "Simulasikan Konfirmasi Transfer Sukses" 
                                  : "Simulasikan Pembayaran VA Sukses"}
                              </button>
                            </div>
                          )}

                          {/* Option to cancel from customer perspective */}
                          <button
                            onClick={() => handleCancelSimulate(activeTx.id)}
                            className="w-full py-2 bg-transparent hover:text-red-750 text-red-650 font-black border-2 border-dashed border-slate-350 select-none cursor-pointer uppercase text-[10px] tracking-wider transition-all"
                          >
                            Batalkan Tagihan Pembayaran
                          </button>
                        </div>
                      ) : (
                        /* Complete visual feedback based on status */
                        <div className="bg-white border-2 border-ink p-6 text-center space-y-4 shadow-brutal-sm animate-fade-in select-none">
                          <div className="mx-auto w-12 h-12 flex items-center justify-center">
                            {activeTx.status === "COMPLETED" ? (
                              <CheckCircle2 className="w-12 h-12 text-ink shrink-0" />
                            ) : (
                              <XCircle className="w-12 h-12 text-slate-400 shrink-0" />
                            )}
                          </div>

                          <div>
                            <h4 className="text-sm font-black text-ink uppercase">
                              {activeTx.status === "COMPLETED" 
                                ? "Pembayaran Sukses" 
                                : activeTx.status === "CANCELLED" 
                                  ? "Transaksi Dibatalkan" 
                                  : "Transaksi Kadaluarsa"}
                            </h4>
                            <p className="text-[10px] text-slate-600 font-bold mt-1">
                              {activeTx.status === "COMPLETED" 
                                ? "Terima kasih. Pembayaran Anda telah terverifikasi oleh sistem secara real-time." 
                                : "Transaksi ini tidak dapat lagi diproses."}
                            </p>
                          </div>

                          {activeTx.status === "COMPLETED" && (
                            <div className="bg-paper p-3 border-2 border-ink text-left font-mono text-[10px] text-ink space-y-1 font-bold">
                              <div className="flex justify-between">
                                <span>Ref KodeID:</span>
                                <span className="font-bold text-slate-900">{activeTx.id}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Metode:</span>
                                <span className="font-bold text-slate-900">{activeTx.method.toUpperCase()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Waktu:</span>
                                <span className="font-bold text-slate-900">{new Date(activeTx.updatedAt).toLocaleTimeString('id-ID')}</span>
                              </div>
                            </div>
                          )}

                          {activeTxProject?.redirectUrl && activeTx.status === "COMPLETED" && (
                            <div className="bg-neon text-ink p-2.5 border-2 border-ink text-[10px] font-black uppercase leading-relaxed text-left shadow-[2px_2px_0px_#000]">
                              Redirecting ke merchant website: <br />
                              <a href={activeTxProject.redirectUrl} target="_blank" rel="noreferrer" className="underline font-mono font-black block mt-1 break-all truncate text-[11px]">
                                {activeTxProject.redirectUrl}
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                    </div>

                    {/* Footer security badge of mobile mock */}
                    <div className="bg-paper p-3 text-center text-slate-600 text-[10px] border-t-2 border-ink leading-none font-bold flex items-center justify-center gap-1.5 rounded-b-[24px]">
                      <Shield className="w-3.5 h-3.5 text-ink shrink-0" />
                      Secured by Gosir Partner Gateway
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-slate-400 flex flex-col justify-center items-center h-full space-y-3">
                    <SmartphoneIcon className="w-10 h-10 text-slate-300" />
                    <span className="font-bold text-xs">Pilih Transaksi di Tabel</span>
                    <p className="text-[10px] text-slate-400">Silakan pilih salah satu transaksi di tabel sebelah kiri untuk mentransfernya ke tampilan simulasi handphone pelanggan Anda.</p>
                  </div>
                )}

              </div>
            </div>

            {/* Quick tips box */}
            <div className="bg-white border-3 border-ink p-4 text-xs font-sans text-slate-700 font-bold leading-normal shadow-brutal-sm">
              <span className="font-black text-ink flex items-center gap-1 mb-1.5 uppercase">
                <HelpCircle className="w-4.5 h-4.5 text-ink shrink-0" />
                Cara Menguji Simulasi Ini:
              </span>
              <ul className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-0.5">
                <li>Klik tombol <b className="text-ink">"Buat Tagihan Manual"</b> dan input nominal.</li>
                <li>Tagihan tersebut akan terpilih lalu muncul di HP Virtual sebelah kanan.</li>
                <li>Klik tombol <b className="text-ink">"Simulasikan Scan & Bayar Sukses"</b> di HP Virtual tersebut.</li>
                <li>Saksikan status transaksi di tabel update menjadi <span className="bg-neon text-ink border border-ink px-1.5 py-0.2 font-black text-[9px]">COMPLETED</span> dan Webhook logs mencatat pengiriman notifikasi instan.</li>
              </ul>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
