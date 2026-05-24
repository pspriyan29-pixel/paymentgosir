import { useState } from "react";
import { 
  Building2, 
  Code2, 
  Terminal, 
  Layers, 
  Coins, 
  HelpCircle,
  Menu,
  X,
  CreditCard,
  History,
  LogOut,
  User
} from "lucide-react";

interface NavigationProps {
  currentView: 'landing' | 'dashboard' | 'simulator' | 'docs';
  onViewChange: (view: 'landing' | 'dashboard' | 'simulator' | 'docs') => void;
  balance: number;
  user: any;
  onLogout: () => void;
}

export default function Navigation({ currentView, onViewChange, balance, user, onLogout }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'landing' as const, label: 'Beranda', icon: Building2 },
    { id: 'dashboard' as const, label: 'Portal Merchant', icon: Layers },
    { id: 'simulator' as const, label: 'Simulasi Bayar & Webhook', icon: History },
    { id: 'docs' as const, label: 'Produksi & Dokumentasi API', icon: Code2 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b-4 border-ink text-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div 
            onClick={() => onViewChange('landing')}
            className="flex items-center gap-2 font-black italic tracking-tighter text-2xl cursor-pointer select-none shrink-0"
          >
            <span className="w-5 h-5 bg-neon brutal-border-thin inline-block rotate-6"></span>
            <span>GOSIR</span>
            <span className="text-[10px] bg-emerald-600 text-white border-2 border-ink px-2 py-0.5 font-black uppercase tracking-wider ml-1 rotate-[-3deg]">
              LIVE
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 border-2 text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-neon text-ink border-ink shadow-[2px_2px_0px_#000]'
                      : 'text-ink bg-white border-transparent hover:border-ink hover:shadow-[2px_2px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-ink" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Area: Simulator Balance Indicator & User Info */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 border-2 border-ink bg-[#FFFCEB] p-2 px-3 shadow-[2px_2px_0px_#000] max-w-[200px]">
                <User className="w-4 h-4 text-ink shrink-0" />
                <div className="text-[10px] truncate leading-tight">
                  <span className="text-[8px] font-black text-slate-400 block uppercase">Merchant</span>
                  <span className="font-bold font-mono text-ink text-[10px] block truncate">{user.email || "Gmail User"}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col items-end border-2 border-ink bg-white p-2 px-3 shadow-[2px_2px_0px_#000]">
              <span className="text-[9px] font-black tracking-wider text-ink/75 uppercase leading-none mb-1">Saldo Tersedia</span>
              <span className="text-sm font-mono font-black text-ink">
                Rp {balance.toLocaleString('id-ID')}
              </span>
            </div>

            {user && (
              <button
                onClick={onLogout}
                title="Log Keluar"
                className="p-2.5 bg-white hover:bg-red-100 border-2 border-ink text-ink hover:text-red-650 cursor-pointer transition-all hover:shadow-[1px_1px_0px_#000] active:translate-y-0.5"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <div className="flex flex-col items-end border-2 border-ink bg-white py-1 px-2 shadow-[2px_2px_0px_#000] mr-0.5">
              <span className="text-[8px] font-black text-ink/70 tracking-wider uppercase leading-none">Saldo</span>
              <span className="text-xs font-mono font-black text-ink">
                Rp {balance.toLocaleString('id-ID')}
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border-2 border-ink bg-white hover:bg-neon hover:shadow-[2px_2px_0px_#000] focus:outline-none transition-all"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-ink" /> : <Menu className="w-5 h-5 text-ink" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-paper border-b-4 border-ink px-4 pt-2 pb-4 space-y-2">
          {user && (
            <div className="p-3 bg-[#FFFCEB] border-2 border-ink text-left flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-ink shrink-0" />
              <div className="text-[10px] truncate">
                <span className="text-[8px] font-black text-slate-400 block uppercase">AKUN MERCHANT</span>
                <span className="font-bold text-ink">{user.email || "merchant@gosir.com"}</span>
              </div>
            </div>
          )}

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 border-2 text-xs font-black uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-neon text-ink border-ink shadow-[2px_2px_0px_#000]'
                    : 'bg-white text-ink border-ink'
                }`}
              >
                <Icon className="w-4 h-4 text-ink" />
                {item.label}
              </button>
            );
          })}

          {user && (
            <button
              onClick={() => {
                onLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 border-2 text-xs font-black uppercase tracking-wider bg-red-100 text-red-800 border-ink cursor-pointer hover:bg-red-200"
            >
              <LogOut className="w-4 h-4 text-red-800" />
              <span>Log Out Akun</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
