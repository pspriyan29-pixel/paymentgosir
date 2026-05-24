import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { Project, Transaction, WebhookLog, PaymentMethodId, BalanceWithdrawal } from "./src/types";

dotenv.config();

// Lazily initialize Supabase with Service Role Key for secure bypass of RLS or matching sync
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let supabase: any = null;
if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    console.log("Supabase Client initialized on backend.");
  } catch (err: any) {
    console.error("Gagal inisialisasi Supabase client:", err.message);
  }
} else {
  console.warn("Peringatan: SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak disetel. Menggunakan memori in-memory.");
}

// In-Memory Database Backups (runs as automatic fallback)
let backupProjects: Project[] = [];

let backupTransactions: Transaction[] = [];

let backupWebhookLogs: WebhookLog[] = [];

let backupWithdrawals: BalanceWithdrawal[] = [];

// Read user ID from request header
const getUserId = (req: express.Request): string | null => {
  const userId = req.headers["x-user-id"] || req.headers["X-User-Id"];
  return typeof userId === "string" && userId ? userId : null;
};

// Helper: Fee Calculator
function calculateFee(amount: number, method: PaymentMethodId): number {
  if (method === "qris") {
    if (amount <= 105000) {
      return Math.round(amount * 0.007 + 310);
    } else {
      return Math.round(amount * 0.01);
    }
  } else {
    switch (method) {
      case "va_artha_graha":
      case "va_sampoerna":
        return 2000;
      default:
        // Mandiri, BRI, BNI, CIMB, Maybank, Permata, ATM Bersama, BNC, etc.
        return 3500;
    }
  }
}

// Helper: Generate payment codes using standard official company accounts
function generatePaymentCode(method: PaymentMethodId, slug: string, amount: number): string {
  if (method === "qris") {
    // Standard static QRIS mockup payload
    return `00020101021226570014ID.CO.QRIS.WWW01189360011111111111115204000053033605802ID5912${slug.substring(0,12).toUpperCase().replace(/[^A-Z]/g, '')}6006JAKART61051211162070703001`;
  }
  
  if (method === "va_mandiri") {
    return "1080028325505"; // Corporate Bank Mandiri Account
  }
  
  if (method === "va_bri") {
    return "109901070159500"; // Corporate Bank BRI Account
  }

  // Other standard mock virtual account prefixes
  let prefix = "80";
  switch (method) {
    case "va_bni": prefix = "988"; break;
    case "va_cimb": prefix = "8459"; break;
    case "va_permata": prefix = "8556"; break;
    case "va_maybank": prefix = "289"; break;
    case "va_artha_graha": prefix = "9049"; break;
    case "va_sampoerna": prefix = "8243"; break;
    case "va_bnc": prefix = "8093"; break;
    case "va_atm_bersama": prefix = "998"; break;
  }
  
  const randomSuffix = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  return `${prefix}${randomSuffix}`.substring(0, 16);
}

