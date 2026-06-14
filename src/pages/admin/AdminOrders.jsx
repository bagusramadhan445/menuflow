import React, { useState, useEffect, useRef } from "react";
import { dbService } from "../../services/db";
import { formatRupiah } from "../../utils/format";
import AdminNavbar from "../../components/AdminNavbar";
import { 
  ShoppingBag, 
  Utensils, 
  Clock, 
  Check, 
  ArrowRight, 
  X, 
  AlertTriangle,
  Play,
  RotateCcw,
  Volume2
} from "lucide-react";
import { useToast } from "../../context/ToastContext";

const AdminOrders = () => {
  const { addToast } = useToast();
  
  // Data state
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatusTab, setSelectedStatusTab] = useState("Semua");
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Keep track of order count to trigger notification sound
  const prevOrdersCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);

  // Play custom Synthesized Sound notification (No assets required!)
  const playAlertSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 note
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.12);

      // Tone 2 (slightly higher, after a small delay)
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5 note
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        gain2.gain.setValueAtTime(0.08, ctx.currentTime);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.25);
      }, 100);
    } catch (error) {
      console.warn("AudioContext blocked or failed:", error);
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = dbService.subscribeOrders((data) => {
      setOrders(data);
      setLoading(false);

      // Synchronize selectedOrder in real-time
      setSelectedOrder(prev => {
        if (!prev) return null;
        return data.find(o => o.id === prev.id) || prev;
      });

      // Check if new order is added
      const newOrdersCount = data.filter(o => o.status === "baru").length;
      if (!isFirstLoadRef.current) {
        if (newOrdersCount > prevOrdersCountRef.current) {
          playAlertSound();
          addToast("Ada pesanan baru masuk!", "warning");
        }
      } else {
        isFirstLoadRef.current = false;
      }
      prevOrdersCountRef.current = newOrdersCount;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [addToast]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await dbService.updateOrderStatus(orderId, newStatus);
      addToast(`Status pesanan berhasil diperbarui ke: ${newStatus}`, "success");
      
      // Sync local drawer view
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error(error);
      addToast("Gagal memperbarui status pesanan", "error");
    }
  };

  const getFilteredOrders = () => {
    if (selectedStatusTab === "Semua") return orders;
    return orders.filter(o => o.status === selectedStatusTab);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "baru": return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      case "siap": return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "selesai": return "bg-blue-500/10 border-blue-500/20 text-blue-400";
      case "batal": return "bg-rose-500/10 border-rose-500/20 text-rose-400";
      default: return "bg-zinc-800 border-zinc-750 text-zinc-400";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "baru": return "Baru";
      case "siap": return "Siap Disajikan";
      case "selesai": return "Selesai";
      case "batal": return "Batal";
      default: return status;
    }
  };

  const formatOrderTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const tabs = [
    { value: "Semua", label: "Semua" },
    { value: "baru", label: "Baru" },
    { value: "siap", label: "Siap" },
    { value: "selesai", label: "Selesai" },
    { value: "batal", label: "Batal" }
  ];
  const filteredOrders = getFilteredOrders();

  return (
    <div className="min-h-screen bg-brand-dark pb-12 text-zinc-100 font-sans">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-6 mt-8 flex flex-col gap-6">
        
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <ShoppingBag className="w-6 h-6 text-brand-amber" />
              <span>Daftar Pesanan Live</span>
            </h2>
            <p className="text-zinc-500 text-xs md:text-sm mt-0.5 font-medium">Pantau pesanan masuk secara real-time dari dapur.</p>
          </div>
          {/* Sound test button */}
          <button 
            onClick={playAlertSound}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-[10px] font-bold tracking-wider text-zinc-400 hover:text-white uppercase transition-all"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Tes Bell Notif</span>
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar border-b border-zinc-900 pb-2">
          {tabs.map(tab => {
            const count = tab.value === "Semua" ? orders.length : orders.filter(o => o.status === tab.value).length;
            return (
              <button
                key={tab.value}
                onClick={() => setSelectedStatusTab(tab.value)}
                className={`flex-shrink-0 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedStatusTab === tab.value
                    ? "bg-brand-amber text-brand-dark border-brand-amber shadow-md"
                    : "bg-zinc-900/50 hover:bg-zinc-900 text-zinc-400 border-zinc-900/80 hover:border-zinc-800"
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Live Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-3 border-brand-amber border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-zinc-500 text-xs tracking-wider">Menghubungkan ke database...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map(order => (
              <div 
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`p-5 rounded-3xl bg-brand-card border hover:border-zinc-800 hover:bg-zinc-900/40 transition-all cursor-pointer shadow-md flex flex-col gap-4 relative overflow-hidden group ${
                  order.status === "baru" ? "border-amber-500/20 shadow-glass-gold pulse-glow" : "border-zinc-900/60"
                }`}
              >
                {/* ID & Time */}
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-zinc-500 font-bold">#{order.id.substring(0, 8).toUpperCase()}</span>
                  <span className="text-zinc-500 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-650" />
                    <span>{formatOrderTime(order.createdAt)} WIB</span>
                  </span>
                </div>

                {/* Table & Name */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-900 flex flex-col items-center justify-center text-[10px] font-black">
                    <span className="text-zinc-550">MEJA</span>
                    <span className="text-brand-amber text-xs leading-none">{order.tableNumber}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-200 text-sm leading-tight group-hover:text-white transition-colors">
                      {order.customerName}
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{order.items.length} jenis item pesanan</p>
                  </div>
                </div>

                {/* Quick Item List */}
                <div className="h-px bg-zinc-950" />
                <div className="flex flex-col gap-2 flex-1">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-brand-amber">{item.quantity}x</span>
                        <span className="text-zinc-400 font-semibold line-clamp-1">{item.name}</span>
                      </div>
                      {item.notes && <span className="text-[10px] text-brand-amber/80 font-bold bg-brand-amber/5 px-1.5 py-0.5 rounded">*</span>}
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-[10px] text-zinc-500 font-medium text-left">+{order.items.length - 3} item lainnya...</p>
                  )}
                </div>

                {/* Footer status & actions */}
                <div className="h-px bg-zinc-950" />
                <div className="flex justify-between items-center mt-1">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                  
                  <span className="font-black text-white text-sm">
                    {formatRupiah(order.totalAmount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-28 bg-brand-card border border-zinc-900/60 rounded-3xl text-zinc-650">
            <ShoppingBag className="w-12 h-12 mb-4" />
            <p className="text-sm font-bold text-zinc-400">Tidak Ada Pesanan</p>
            <p className="text-xs text-zinc-500 mt-1">Pesanan dengan status "{selectedStatusTab}" kosong saat ini.</p>
          </div>
        )}
      </main>

      {/* Order Details Drawer Overlay & Panel */}
      {selectedOrder && (
        <>
          <div 
            onClick={() => setSelectedOrder(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
          />
          <div className="fixed top-0 right-0 bottom-0 max-w-md w-full bg-zinc-950 border-l border-zinc-900 shadow-2xl z-50 p-6 flex flex-col gap-6 overflow-y-auto animate-fade-in">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono block">ID: {selectedOrder.id}</span>
                <h3 className="font-black text-lg text-white">Detail Pesanan</h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="flex gap-4 p-4 bg-brand-card border border-zinc-900 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-900 flex flex-col items-center justify-center text-[10px] font-black">
                <span className="text-zinc-650">MEJA</span>
                <span className="text-brand-amber text-sm leading-none">{selectedOrder.tableNumber}</span>
              </div>
              <div>
                <h4 className="font-bold text-zinc-200">{selectedOrder.customerName}</h4>
                <p className="text-xs text-zinc-500 font-semibold mt-1">
                  Waktu: {new Date(selectedOrder.createdAt).toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            {/* Item list details */}
            <div className="flex flex-col gap-3.5 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-900/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-850 pb-2 mb-1">
                Item Pesanan
              </h4>
              <div className="flex flex-col gap-3.5">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex flex-col gap-1 text-xs">
                    <div className="flex justify-between items-center font-bold">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-brand-amber bg-brand-amber/10 px-2 py-0.5 rounded">{item.quantity}x</span>
                        <span className="text-zinc-200">{item.name}</span>
                      </div>
                      <span className="text-zinc-300">{formatRupiah(item.price * item.quantity)}</span>
                    </div>
                    {item.notes && (
                      <span className="text-[10px] text-amber-400 font-medium pl-8 bg-amber-950/10 border border-amber-500/10 rounded px-2.5 py-1 w-max max-w-full">
                        Catatan: {item.notes}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="h-px bg-zinc-800 my-1" />
              
              <div className="flex justify-between items-center text-xs pb-2">
                <span className="text-zinc-550 font-semibold">Metode Pembayaran</span>
                <span className="text-zinc-300 font-bold bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850">
                  {selectedOrder.paymentMethod || "Bayar di Kasir"}
                </span>
              </div>

              <div className="h-px bg-zinc-800 my-1" />

              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-zinc-400">Total Tagihan</span>
                <span className="text-brand-amber text-base font-black">{formatRupiah(selectedOrder.totalAmount)}</span>
              </div>
            </div>

            {/* General notes */}
            {selectedOrder.notes && (
              <div className="p-4 bg-zinc-900 border border-zinc-900/65 rounded-2xl text-xs text-zinc-400 leading-relaxed">
                <span className="font-bold text-zinc-200 block mb-1">Catatan Umum:</span>
                "{selectedOrder.notes}"
              </div>
            )}

            {/* Status updates buttons */}
            <div className="flex flex-col gap-3.5 mt-auto pt-6 border-t border-zinc-900">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Ubah Status Operasional
              </h4>

              {/* Status display */}
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-zinc-550 font-semibold">Status Saat Ini:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-1.5">
                {/* Action 1: Baru -> Siap */}
                {selectedOrder.status !== "selesai" ? (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, "selesai")}
                    className="col-span-2 bg-emerald-500 hover:bg-emerald-600 text-brand-dark font-extrabold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>PESANAN SELESAI</span>
                  </button>
                ) : (
                  <div className="col-span-2 p-3 text-center">
                    <span className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-wider">
                      SELESAI
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default AdminOrders;
