import React, { useState, useEffect } from "react";
import { dbService } from "../../services/db";
import { formatRupiah } from "../../utils/format";
import AdminNavbar from "../../components/AdminNavbar";
import { 
  BarChart3, 
  DollarSign, 
  ShoppingBag, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  TrendingUp, 
  Flame 
} from "lucide-react";

const AdminReports = () => {
  // Report Filter State: "today" | "all"
  const [filterType, setFilterType] = useState("today");
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Aggregated States
  const [reportStats, setReportStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    completedCount: 0,
    cancelledCount: 0,
    bestSellers: []
  });

  useEffect(() => {
    setLoading(true);
    const unsubscribe = dbService.subscribeOrders((data) => {
      setOrders(data);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Recalculate stats when orders list or filter type changes
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter orders by date range
    const filteredOrders = orders.filter(order => {
      if (filterType === "today") {
        const orderDate = new Date(order.createdAt);
        return orderDate >= today;
      }
      return true; // All time
    });

    // Subtotal aggregates
    const activeOrders = filteredOrders.filter(o => o.status !== "batal");
    const totalRevenue = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = filteredOrders.length;
    
    const completedCount = filteredOrders.filter(o => o.status === "selesai").length;
    const cancelledCount = filteredOrders.filter(o => o.status === "batal").length;

    // Calculate Best Sellers
    const itemsMap = {};
    activeOrders.forEach(order => {
      order.items.forEach(item => {
        const key = item.menuId || item.name;
        if (!itemsMap[key]) {
          itemsMap[key] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
            imageUrl: item.imageUrl
          };
        }
        itemsMap[key].quantity += item.quantity;
        itemsMap[key].revenue += item.price * item.quantity;
      });
    });

    // Convert map to sorted array
    const bestSellers = Object.values(itemsMap)
      .sort((a, b) => b.quantity - a.quantity);

    setReportStats({
      totalRevenue,
      totalOrders,
      completedCount,
      cancelledCount,
      bestSellers
    });

  }, [orders, filterType]);

  // Helper relative width for progress bar
  const getMaxQuantity = () => {
    if (reportStats.bestSellers.length === 0) return 1;
    return reportStats.bestSellers[0].quantity;
  };

  const maxQty = getMaxQuantity();

  return (
    <div className="min-h-screen bg-brand-dark pb-12 text-zinc-100 font-sans">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-6 mt-8 flex flex-col gap-6">
        
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-brand-amber" />
              <span>Laporan & Laba Penjualan</span>
            </h2>
            <p className="text-zinc-500 text-xs md:text-sm mt-0.5 font-medium">Analisis omzet kasir dan menu terlaris secara realtime.</p>
          </div>

          {/* Filter Toggles */}
          <div className="flex bg-zinc-900 border border-zinc-850 p-1.5 rounded-2xl gap-1">
            <button
              onClick={() => setFilterType("today")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterType === "today"
                  ? "bg-brand-amber text-brand-dark"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterType === "all"
                  ? "bg-brand-amber text-brand-dark"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Semua Waktu
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-3 border-brand-amber border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-zinc-500 text-xs tracking-wider">Menghitung laporan...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Summary and Best Sellers (2/3 width) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Revenue card */}
                <div className="p-6 rounded-3xl bg-brand-card border border-zinc-900/60 shadow-md flex items-center justify-between">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-zinc-550 text-[10px] font-bold uppercase tracking-wider">Total Omzet Bersih</span>
                    <span className="text-xl font-black text-white tracking-tight leading-none">{formatRupiah(reportStats.totalRevenue)}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Pendapatan Valid</span>
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-950/20 text-emerald-400 border border-emerald-500/15 rounded-xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>

                {/* Orders Card */}
                <div className="p-6 rounded-3xl bg-brand-card border border-zinc-900/60 shadow-md flex items-center justify-between">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-zinc-550 text-[10px] font-bold uppercase tracking-wider">Jumlah Transaksi</span>
                    <span className="text-2xl font-black text-white tracking-tight leading-none">{reportStats.totalOrders} order</span>
                    <span className="text-[10px] text-zinc-500 font-medium mt-1">Masuk ke antrean kasir</span>
                  </div>
                  <div className="p-3 bg-blue-950/20 text-blue-400 border border-blue-500/15 rounded-xl">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Order Status Breakdown sub-panel */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-900/35 border border-zinc-900/60 flex items-center gap-3">
                  <div className="p-2 bg-emerald-950/20 text-emerald-400 border border-emerald-500/10 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-zinc-550 text-[9px] font-bold uppercase tracking-wider block">Selesai / Lunas</span>
                    <span className="text-sm font-extrabold text-zinc-200">{reportStats.completedCount} Order</span>
                  </div>
                </div>
                
                <div className="p-4 rounded-2xl bg-zinc-900/35 border border-zinc-900/60 flex items-center gap-3">
                  <div className="p-2 bg-rose-950/20 text-rose-400 border border-rose-500/10 rounded-xl">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-zinc-550 text-[9px] font-bold uppercase tracking-wider block">Dibatalkan</span>
                    <span className="text-sm font-extrabold text-zinc-200">{reportStats.cancelledCount} Order</span>
                  </div>
                </div>
              </div>

              {/* Best Sellers card */}
              <div className="p-6 rounded-3xl bg-brand-card border border-zinc-900/60 shadow-md flex flex-col gap-5">
                <h3 className="font-extrabold text-sm text-zinc-200 tracking-tight flex items-center gap-2 border-b border-zinc-900 pb-3">
                  <Flame className="w-4 h-4 text-brand-amber animate-pulse" />
                  <span>Daftar Menu Terlaris</span>
                </h3>

                {reportStats.bestSellers.length > 0 ? (
                  <div className="flex flex-col gap-4.5">
                    {reportStats.bestSellers.slice(0, 6).map((item, idx) => (
                      <div key={idx} className="flex flex-col gap-1.5 text-xs">
                        <div className="flex justify-between items-center font-bold">
                          <div className="flex items-center gap-2">
                            <span className="w-5 text-center text-zinc-650 font-black font-mono">#{idx+1}</span>
                            <span className="text-zinc-200">{item.name}</span>
                          </div>
                          <div className="flex gap-4.5 text-zinc-400 text-[11px]">
                            <span>{item.quantity} porsi</span>
                            <span className="font-extrabold text-brand-amber">{formatRupiah(item.revenue)}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-900">
                          <div 
                            className="bg-brand-amber h-full rounded-full transition-all duration-1000"
                            style={{ width: `${(item.quantity / maxQty) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-600 text-xs">
                    Belum ada transaksi valid untuk merangkum menu terlaris.
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Tabular Sales Logs (1/3 width) */}
            <div className="p-6 rounded-3xl bg-brand-card border border-zinc-900/60 shadow-md flex flex-col gap-4 h-[550px]">
              <h3 className="font-extrabold text-sm text-zinc-200 tracking-tight flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Calendar className="w-4 h-4 text-brand-amber" />
                <span>Log Transaksi Masuk</span>
              </h3>

              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
                {orders.length > 0 ? (
                  orders.filter(o => {
                    if (filterType === "today") {
                      const today = new Date();
                      today.setHours(0,0,0,0);
                      return new Date(o.createdAt) >= today;
                    }
                    return true;
                  }).map(order => (
                    <div 
                      key={order.id} 
                      className="p-3.5 rounded-2xl bg-zinc-950/40 border border-zinc-900 hover:border-zinc-850 transition-all flex flex-col gap-1.5 text-[11px]"
                    >
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-zinc-300">Meja {order.tableNumber} - {order.customerName}</span>
                        <span className="text-brand-amber">{formatRupiah(order.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-550 text-[10px]">
                        <span>
                          {new Date(order.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB • {order.paymentMethod || "Bayar di Kasir"}
                        </span>
                        <span className="uppercase font-extrabold">{order.status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 text-zinc-650 text-xs">
                    Belum ada catatan order masuk.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default AdminReports;
