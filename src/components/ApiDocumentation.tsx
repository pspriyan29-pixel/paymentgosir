import { useState } from "react";
import { 
  Code2, 
  Terminal, 
  Play, 
  Check, 
  Copy, 
  HelpCircle,
  FileCode,
  Info,
  ArrowRight
} from "lucide-react";
import { Project, PaymentMethodId } from "../types";

interface ApiDocumentationProps {
  projects: Project[];
  onOpenTestTransaction: (tx: any) => void;
}

export default function ApiDocumentation({ projects, onOpenTestTransaction }: ApiDocumentationProps) {
  // Playground Form State
  const [activeProjId, setActiveProjId] = useState("");
  const [amount, setAmount] = useState(150000);
  const [orderId, setOrderId] = useState(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
  const [method, setMethod] = useState<PaymentMethodId>("qris");
  const [custName, setCustName] = useState("Aditya Pratama");
  const [custEmail, setCustEmail] = useState("aditya@domain.com");
  const [notes, setNotes] = useState("Pembayaran Hosting Paket Premium");

  // Console Output State
  const [isRunning, setIsRunning] = useState(false);
  const [requestObj, setRequestObj] = useState<any>(null);
  const [responseObj, setResponseObj] = useState<any>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [createdTxObj, setCreatedTxObj] = useState<any>(null);

  // Copy helpers
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Run the API simulation manually against the actual server!
  const handleTestApiSubmit = async () => {
    setIsRunning(true);
    setRequestObj(null);
    setResponseObj(null);
    setCheckoutUrl(null);
    setCreatedTxObj(null);

    const project = projects.find(p => p.id === activeProjId);
    const key = project ? project.apiKey : "pk_live_unconfigured_demo_key";

    const payload = {
      amount,
      order_id: orderId,
      method,
      customer_name: custName,
      customer_email: custEmail,
      notes,
      api_key: key
    };

    setRequestObj({
      method: "POST",
      url: `${window.location.origin}/api/transactioncreate`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: payload
    });

    try {
      // Simulate network delay
      await new Promise(r => setTimeout(r, 600));

      const response = await fetch("/api/transactioncreate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setResponseObj(data);
      
      if (data.success && data.payment_url) {
        setCheckoutUrl(data.payment_url);
        setCreatedTxObj(data.transaction);
      }
    } catch (err: any) {
      setResponseObj({ error: true, message: err.message || "Gagal menghubungi server API." });
    } finally {
      setIsRunning(false);
    }
  };

  // Select first project when database loads
  useState(() => {
    if (projects.length > 0 && !activeProjId) {
      setActiveProjId(projects[0].id);
    }
  });

  const activeProject = projects.find(p => p.id === activeProjId) || (projects.length > 0 ? projects[0] : null);
  const currentKey = activeProject ? activeProject.apiKey : "pk_live_xxxxxxxxxxxxxxxxxxxx";

  const curlExampleCode = `curl -X POST "${window.location.origin}/api/transactioncreate" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${currentKey}" \\
  -d '{
    "amount": 75000,
    "order_id": "INV-2026-9081",
    "method": "qris",
    "customer_name": "Rian Sulistyo",
    "customer_email": "rian@gmail.com",
    "notes": "Pembian Paket Produk A"
  }'`;

  const nodeSdkExampleCode = `import { GosirClient } from 'gosir-sdk';

const gosir = new GosirClient({
  apiKey: "${currentKey}"
});

// Buat tagihan pembayaran QRIS baru
const tx = await gosir.createTransaction({
  amount: 75000,
  order_id: "INV-2026-9081",
  method: "qris",
  customerName: "Rian Sulistyo",
  customerEmail: "rian@gmail.com"
});

console.log("URL Pembayaran Pelanggan:", tx.payment_url);
// Kirim pembeli ke tx.payment_url`;

  const webhookVerifyCode = `// Cara memverifikasi validitas tanda tangan Webhook Gosir (Express.js)
import crypto from 'crypto';

app.post('/api/gosir-webhook', (req, res) => {
  const incomingSignature = req.headers['x-gosir-signature'];
  const rawBody = JSON.stringify(req.body);
  const secretKey = "${currentKey}"; // API Key Anda

  // Hitung signature HMAC-SHA256
  const computedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(rawBody)
    .digest('hex');

  if (incomingSignature === computedSignature) {
    console.log("Verifikasi Webhook Valid!");
    // Proses penyelesaian order pesanan di database Anda
    res.sendStatus(200);
  } else {
    console.error("Tanda tangan Webhook TIDAK VALID. Potensi Phishing!");
    res.sendStatus(401);
  }
});`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      
      {/* Title */}
      <div>
        <h2 className="text-3xl font-black text-ink tracking-tight uppercase">Dokumentasi API & Konsol Pengembang</h2>
        <p className="text-sm text-slate-500 font-bold">Integrasikan payment link Gosir ke dalam CMS WordPress (WooCommerce) atau web kustom via restful API & SDK.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: API Docs References (Span 7) */}
        <div className="lg:col-span-7 space-y-8 font-sans">
          
          {/* Section 1: Intro */}
          <div className="bg-white border-4 border-ink p-6 shadow-brutal space-y-4">
            <h3 className="text-lg font-black uppercase text-ink border-b-2 border-ink pb-3 flex items-center gap-1.5">
              <Info className="w-5 h-5 text-ink font-bold" />
              Sistem Autentikasi REST API
            </h3>
            <p className="text-xs text-slate-705 font-bold leading-relaxed">
              Gosir menggunakan <b>API Key rahasia</b> berantai dengan prefiks <code className="bg-paper border border-ink text-red-650 px-1 py-0.5 rounded-none font-mono text-[11px] font-black">pk_live_</code> untuk mengesahkan setiap transaksi yang dikirimkan server merchant. Kunci token ini wajib diletakkan pada request header sebagai Bearer Token.
            </p>
            
            <div className="bg-[#FFFCEB] border-2 border-ink text-ink p-4 rounded-none text-xs leading-relaxed flex items-start gap-2.5">
              <HelpCircle className="w-5 h-5 text-ink shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block text-ink uppercase">// KEAMANAN API KEY</span>
                <span className="font-semibold text-slate-700 block mt-1">Jangan pernah menempatkan kata sandi API Key ini pada kodingan client-side browser Anda! Lakukan call API `/transactioncreate` secara aman melalui server-side proxy backend Anda.</span>
              </div>
            </div>
          </div>

          {/* Section 2: Interactive Sandbox Playground Code blocks */}
          <div className="bg-white border-4 border-ink p-6 shadow-brutal space-y-4">
            <div className="flex justify-between items-center border-b-2 border-ink pb-3">
              <h3 className="text-lg font-black uppercase text-ink flex items-center gap-1.5">
                <FileCode className="w-5 h-5 text-ink" />
                Contoh Request via cURL
              </h3>
              <button
                onClick={() => handleCopyCode(curlExampleCode, "curl")}
                className="px-2.5 py-1.5 bg-white hover:bg-neon text-ink border-2 border-ink text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-1 cursor-pointer"
              >
                {copiedSection === "curl" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-700 font-bold" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedSection === "curl" ? "SALIN BERHASIL" : "SALIN KODE"}</span>
              </button>
            </div>

            <pre className="text-[11px] bg-[#1C1C1C] text-slate-200 p-4 border-2 border-ink font-mono overflow-x-auto whitespace-pre leading-relaxed select-all">
              {curlExampleCode}
            </pre>
          </div>

          {/* Section 3: Node SDK */}
          <div className="bg-white border-4 border-ink p-6 shadow-brutal space-y-4">
            <div className="flex justify-between items-center border-b-2 border-ink pb-3">
              <h3 className="text-lg font-black uppercase text-ink flex items-center gap-1.5">
                <Code2 className="w-5 h-5 text-ink" />
                Integrasi Node.js & TypeScript SDK
              </h3>
              <button
                onClick={() => handleCopyCode(nodeSdkExampleCode, "sdk")}
                className="px-2.5 py-1.5 bg-white hover:bg-neon text-ink border-2 border-ink text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-1 cursor-pointer"
              >
                {copiedSection === "sdk" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-700 font-bold" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedSection === "sdk" ? "SALIN BERHASIL" : "SALIN KODING"}</span>
              </button>
            </div>

            <pre className="text-[11px] bg-[#1C1C1C] text-slate-200 p-4 border-2 border-ink font-mono overflow-x-auto whitespace-pre leading-relaxed select-all">
              {nodeSdkExampleCode}
            </pre>
          </div>

          {/* Section 4: Webhook Signature Checks */}
          <div className="bg-white border-4 border-ink p-6 shadow-brutal space-y-4">
            <div className="flex justify-between items-center border-b-2 border-ink pb-3">
              <h3 className="text-lg font-black uppercase text-ink flex items-center gap-1.5">
                <Terminal className="w-5 h-5 text-ink" />
                Verifikasi Integritas Webhook
              </h3>
              <button
                onClick={() => handleCopyCode(webhookVerifyCode, "webhook")}
                className="px-2.5 py-1.5 bg-white hover:bg-neon text-ink border-2 border-ink text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-1 cursor-pointer"
              >
                {copiedSection === "webhook" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-700 font-bold" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedSection === "webhook" ? "SALIN BERHASIL" : "SALIN KODE"}</span>
              </button>
            </div>

            <p className="text-xs text-slate-700 font-bold leading-relaxed">
              Demi mencegah serangan manipulasi atau phishing transaksi fiktif dari pihak luar, sistem Webhook Gosir membekali setiap notifikasi dengan custom header request <b><code className="bg-paper border border-ink px-1 py-0.5 font-mono text-[11px] text-ink font-black">X-Gosir-Signature</code></b>. Verifikasikan tanda tangan tersebut menggunakan algoritma HMAC-SHA256 berbekal API Key proyek Anda.
            </p>

            <pre className="text-[11px] bg-[#1C1C1C] text-slate-200 p-4 border-2 border-ink font-mono overflow-x-auto whitespace-pre leading-relaxed select-all">
              {webhookVerifyCode}
            </pre>
          </div>

        </div>

        {/* Right Side: Interactive POST Playground Console (Span 5) */}
        <div id="api_console_block" className="lg:col-span-5 space-y-6">
          
          <div className="bg-white text-ink border-4 border-ink p-6 shadow-brutal space-y-6">
            
            <div className="border-b-2 border-ink pb-4">
              <h3 className="text-xl font-black uppercase flex items-center gap-1.5">
                <Terminal className="text-ink w-5 h-5" />
                <span>Konsol Penguji REST API Live</span>
              </h3>
              <p className="text-xs font-bold text-slate-600 mt-1 leading-relaxed">
                Tembak dan panggil langsung endpoint server simulasi ini, saksikan response HTTP JSON secara instan dari input formulir di bawah.
              </p>
            </div>

            {/* Input Playground Form fields */}
            <div className="space-y-4 text-xs font-bold">
              
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                  Proyek Terpilih (API Environments)
                </label>
                <select
                  value={activeProjId}
                  onChange={(e) => setActiveProjId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-paper border-2 border-ink text-ink focus:bg-white focus:outline-none font-black text-sm"
                >
                  <option value="">-- Pilih Proyek Terdaftar --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.slug})</option>
                  ))}
                </select>
                {activeProject && (
                  <span className="text-[10px] font-mono font-bold text-slate-500 mt-1.5 block truncate">
                    Using key: {currentKey}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">Nominal (IDR)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 bg-paper border-2 border-ink font-mono font-black text-emerald-800 text-sm focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">Order ID</label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-paper border-2 border-ink font-mono font-black text-sm text-ink focus:bg-white focus:outline-none"
                  />
                </div>

              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">Metode Pembayaran (Target)</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethodId)}
                  className="w-full px-2.5 py-2 bg-paper border-2 border-ink text-ink text-sm font-black focus:bg-white focus:outline-none"
                >
                  <option value="qris">QRIS (Semua e-Wallet/GPN)</option>
                  <option value="va_bri">Virtual Account BRI (BRIVA)</option>
                  <option value="va_bni">Virtual Account BNI</option>
                  <option value="va_cimb">Virtual Account CIMB Niaga</option>
                  <option value="va_permata">Virtual Account Permata</option>
                  <option value="va_maybank">Virtual Account Maybank</option>
                  <option value="va_artha_graha">Virtual Account Artha Graha</option>
                  <option value="va_sampoerna">Virtual Account Sahabat Sampoerna</option>
                  <option value="va_bnc">Virtual Account Bank Neo Commerce</option>
                  <option value="va_atm_bersama">Modul ATM Bersama</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">Deskripsi & Catatan Belanja</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-paper border-2 border-ink text-ink text-sm focus:bg-white focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">Nama Pelanggan (Simulasi)</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-paper border-2 border-ink text-ink text-sm focus:bg-white focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">Email Pelanggan</label>
                <input
                  type="email"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-paper border-2 border-ink text-ink text-sm focus:bg-white focus:outline-none font-bold"
                />
              </div>

              <button
                type="button"
                onClick={handleTestApiSubmit}
                disabled={isRunning || projects.length === 0}
                className="w-full py-3.5 bg-neon hover:bg-white text-ink border-3 border-ink font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#000] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-200 disabled:border-slate-300 disabled:text-slate-450 disabled:shadow-none disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 fill-current shrink-0" />
                {isRunning ? "Mengeksekusi POST..." : "Eksekusi Panggilan REST POST"}
              </button>

            </div>

            {/* Simulated REST Console Outputs */}
            {requestObj && (
              <div className="space-y-4 pt-4 border-t-2 border-ink text-left">
                
                {/* Headers visualization */}
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Curl Header Request:</span>
                  <pre className="text-[10px] bg-[#1C1C1C] text-slate-200 p-2.5 border-2 border-ink font-mono mt-1 whitespace-pre-wrap overflow-x-auto">
                    {`POST /api/transactioncreate HTTP/1.1\nContent-Type: ${requestObj.headers["Content-Type"]}\nAuthorization: ${requestObj.headers["Authorization"].slice(0, 22)}...`}
                  </pre>
                </div>

                {/* HTTP JSON Response */}
                {responseObj && (
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Response Payload JSON:</span>
                    <pre className="text-[10px] bg-[#1C1C1C] text-neon p-2.5 border-2 border-ink font-mono mt-1 whitespace-pre overflow-x-auto leading-relaxed max-h-[220px] select-all">
                      {JSON.stringify(responseObj, null, 2)}
                    </pre>

                    {/* Open created transaction directly */}
                    {checkoutUrl && (
                      <div className="mt-4 p-3 bg-neon text-ink border-2 border-ink flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[2px_2px_0px_#000]">
                        <div className="text-left font-bold">
                          <span className="text-[10px] block font-black uppercase tracking-wider">// Link Bayar Terbentuk!</span>
                          <span className="text-[10px] font-mono block mt-1 truncate max-w-xs">{createdTxObj.id}</span>
                        </div>
                        <button
                          onClick={() => onOpenTestTransaction(createdTxObj)}
                          className="px-3.5 py-1.5 bg-white hover:bg-black hover:text-white text-ink border-2 border-ink font-black text-[10px] uppercase tracking-wider cursor-pointer flex items-center gap-1 self-end sm:self-center shadow-[1px_1px_0px_#005]"
                        >
                          HP Simulator
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
