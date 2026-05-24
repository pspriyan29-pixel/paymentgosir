import { useState, useEffect } from "react";
import Navigation from "./components/Navigation";
import LandingPage from "./components/LandingPage";
import ProjectManager from "./components/ProjectManager";
import PaymentsSimulator from "./components/PaymentsSimulator";
import ApiDocumentation from "./components/ApiDocumentation";
import AnalyticsDashboard from "./components/AnalyticsPanel";
import BrutalistAuth from "./components/BrutalistAuth";
import { supabaseClient } from "./supabase";
import { Project, Transaction, WebhookLog, BalanceWithdrawal, PaymentMethodId } from "./types";
import { Layers, History, Code2 } from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'simulator' | 'docs'>('landing');
  const [user, setUser] = useState<any>(null);
  
  // Data State fetched from server
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [withdrawals, setWithdrawals] = useState<BalanceWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic calculations
  const [balance, setBalance] = useState(0);

  // Handle Auth listener
  useEffect(() => {
    // Get active session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      const activeUser = session?.user || null;
      setUser(activeUser);
      if (activeUser) {
        refreshData(activeUser.id);
      } else {
        refreshData("");
      }
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      const activeUser = session?.user || null;
      setUser(activeUser);
      if (activeUser) {
        refreshData(activeUser.id);
      } else {
        refreshData("");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch all initial dashboard records from full-stack server
  const refreshData = async (uid?: string) => {
    const activeUid = typeof uid === "string" ? uid : (user?.id || "");
    try {
      const headers = {
        "Content-Type": "application/json",
        "X-User-Id": activeUid
      };

      const [projRes, txRes, hookRes, wdRes] = await Promise.all([
        fetch("/api/projects", { headers }).then(r => r.json()),
        fetch("/api/transactions", { headers }).then(r => r.json()),
        fetch("/api/webhook-logs", { headers }).then(r => r.json()),
        fetch("/api/withdrawals", { headers }).then(r => r.json())
      ]);

      setProjects(projRes || []);
      setTransactions(txRes || []);
      setWebhookLogs(hookRes || []);
      setWithdrawals(wdRes || []);

      // Calculate merchant balance dynamically
      const totalNetRevenue = (txRes || [])
        .filter((t: any) => t.status === "COMPLETED")
        .reduce((sum: number, t: any) => sum + t.netAmount, 0);

      const totalWithdrawn = (wdRes || [])
        .filter((w: any) => w.status === "SUCCESS")
        .reduce((sum: number, w: any) => sum + (w.amount + w.fee), 0);

      setBalance(Math.max(0, totalNetRevenue - totalWithdrawn));
    } catch (err) {
      console.error("Gagal menyinkronkan data dengan server:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabaseClient.auth.signOut();
    setUser(null);
    setProjects([]);
    setTransactions([]);
    setWebhookLogs([]);
    setWithdrawals([]);
    setBalance(0);
    setLoading(false);
    setCurrentView('landing');
  };

  // 1. Projects handlers
  const handleAddProject = async (p: { name: string; webhookUrl: string; redirectUrl: string; qrisOnly: boolean }) => {
    try {
      const resp = await fetch("/api/projects", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-Id": user?.id || ""
        },
        body: JSON.stringify(p)
      });
      if (resp.ok) {
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditProject = async (id: string, updates: Partial<Project>) => {
    try {
      const resp = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "X-User-Id": user?.id || ""
        },
        body: JSON.stringify(updates)
      });
      if (resp.ok) {
        // Optimistic local update
        setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const resp = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        headers: {
          "X-User-Id": user?.id || ""
        }
      });
      if (resp.ok) {
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Withdrawal handler
  const handleWithdrawFunds = async (amount: number, bankName: string, accountNumber: string, accountName: string) => {
    try {
      const resp = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-Id": user?.id || ""
        },
        body: JSON.stringify({ amount, bankName, accountNumber, accountName })
      });
      if (resp.ok) {
        await refreshData();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // 3. Transactions handler
  const handleCreateManualTransaction = async (data: {
    projectId: string;
    amount: number;
    orderId: string;
    method: PaymentMethodId;
    customerName: string;
    customerEmail: string;
    notes: string;
  }) => {
    const project = projects.find(p => p.id === data.projectId);
    if (!project) throw new Error("Proyek tidak ditemukan.");

    try {
      const resp = await fetch("/api/transactioncreate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-Id": user?.id || ""
        },
        body: JSON.stringify({
          amount: data.amount,
          order_id: data.orderId,
          method: data.method,
          customer_name: data.customerName,
          customer_email: data.customerEmail,
          notes: data.notes,
          api_key: project.apiKey
        })
      });
      
      const payload = await resp.json();
      if (!resp.ok) throw new Error(payload.error || "Gagal membuat transaksi.");
      
      await refreshData();
      return payload;
    } catch (err: any) {
      throw err;
    }
  };

  const handlePayTransaction = async (id: string) => {
    try {
      const resp = await fetch(`/api/transactions/${id}/pay`, {
        method: "POST",
        headers: {
          "X-User-Id": user?.id || ""
        }
      });
      if (resp.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelTransaction = async (id: string) => {
    try {
      const resp = await fetch(`/api/transactions/${id}/cancel`, {
        method: "POST",
        headers: {
          "X-User-Id": user?.id || ""
        }
      });
      if (resp.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handles bridging created transaction from Docs playground Console into Simulator View
  const handleOpenTestTransaction = (tx: any) => {
    setCurrentView('simulator');
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 flex flex-col font-sans antialiased selection:bg-emerald-200">
      
      {/* Navigation bar Header with balance and info */}
      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        balance={balance} 
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {loading ? (
          <div className="py-24 text-center flex flex-col justify-center items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-slate-300 border-t-emerald-600 animate-spin"></div>
            <p className="text-sm text-slate-500 font-bold font-mono">Hubungkan ke database live produksi Gosir...</p>
          </div>
        ) : (
          <>
            {/* View Switching */}
            {currentView === 'landing' && (
              <LandingPage 
                onEnterDashboard={() => setCurrentView('dashboard')} 
                onEnterDocs={() => setCurrentView('docs')} 
              />
            )}

            {currentView === 'dashboard' && (
              !user ? (
                /* Prompt user to authenticate if accessing Portal Merchant */
                <div className="bg-paper py-12 min-h-[calc(100vh-80px)]">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <BrutalistAuth onAuthSuccess={(usr) => {
                      setUser(usr);
                      refreshData(usr.id);
                    }} />
                  </div>
                </div>
              ) : (
                /* Authenticated Portal */
                <div>
                  <div className="border-b border-slate-200 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex gap-8">
                        <div className="px-1 py-4 text-emerald-600 border-b-2 border-emerald-500 font-extrabold text-sm flex items-center gap-2 select-none">
                          <Layers className="w-4.5 h-4.5" />
                          <span>Manajemen Proyek & Saldo</span>
                        </div>
                        <button 
                          onClick={() => setCurrentView('simulator')}
                          className="px-1 py-4 text-slate-500 hover:text-slate-800 font-semibold text-sm flex items-center gap-2 cursor-pointer"
                        >
                          <History className="w-4.5 h-4.5" />
                          <span>Log Simulasikan Bayar</span>
                        </button>
                        <button 
                          onClick={() => setCurrentView('docs')}
                          className="px-1 py-4 text-slate-500 hover:text-slate-800 font-semibold text-sm flex items-center gap-2 cursor-pointer"
                        >
                          <Code2 className="w-4.5 h-4.5" />
                          <span>Dokumentasi & API Playground</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <ProjectManager 
                    projects={projects}
                    withdrawals={withdrawals}
                    onAddProject={handleAddProject}
                    onEditProject={handleEditProject}
                    onDeleteProject={handleDeleteProject}
                    onWithdrawFunds={handleWithdrawFunds}
                    balance={balance}
                  />

                  <AnalyticsDashboard 
                    transactions={transactions}
                    projects={projects}
                  />
                </div>
              )
            )}

            {currentView === 'simulator' && (
              <PaymentsSimulator 
                projects={projects}
                transactions={transactions}
                webhookLogs={webhookLogs}
                onCreateManualTransaction={handleCreateManualTransaction}
                onPayTransaction={handlePayTransaction}
                onCancelTransaction={handleCancelTransaction}
                onRefreshData={() => refreshData()}
              />
            )}

            {currentView === 'docs' && (
              <ApiDocumentation 
                projects={projects}
                onOpenTestTransaction={handleOpenTestTransaction}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