// Webhook firing automation
async function fireWebhook(transaction: Transaction, project: Project) {
  if (!project.webhookUrl) return;
  
  const payload = {
    event: "transaction.completed",
    timestamp: new Date().toISOString(),
    data: {
      id: transaction.id,
      order_id: transaction.orderId,
      project_name: project.name,
      project_slug: project.slug,
      amount: transaction.amount,
      fee: transaction.fee,
      net_amount: transaction.netAmount,
      status: transaction.status,
      payment_method: transaction.method,
      payment_code: transaction.paymentCode,
      customer_name: transaction.customerName,
      customer_email: transaction.customerEmail,
      notes: transaction.notes,
      paid_at: transaction.updatedAt
    }
  };

  const payloadString = JSON.stringify(payload, null, 2);
  const logId = "wh_log_" + Math.random().toString(36).substring(2, 9);
  
  try {
    console.log(`Firing webhook to ${project.webhookUrl} for order ${transaction.orderId}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(project.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gosir-Signature": crypto.createHmac("sha256", project.apiKey).update(payloadString).digest("hex"),
        "User-Agent": "Gosir-Webhook-Dispatcher/1.0"
      },
      body: payloadString,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const responseText = await response.text();
    const successful = response.status >= 200 && response.status < 300;
    
    const log: WebhookLog = {
      id: logId,
      transactionId: transaction.id,
      orderId: transaction.orderId,
      projectSlug: project.slug,
      url: project.webhookUrl,
      payload: payloadString,
      response: responseText.substring(0, 1000) || `HTTP ${response.status} ${response.statusText}`,
      status: response.status,
      success: successful,
      timestamp: new Date().toISOString()
    };
    
    // Save Log to Supabase if config is set
    if (supabase) {
      const { error: dbErr } = await supabase.from("webhook_logs").insert({
        id: log.id,
        transaction_id: log.transactionId,
        order_id: log.orderId,
        project_slug: log.projectSlug,
        url: log.url,
        payload: log.payload,
        response: log.response,
        status: log.status,
        success: log.success,
        timestamp: log.timestamp
      });
      if (dbErr) console.error("Gagal menyimpan log webhook di Supabase:", dbErr.message);
    }
    
    backupWebhookLogs.unshift(log);
    
    // Update local or DB status
    if (supabase) {
      await supabase.from("transactions").update({
        webhook_sent: true,
        webhook_status: successful ? "success" : "failed",
        webhook_response: `HTTP ${response.status}: ${responseText.substring(0, 100)}`
      }).eq("id", transaction.id);
    } else {
      const tx = backupTransactions.find(t => t.id === transaction.id);
      if (tx) {
        tx.webhookSent = true;
        tx.webhookStatus = successful ? "success" : "failed";
        tx.webhookResponse = `HTTP ${response.status}: ${responseText.substring(0, 100)}`;
      }
    }
    
  } catch (err: any) {
    console.error(`Webhook firing failed: ${err.message}`);
    
    const log: WebhookLog = {
      id: logId,
      transactionId: transaction.id,
      orderId: transaction.orderId,
      projectSlug: project.slug,
      url: project.webhookUrl,
      payload: payloadString,
      response: `NETWORK ERROR: ${err.message}. (Server offline / timeout)`,
      status: 0,
      success: false,
      timestamp: new Date().toISOString()
    };
    
    if (supabase) {
      await supabase.from("webhook_logs").insert({
        id: log.id,
        transaction_id: log.transactionId,
        order_id: log.orderId,
        project_slug: log.projectSlug,
        url: log.url,
        payload: log.payload,
        response: log.response,
        status: log.status,
        success: log.success,
        timestamp: log.timestamp
      });
      await supabase.from("transactions").update({
        webhook_sent: true,
        webhook_status: "failed",
        webhook_response: `Error: ${err.message}`
      }).eq("id", transaction.id);
    } else {
      backupWebhookLogs.unshift(log);
      const tx = backupTransactions.find(t => t.id === transaction.id);
      if (tx) {
        tx.webhookSent = true;
        tx.webhookStatus = "failed";
        tx.webhookResponse = `Error: ${err.message}`;
      }
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Intercept headers for user sessions
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "*");
    next();
  });

  // ==================== PROJECTS ====================
  app.get("/api/projects", async (req, res) => {
    const userId = getUserId(req);
    if (supabase && userId) {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        
        if (!error && data) {
          // Map snake_case database schema to camelCase frontend schema
          const mapped = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            apiKey: p.api_key,
            webhookUrl: p.webhook_url,
            redirectUrl: p.redirect_url,
            qrisOnly: p.qris_only,
            createdAt: p.created_at
          }));
          return res.json(mapped);
        }
        console.error("Gagal mengambil proyek dari Supabase:", error?.message);
      } catch (err: any) {
        console.error("Supabase fetch projects error:", err.message);
      }
    }
    
    // Scope memory sandbox for demonstration if userId exists
    res.json(backupProjects);
  });

  app.post("/api/projects", async (req, res) => {
    const userId = getUserId(req);
    const { name, webhookUrl, redirectUrl, qrisOnly } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Nama proyek wajib diisi." });
    }

    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const finalSlug = `${slug}-${randomSuffix}`;
    const id = "pro_" + Math.random().toString(36).substring(2, 9);
    const apiKey = "pk_live_" + crypto.randomBytes(10).toString("hex");

    const newProject: Project = {
      id,
      name,
      slug: finalSlug,
      apiKey,
      webhookUrl: webhookUrl || "",
      redirectUrl: redirectUrl || "",
      qrisOnly: !!qrisOnly,
      createdAt: new Date().toISOString()
    };

    if (supabase && userId) {
      try {
        const { error } = await supabase.from("projects").insert({
          id,
          user_id: userId,
          name,
          slug: finalSlug,
          api_key: apiKey,
          webhook_url: webhookUrl || "",
          redirect_url: redirectUrl || "",
          qris_only: !!qrisOnly,
          created_at: newProject.createdAt
        });
        if (!error) {
          return res.status(201).json(newProject);
        }
        console.error("Gagal simpan proyek ke Supabase:", error.message);
      } catch (err: any) {
        console.error("Supabase insert projects error:", err.message);
      }
    }

    backupProjects.push(newProject);
    res.status(201).json(newProject);
  });

  app.put("/api/projects/:id", async (req, res) => {
    const { id } = req.params;
    const { webhookUrl, redirectUrl, qrisOnly, name } = req.body;
    
    if (supabase) {
      try {
        const { error } = await supabase.from("projects").update({
          webhook_url: webhookUrl,
          redirect_url: redirectUrl,
          qris_only: qrisOnly,
          name: name
        }).eq("id", id);
        
        if (!error) {
          // Load updated project details to return
          const { data } = await supabase.from("projects").select("*").eq("id", id).single();
          if (data) {
            return res.json({
              id: data.id,
              name: data.name,
              slug: data.slug,
              apiKey: data.api_key,
              webhookUrl: data.webhook_url,
              redirectUrl: data.redirect_url,
              qrisOnly: data.qris_only,
              createdAt: data.created_at
            });
          }
        }
        console.error("Gagal update proyek ke Supabase:", error?.message);
      } catch (err: any) {
        console.error("Supabase update error:", err.message);
      }
    }

    const index = backupProjects.findIndex(p => p.id === id);
    if (index !== -1) {
      backupProjects[index] = {
        ...backupProjects[index],
        webhookUrl: webhookUrl !== undefined ? webhookUrl : backupProjects[index].webhookUrl,
        redirectUrl: redirectUrl !== undefined ? redirectUrl : backupProjects[index].redirectUrl,
        qrisOnly: qrisOnly !== undefined ? qrisOnly : backupProjects[index].qrisOnly,
        name: name !== undefined ? name : backupProjects[index].name,
      };
      return res.json(backupProjects[index]);
    }

    res.status(404).json({ error: "Proyek tidak ditemukan." });
  });

  app.delete("/api/projects/:id", async (req, res) => {
    const { id } = req.params;
    if (supabase) {
      try {
        const { error } = await supabase.from("projects").delete().eq("id", id);
        if (!error) {
          return res.json({ success: true, message: "Proyek berhasil dihapus." });
        }
        console.error("Gagal hapus proyek dari Supabase:", error.message);
      } catch (err: any) {
        console.error("Supabase delete error:", err.message);
      }
    }

    backupProjects = backupProjects.filter(p => p.id !== id);
    res.json({ success: true, message: "Proyek berhasil dihapus." });
  });

  // ==================== TRANSACTIONS ====================
  app.get("/api/transactions", async (req, res) => {
    const userId = getUserId(req);
    if (supabase && userId) {
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        
        if (!error && data) {
          // Map DB keys to camelCase
          const mapped = data.map((t: any) => ({
            id: t.id,
            orderId: t.order_id,
            projectId: t.project_id,
            projectName: t.project_name,
            projectSlug: t.project_slug,
            amount: Number(t.amount),
            status: t.status,
            method: t.method as PaymentMethodId,
            paymentCode: t.payment_code,
            customerName: t.customer_name,
            customerEmail: t.customer_email,
            notes: t.notes,
            fee: Number(t.fee),
            netAmount: Number(t.net_amount),
            createdAt: t.created_at,
            updatedAt: t.updated_at,
            webhookSent: t.webhook_sent,
            webhookStatus: t.webhook_status,
            webhookResponse: t.webhook_response,
            url: `${req.protocol}://${req.get("host")}/pay/${t.project_slug}/${t.amount}?order_id=${t.order_id}&tx_id=${t.id}`
          }));
          return res.json(mapped);
        }
        console.error("Gagal mengambil transaksi dari Supabase:", error?.message);
      } catch (err: any) {
        console.error("Supabase fetch transactions error:", err.message);
      }
    }
    
    res.json(backupTransactions);
  });

  app.get("/api/transactions/:id", async (req, res) => {
    const { id } = req.params;
    if (supabase) {
      try {
        const { data, error } = await supabase.from("transactions").select("*").eq("id", id).single();
        if (!error && data) {
          return res.json({
            id: data.id,
            orderId: data.order_id,
            projectId: data.project_id,
            projectName: data.project_name,
            projectSlug: data.project_slug,
            amount: Number(data.amount),
            status: data.status,
            method: data.method as PaymentMethodId,
            paymentCode: data.payment_code,
            customerName: data.customer_name,
            customerEmail: data.customer_email,
            notes: data.notes,
            fee: Number(data.fee),
            netAmount: Number(data.net_amount),
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            webhookSent: data.webhook_sent,
            webhookStatus: data.webhook_status,
            webhookResponse: data.webhook_response,
            url: `${req.protocol}://${req.get("host")}/pay/${data.project_slug}/${data.amount}?order_id=${data.order_id}&tx_id=${data.id}`
          });
        }
      } catch (err: any) {
        console.error("Fetch single transaction failed:", err.message);
      }
    }

    const tx = backupTransactions.find(t => t.id === id);
    if (!tx) return res.status(404).json({ error: "Transaksi tidak ditemukan." });
    res.json(tx);
  });

  // API payment link transaction creation
  app.post("/api/transactioncreate", async (req, res) => {
    const authHeader = req.headers.authorization;
    let apiKey = req.body.api_key;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      apiKey = authHeader.substring(7);
    }

    if (!apiKey) {
      return res.status(401).json({ error: "API Key diperlukan." });
    }

    let project: any = null;
    let userId: string | null = null;

    if (supabase) {
      try {
        const { data, error } = await supabase.from("projects").select("*").eq("api_key", apiKey).single();
        if (!error && data) {
          project = {
            id: data.id,
            name: data.name,
            slug: data.slug,
            apiKey: data.api_key,
            webhookUrl: data.webhook_url,
            redirectUrl: data.redirect_url,
            qrisOnly: data.qris_only,
            createdAt: data.created_at
          };
          userId = data.user_id;
        }
      } catch (err: any) {
        console.error("Supabase auth API key project lookup failed:", err.message);
      }
    }

    if (!project) {
      project = backupProjects.find(p => p.apiKey === apiKey);
    }

    if (!project) {
      return res.status(401).json({ error: "API Key tidak valid." });
    }

    const { amount, order_id, method, customer_name, customer_email, notes } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Amount valid diperlukan." });
    }
    if (!order_id) {
      return res.status(400).json({ error: "order_id diperlukan." });
    }

    const selectedMethod: PaymentMethodId = method || "qris";

    if (project.qrisOnly && selectedMethod !== "qris") {
      return res.status(400).json({ error: "Proyek ini dikonfigurasi untuk hanya menerima QRIS." });
    }

    const fee = calculateFee(amount, selectedMethod);
    const id = "tx_" + Math.random().toString(36).substring(2, 9);
    const paymentCode = generatePaymentCode(selectedMethod, project.slug, amount);

    const newTx: Transaction = {
      id,
      orderId: order_id,
      projectId: project.id,
      projectName: project.name,
      projectSlug: project.slug,
      amount: Number(amount),
      status: "PENDING",
      method: selectedMethod,
      paymentCode,
      customerName: customer_name,
      customerEmail: customer_email,
      notes,
      fee,
      netAmount: amount - fee,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      webhookSent: false,
      webhookStatus: "idle",
      url: `${req.protocol}://${req.get("host")}/pay/${project.slug}/${amount}?order_id=${order_id}&tx_id=${id}`
    };

    if (supabase) {
      try {
        await supabase.from("transactions").insert({
          id,
          user_id: userId,
          project_id: project.id,
          project_name: project.name,
          project_slug: project.slug,
          order_id: order_id,
          amount: Number(amount),
          fee,
          net_amount: amount - fee,
          status: "PENDING",
          method: selectedMethod,
          payment_code: paymentCode,
          customer_name: customer_name,
          customer_email: customer_email,
          notes,
          webhook_sent: false,
          webhook_status: "idle",
          created_at: newTx.createdAt,
          updated_at: newTx.updatedAt
        });
      } catch (err: any) {
        console.error("Gagal simpan transaksi ke Supabase:", err.message);
      }
    }

    backupTransactions.unshift(newTx);
    res.status(201).json({ 
      success: true, 
      transaction: newTx,
      payment_url: `${req.protocol}://${req.get("host")}/pay/${project.slug}/${amount}?order_id=${order_id}&tx_id=${id}`
    });
  });

  // Simulated paying transactions
  app.post("/api/transactions/:id/pay", async (req, res) => {
    const { id } = req.params;
    let tx: Transaction | null = null;
    let project: Project | null = null;

    if (supabase) {
      try {
        const { data: txData } = await supabase.from("transactions").select("*").eq("id", id).single();
        if (txData) {
          tx = {
            id: txData.id,
            orderId: txData.order_id,
            projectId: txData.project_id,
            projectName: txData.project_name,
            projectSlug: txData.project_slug,
            amount: Number(txData.amount),
            status: txData.status,
            method: txData.method as PaymentMethodId,
            paymentCode: txData.payment_code,
            customerName: txData.customer_name,
            customerEmail: txData.customer_email,
            notes: txData.notes,
            fee: Number(txData.fee),
            netAmount: Number(txData.net_amount),
            createdAt: txData.created_at,
            updatedAt: txData.updated_at,
            webhookSent: txData.webhook_sent,
            webhookStatus: txData.webhook_status,
            webhookResponse: txData.webhook_response
          };

          const { data: projData } = await supabase.from("projects").select("*").eq("id", tx.projectId).single();
          if (projData) {
            project = {
              id: projData.id,
              name: projData.name,
              slug: projData.slug,
              apiKey: projData.api_key,
              webhookUrl: projData.webhook_url,
              redirectUrl: projData.redirect_url,
              qrisOnly: projData.qris_only,
              createdAt: projData.created_at
            };
          }
        }
      } catch (err: any) {
        console.error("Supabase lookup for pay failed:", err.message);
      }
    }

    if (!tx) {
      tx = backupTransactions.find(t => t.id === id) || null;
      if (tx) {
        project = backupProjects.find(p => p.id === tx!.projectId) || null;
      }
    }

    if (!tx) return res.status(404).json({ error: "Transaksi tidak ditemukan." });

    if (tx.status !== "PENDING") {
      return res.status(400).json({ error: `Transaksi tidak bisa dibayar karena berstatus ${tx.status}` });
    }

    tx.status = "COMPLETED";
    tx.updatedAt = new Date().toISOString();

    if (supabase) {
      await supabase.from("transactions").update({
        status: "COMPLETED",
        updated_at: tx.updatedAt
      }).eq("id", id);
    } else {
      const liveTx = backupTransactions.find(t => t.id === id);
      if (liveTx) {
        liveTx.status = "COMPLETED";
        liveTx.updatedAt = tx.updatedAt;
      }
    }

    if (project) {
      fireWebhook(tx, project);
    }

    res.json({ success: true, transaction: tx });
  });

  app.post("/api/transactions/:id/cancel", async (req, res) => {
    const { id } = req.params;
    let tx: any = null;

    if (supabase) {
      try {
        const { data } = await supabase.from("transactions").update({
          status: "CANCELLED",
          updated_at: new Date().toISOString()
        }).eq("id", id).select().single();
        if (data) {
          tx = data;
        }
      } catch (err: any) {
        console.error("Gagal membatalkan transaksi di Supabase:", err.message);
      }
    }

    const liveTx = backupTransactions.find(t => t.id === id);
    if (liveTx) {
      liveTx.status = "CANCELLED";
      liveTx.updatedAt = new Date().toISOString();
      if (!tx) tx = liveTx;
    }

    if (!tx) return res.status(404).json({ error: "Transaksi tidak ditemukan." });
    res.json({ success: true, transaction: tx });
  });

  // ==================== WEBHOOK LOGS ====================
  app.get("/api/webhook-logs", async (req, res) => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("webhook_logs")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(100);
        
        if (!error && data) {
          const mapped = data.map((l: any) => ({
            id: l.id,
            transactionId: l.transaction_id,
            orderId: l.order_id,
            projectSlug: l.project_slug,
            url: l.url,
            payload: l.payload,
            response: l.response,
            status: l.status,
            success: l.success,
            timestamp: l.timestamp
          }));
          return res.json(mapped);
        }
      } catch (e: any) {
        console.error("Supabase webhook_logs fetch failed:", e.message);
      }
    }
    res.json(backupWebhookLogs);
  });

  // ==================== WITHDRAWALS ====================
  app.get("/api/withdrawals", async (req, res) => {
    const userId = getUserId(req);
    if (supabase && userId) {
      try {
        const { data, error } = await supabase
          .from("withdrawals")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        
        if (!error && data) {
          const mapped = data.map((w: any) => ({
            id: w.id,
            amount: Number(w.amount),
            fee: Number(w.fee),
            bankName: w.bank_name,
            accountNumber: w.account_number,
            accountName: w.account_name,
            status: w.status,
            createdAt: w.created_at
          }));
          return res.json(mapped);
        }
      } catch (err: any) {
        console.error("Gagal loading withdrawals dari Supabase:", err.message);
      }
    }
    res.json(backupWithdrawals);
  });

  app.post("/api/withdrawals", async (req, res) => {
    const userId = getUserId(req);
    const { amount, bankName, accountNumber, accountName } = req.body;
    if (!amount || amount < 10000) {
      return res.status(400).json({ error: "Minimal penarikan adalah Rp 10.000." });
    }
    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({ error: "Data bank lengkap wajib diisi." });
    }

    const fee = 4500;
    const id = "wd_" + Math.random().toString(36).substring(2, 9);
    const newWd: BalanceWithdrawal = {
      id,
      amount: Number(amount),
      bankName,
      accountNumber,
      accountName,
      status: "SUCCESS",
      fee,
      createdAt: new Date().toISOString()
    };

    if (supabase && userId) {
      try {
        const { error } = await supabase.from("withdrawals").insert({
          id,
          user_id: userId,
          amount: Number(amount),
          fee,
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
          status: "SUCCESS",
          created_at: newWd.createdAt
        });
        if (!error) {
          return res.status(201).json(newWd);
        }
        console.error("Gagal simpan withdrawals ke Supabase:", error.message);
      } catch (err: any) {
        console.error("Supabase insert withdrawals error:", err.message);
      }
    }

    backupWithdrawals.unshift(newWd);
    res.status(201).json(newWd);
  });

  // Vite development middleware OR Production static server routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gosir backend server successfully running on port ${PORT}`);
  });
}

startServer();
