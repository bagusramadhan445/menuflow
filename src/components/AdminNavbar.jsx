import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ChefHat, 
  QrCode, 
  BarChart3, 
  LogOut, 
  Menu, 
  X,
  ServerCrash,
  Database
} from "lucide-react";

const AdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isMock } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Pesanan", path: "/admin/orders", icon: ShoppingBag },
    { label: "Kelola Menu", path: "/admin/menu", icon: ChefHat },
    { label: "Reports / Omzet", path: "/admin/reports", icon: BarChart3 },
    { label: "Generator QR", path: "/admin/qr", icon: QrCode }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/admin/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="glass-nav sticky top-0 z-50 px-6 py-4 w-full">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-4">
          <Link to="/admin" className="flex items-center gap-2.5">
            <h1 className="font-extrabold text-xl text-white tracking-tight">
              Menu<span className="text-brand-amber">Flow</span><span className="text-xs font-semibold text-zinc-500 ml-1">Admin</span>
            </h1>
          </Link>
          {/* DB Indicator badge */}
          <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
            isMock 
              ? "bg-amber-950/20 border-amber-500/20 text-amber-400" 
              : "bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
          }`}>
            {isMock ? (
              <>
                <ServerCrash className="w-3.5 h-3.5" />
                <span>Lokal (Mock)</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                <span>Firestore (Live)</span>
              </>
            )}
          </div>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex items-center gap-1.5">
          {navItems.map((item) => {
            const IconComp = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                  isActive(item.path)
                    ? "bg-brand-amber text-brand-dark border-brand-amber shadow-lg shadow-brand-amber/10"
                    : "bg-transparent text-zinc-400 hover:text-white border-transparent hover:bg-zinc-900"
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Logout (Desktop) */}
        <div className="hidden lg:flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 bg-zinc-900 border border-zinc-800/80 hover:bg-zinc-850 hover:border-zinc-700 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-bold ${
            isMock ? "bg-amber-950/25 border-amber-500/20 text-amber-400" : "bg-emerald-950/25 border-emerald-500/20 text-emerald-400"
          }`}>
            {isMock ? "Mock" : "Live"}
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile nav items list */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute left-0 right-0 top-[73px] bg-brand-dark border-b border-zinc-900 p-5 flex flex-col gap-2.5 shadow-2xl animate-fade-in">
          {navItems.map((item) => {
            const IconComp = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive(item.path)
                    ? "bg-brand-amber text-brand-dark font-black"
                    : "bg-zinc-900/60 text-zinc-400 hover:text-white"
                }`}
              >
                <IconComp className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="h-px bg-zinc-900 my-2" />
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-bold text-rose-400 bg-rose-950/10 hover:bg-rose-950/20 border border-rose-500/10 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default AdminNavbar;
