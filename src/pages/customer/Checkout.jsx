import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dbService } from "../../services/db";
import { formatRupiah } from "../../utils/format";
import { ArrowLeft, User, HelpCircle, Utensils, CheckCircle, FileText } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const Checkout = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Load from Storage
  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState("");
  const [orderMode, setOrderMode] = useState("takeaway");

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [generalNote, setGeneralNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("menuflow_cart")) || [];
    setCart(savedCart);

    const savedTable = localStorage.getItem("menuflow_table") || "";
    setTableNumber(savedTable);

    const savedMode = localStorage.getItem("menuflow_order_mode") || "takeaway";
    setOrderMode(savedMode);

    // If cart is empty, redirect back to menu
    if (savedCart.length === 0) {
      navigate("/menu");
    }
  }, [navigate]);

  // Calculate pricing
  const subtotal = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  // Form Validation & Submit
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (cart.length === 0) {
      setValidationError("Keranjang belanja Anda kosong!");
      addToast("Keranjang belanja kosong", "warning");
      return;
    }
    if (!customerName.trim()) {
      setValidationError("Nama Pembeli wajib diisi!");
      return;
    }
    if (customerName.trim().length < 2) {
      setValidationError("Nama Pembeli minimal 2 karakter!");
      return;
    }
    if (orderMode === "dine-in" && !tableNumber.trim()) {
      setValidationError("Nomor Meja wajib diisi untuk Makan di Tempat!");
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        tableNumber: orderMode === "dine-in" ? tableNumber.trim() : "Takeaway",
        customerName: customerName.trim(),
        notes: generalNote.trim(),
        paymentMethod: "Bayar di Kasir",
        items: cart.map(item => ({
          menuId: item.menuId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes || "",
          imageUrl: item.imageUrl || ""
        })),
        totalAmount: total
      };

      const orderId = await dbService.createOrder(orderData);
      
      // Clear cart
      localStorage.removeItem("menuflow_cart");
      addToast("Pesanan Anda berhasil dikirim!", "success");
      
      // Redirect to status page
      navigate(`/order-status/${orderId}`);
    } catch (error) {
      console.error("Failed to place order:", error);
      addToast("Gagal mengirim pesanan. Silakan coba lagi.", "error");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-zinc-100 flex flex-col font-sans max-w-md mx-auto relative shadow-2xl border-x border-zinc-900 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-nav px-5 py-4 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight text-white font-sans">
            Konfirmasi Pesanan
          </h1>
          <p className="text-xs text-zinc-500 font-semibold">Lengkapi informasi pemesanan</p>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 px-4 mt-6">
        <form onSubmit={handlePlaceOrder} className="flex flex-col gap-5">
          {/* Table Badge Callout */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-amber/10 rounded-xl text-brand-amber border border-brand-amber/15">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Metode Pemesanan</p>
                <p className="text-sm font-bold text-zinc-200">
                  {orderMode === "dine-in" ? `Dine-in (Makan di Tempat)` : "Takeaway (Bungkus)"}
                </p>
              </div>
            </div>
            {orderMode === "dine-in" ? (
              <span className="px-4 py-1.5 rounded-full bg-brand-amber text-brand-dark font-black text-sm uppercase tracking-wider">
                Meja {tableNumber || "-"}
              </span>
            ) : (
              <span className="px-4 py-1.5 rounded-full bg-zinc-800 text-zinc-400 font-semibold text-xs border border-zinc-700">
                Bungkus
              </span>
            )}
          </div>

          {/* Form Fields */}
          <div className="p-5 rounded-2xl bg-brand-card border border-zinc-900/60 shadow-md flex flex-col gap-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2 mb-1">
              Data Pembeli
            </h3>
            
            {/* Customer Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-4 h-4 text-zinc-500" />
                Nama Pembeli <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Masukkan nama Anda (misal: Budi)"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (e.target.value.trim().length >= 2) setValidationError("");
                }}
                className={`w-full bg-zinc-950 border focus:outline-none focus:ring-0 rounded-xl px-4 py-3.5 text-sm text-zinc-200 font-medium placeholder-zinc-600 transition-colors ${
                  validationError && !customerName.trim() ? "border-rose-500/50 focus:border-rose-500" : "border-zinc-800 focus:border-brand-amber/40"
                }`}
              />
            </div>

            {/* Table Number Input if Dine-in */}
            {orderMode === "dine-in" && (
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-zinc-500" />
                  Nomor Meja <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nomor meja (misal: 5)"
                  value={tableNumber}
                  onChange={(e) => {
                    setTableNumber(e.target.value);
                    localStorage.setItem("menuflow_table", e.target.value);
                    if (e.target.value.trim()) setValidationError("");
                  }}
                  className={`w-full bg-zinc-950 border focus:outline-none focus:ring-0 rounded-xl px-4 py-3.5 text-sm text-zinc-200 font-medium placeholder-zinc-650 transition-colors ${
                    validationError && orderMode === "dine-in" && !tableNumber.trim() ? "border-rose-500/50 focus:border-rose-500" : "border-zinc-800 focus:border-brand-amber/40"
                  }`}
                />
              </div>
            )}

            {/* General Note */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-zinc-500" />
                Catatan Umum Pesanan <span className="text-zinc-600">(opsional)</span>
              </label>
              <textarea
                rows="3"
                placeholder="Contoh: jadikan satu nampan, minta sendok ekstra..."
                value={generalNote}
                onChange={(e) => setGeneralNote(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-amber/40 focus:outline-none focus:ring-0 rounded-xl px-4 py-3.5 text-sm text-zinc-200 font-medium placeholder-zinc-600 transition-colors resize-none"
              />
            </div>
            {validationError && (
              <p className="text-rose-400 text-xs font-semibold mt-1 animate-pulse text-center">{validationError}</p>
            )}
          </div>



          {/* Compact Item Review */}
          <div className="p-5 rounded-2xl bg-brand-card border border-zinc-900/60 shadow-md">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2 mb-3">
              Ringkasan Pesanan
            </h3>
            <div className="flex flex-col gap-3 max-h-36 overflow-y-auto pr-1">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-brand-amber bg-brand-amber/10 border border-brand-amber/15 px-2 py-0.5 rounded-lg">
                      {item.quantity}x
                    </span>
                    <span className="text-zinc-300 font-medium line-clamp-1">{item.name}</span>
                  </div>
                  <span className="text-zinc-500 font-semibold">
                    {formatRupiah(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Totals */}
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-md">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs text-zinc-500 font-semibold">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-zinc-500 font-semibold">
                <span>Pajak & Layanan (10%)</span>
                <span>{formatRupiah(tax)}</span>
              </div>
              <div className="h-px bg-zinc-800 my-1" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-300">Total Pembayaran</span>
                <span className="text-brand-amber font-black text-base">{formatRupiah(total)}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-amber hover:bg-brand-gold text-brand-dark disabled:bg-zinc-850 disabled:text-zinc-600 font-black py-4 px-6 rounded-2xl text-center text-sm tracking-wider uppercase transition-all shadow-lg mt-2 cursor-pointer flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></div>
                <span>Mengirim Pesanan...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 stroke-[2.5]" />
                <span>Kirim & Buat Pesanan</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
};

export default Checkout;
