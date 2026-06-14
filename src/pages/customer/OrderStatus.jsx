import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dbService } from "../../services/db";
import { formatRupiah } from "../../utils/format";
import { ClipboardCheck, ArrowLeft, AlertTriangle } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const OrderStatus = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dbService.getOrder(orderId)
      .then((orderData) => {
        setOrder(orderData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load order:", error);
        addToast("Gagal memuat detail pesanan.", "error");
        setLoading(false);
      });
  }, [orderId, addToast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center font-sans max-w-md mx-auto border-x border-zinc-900 shadow-2xl">
        <div className="w-10 h-10 border-3 border-brand-amber border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-zinc-500 text-xs tracking-wider animate-pulse">Memuat pesanan Anda...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-brand-dark px-6 flex flex-col items-center justify-center text-center font-sans max-w-md mx-auto border-x border-zinc-900 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-rose-500 mb-5">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="font-extrabold text-zinc-200 text-lg">Pesanan Tidak Ditemukan</h2>
        <p className="text-zinc-500 text-xs mt-2 max-w-xs leading-relaxed">
          ID pesanan tidak terdaftar atau sudah diarsipkan. Silakan periksa kembali tautan Anda.
        </p>
        <button
          onClick={() => navigate("/menu")}
          className="mt-6 bg-brand-amber hover:bg-brand-gold text-brand-dark font-extrabold py-3.5 px-6 rounded-xl text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer"
        >
          Kembali ke Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-zinc-100 flex flex-col font-sans max-w-md mx-auto relative shadow-2xl border-x border-zinc-900 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-nav px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/menu")}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-white">Status Pemesanan</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 mt-6 flex flex-col gap-6">
        <div className="p-6 rounded-3xl bg-brand-card border border-zinc-900/60 shadow-lg flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-md">
            <ClipboardCheck className="w-7 h-7" />
          </div>
          
          <h2 className="font-black text-lg text-white tracking-tight">Pesanan Berhasil Dibuat</h2>
          <p className="text-zinc-400 text-xs leading-relaxed max-w-xs px-2">
            Silakan tunggu pesanan Anda dipanggil oleh kasir atau pelayan.
          </p>

          <div className="w-full h-px bg-zinc-800/80 my-2" />

          {/* Details Metadata */}
          <div className="w-full flex flex-col gap-3.5 text-xs text-left">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Order ID</span>
              <span className="font-mono text-zinc-300 font-bold select-all">#{orderId.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Nomor Meja</span>
              <span className="px-3 py-1 rounded-lg bg-zinc-950 text-brand-amber font-extrabold border border-zinc-900">
                {order.tableNumber === "Takeaway" ? "Takeaway" : `Meja ${order.tableNumber}`}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-zinc-550 font-semibold uppercase tracking-wider text-[10px]">Total Tagihan</span>
              <span className="font-black text-white text-sm">{formatRupiah(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Order Items Review */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-850 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Rincian Pembelian</span>
          </div>

          <div className="flex flex-col gap-3.5 max-h-48 overflow-y-auto pr-1">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-xs">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-zinc-400">{item.quantity}x</span>
                    <span className="text-zinc-200 font-semibold">{item.name}</span>
                  </div>
                  {item.notes && (
                    <span className="text-[10px] text-brand-amber/80 font-medium block mt-0.5 pl-6">
                      * Catatan: {item.notes}
                    </span>
                  )}
                </div>
                <span className="text-zinc-500 font-bold whitespace-nowrap">
                  {formatRupiah(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="mt-8 px-5">
        <button
          onClick={() => navigate("/menu")}
          className="w-full bg-zinc-900 hover:bg-zinc-850 text-white font-extrabold py-4 rounded-xl text-center text-xs tracking-wider uppercase border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          Pesan Menu Lainnya
        </button>
      </footer>
    </div>
  );
};

export default OrderStatus;
