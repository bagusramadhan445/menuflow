import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dbService } from "../../services/db";
import { formatRupiah } from "../../utils/format";
import AdminNavbar from "../../components/AdminNavbar";
import { 
  DollarSign, 
  ShoppingBag, 
  Utensils, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight
} from "lucide-react";

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  // Statistics State
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrdersCount: 0,
    newOrdersCount: 0,
    activeMenusCount: 0
  });

  useEffect(() => {
    // Seed DB check
    dbService.seedDefaultData().then(() => {
      // Subscribe to Orders
      const unsubOrders = dbService.subscribeOrders((ordersList) => {
        setOrders(ordersList);
        setLoading(false);
      });

      // Subscribe to Menus
      const unsubMenus = dbService.subscribeMenus((menusList) => {
        setMenus(menusList);
      });

      return () => {
        unsubOrders();
        unsubMenus();
      };
    });
  }, []);

  // Compute stats when orders or menus list change
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= today;
    });

    const activeOrdersToday = todayOrders.filter(o => o.status !== "batal");
    const todayRevenue = activeOrdersToday.reduce((sum, o) => sum + o.totalAmount, 0);

    const newOrders = orders.filter(o => o.status === "baru");
    const activeMenus = menus.filter(m => m.isActive);

    setStats({
      todayRevenue,
      todayOrdersCount: todayOrders.length,
      newOrdersCount: newOrders.length,
      activeMenusCount: activeMenus.length
    });
  }, [orders, menus]);

  // Get recent 5 orders
  const recentOrders = orders.slice(0, 5);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "baru": return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      case "siap": return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "selesai": return "bg-blue-500/10 border-blue-500/20 text-blue-400";
      case "batal": return "bg-rose-500/10 border-rose-500/20 text-rose-400";
      default: return "bg-zinc-800 border-zinc-750 text-zinc-400";
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark pb-12 text-zinc-100 font-sans">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-6 mt-8 flex flex-col gap-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-zinc-950 p-6 rounded-3xl border border-zinc-850 shadow-md">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Selamat Datang di MenuFlow Panel</h2>
            <p className="text-zinc-500 text-xs md:text-sm mt-1 font-medium">Lihat ringkasan dan status operasional outlet Anda hari ini.</p>
          </div>
          <Link 
            to="/admin/orders" 
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-amber hover:bg-brand-gold text-brand-dark text-xs font-extrabold tracking-wider uppercase transition-all shadow-md"
          >
            <span>Buka Live Order Board</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>

        {/* Dashboard Widgets Stats */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-3 border-brand-amber border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-zinc-500 text-xs tracking-wider">Menganalisis data outlet...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Widget 1: Revenue */}
            <div className="p-6 rounded-3xl bg-brand-card border border-zinc-900/60 shadow-md flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Omzet Hari Ini</span>
                <span className="text-xl font-black text-white tracking-tight leading-none">{formatRupiah(stats.todayRevenue)}</span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Pendapatan aktif</span>
                </span>
              </div>
              <div className="p-4 bg-emerald-950/20 text-emerald-400 border border-emerald-500/15 rounded-2xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            {/* Widget 2: Total Orders */}
            <div className="p-6 rounded-3xl bg-brand-card border border-zinc-900/60 shadow-md flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Pesanan Hari Ini</span>
                <span className="text-2xl font-black text-white tracking-tight leading-none">{stats.todayOrdersCount}</span>
                <span className="text-[10px] text-zinc-500 font-medium mt-1">Total dine-in + takeaway</span>
              </div>
              <div className="p-4 bg-blue-950/20 text-blue-400 border border-blue-500/15 rounded-2xl">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>

            {/* Widget 3: Pending/New Orders */}
            <div className="p-6 rounded-3xl bg-brand-card border border-zinc-900/60 shadow-md flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Pesanan Baru</span>
                <span className="text-2xl font-black text-white tracking-tight leading-none">{stats.newOrdersCount}</span>
                <span className={`text-[10px] font-bold mt-1 ${stats.newOrdersCount > 0 ? "text-amber-400 animate-pulse" : "text-zinc-500"}`}>
                  {stats.newOrdersCount > 0 ? "Butuh konfirmasi segera" : "Semua terproses"}
                </span>
              </div>
              <div className={`p-4 border rounded-2xl transition-colors ${
                stats.newOrdersCount > 0 
                  ? "bg-amber-950/35 border-amber-500/35 text-brand-amber animate-pulse" 
                  : "bg-zinc-900/30 border-zinc-800 text-zinc-500"
              }`}>
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>

            {/* Widget 4: Active Menus */}
            <div className="p-6 rounded-3xl bg-brand-card border border-zinc-900/60 shadow-md flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Menu Aktif</span>
                <span className="text-2xl font-black text-white tracking-tight leading-none">{stats.activeMenusCount}</span>
                <span className="text-[10px] text-zinc-500 font-medium mt-1">Tampil di QR customer</span>
              </div>
              <div className="p-4 bg-zinc-950/50 text-zinc-400 border border-zinc-850 rounded-2xl">
                <Utensils className="w-6 h-6" />
              </div>
            </div>

          </div>
        )}

        {/* Bottom grid (Recent orders + Quick actions) */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Recent Orders Queue (2/3 width) */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-brand-card border border-zinc-900/60 shadow-md flex flex-col gap-5">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <h3 className="font-extrabold text-sm text-zinc-200 tracking-tight flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-amber" />
                  <span>Aktivitas Pesanan Terkini</span>
                </h3>
                <Link to="/admin/orders" className="text-xs font-bold text-brand-amber hover:text-brand-gold flex items-center gap-1 transition-colors">
                  <span>Lihat Semua</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentOrders.length > 0 ? (
                <div className="flex flex-col gap-3.5">
                  {recentOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/40 border border-zinc-900/80 hover:border-zinc-850 hover:bg-zinc-950/60 transition-all"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-[10px] font-black">
                          <span className="text-zinc-500">MEJA</span>
                          <span className="text-brand-amber text-xs leading-none">{order.tableNumber}</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-200">{order.customerName}</p>
                          <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                            {order.items.length} item • {formatRupiah(order.totalAmount)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 text-[10px] font-extrabold border rounded-full ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                        <Link 
                          to="/admin/orders" 
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white transition-all border border-zinc-800"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-650">
                  <ShoppingBag className="w-10 h-10 mb-3" />
                  <p className="text-xs font-bold text-zinc-400">Belum ada pesanan masuk</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Semua data pesanan baru akan tampil di sini.</p>
                </div>
              )}
            </div>

            {/* Quick Settings Panels (1/3 width) */}
            <div className="flex flex-col gap-6">
              
              {/* Quick Navigation Card */}
              <div className="p-6 rounded-3xl bg-brand-card border border-zinc-900/60 shadow-md flex flex-col gap-4">
                <h3 className="font-extrabold text-sm text-zinc-200 tracking-tight border-b border-zinc-900 pb-3">
                  Pintasan Admin
                </h3>
                
                <div className="flex flex-col gap-2">
                  <Link 
                    to="/admin/menu" 
                    className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-all"
                  >
                    <span>Kelola Menu & Promo</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </Link>

                  <Link 
                    to="/admin/qr" 
                    className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-all"
                  >
                    <span>Buat QR Code Meja</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </Link>

                  <Link 
                    to="/admin/reports" 
                    className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-all"
                  >
                    <span>Laporan & Analitik Penjualan</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </Link>
                </div>
              </div>

              {/* Status Operational card */}
              <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-850 flex flex-col gap-3 relative">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">
                  Status Sistem
                </h3>
                <div className="flex flex-col gap-2.5 text-xs">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-500 font-semibold">Integrasi Cloud</span>
                    <span className="font-extrabold text-emerald-400">AKTIF</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-500 font-semibold">Mode Simulasi</span>
                    <span className="font-extrabold text-amber-400">{dbService.isMock ? "AKTIF" : "NONAKTIF"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-500 font-semibold">Kecepatan Sinkron</span>
                    <span className="font-extrabold text-zinc-300">Realtime (0s)</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
