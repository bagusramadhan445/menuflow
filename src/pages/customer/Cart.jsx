import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatRupiah } from "../../utils/format";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingCart, StickyNote } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const Cart = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [cart, setCart] = useState([]);

  // Load Cart
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("menuflow_cart")) || [];
    setCart(savedCart);
  }, []);

  // Update Cart Storage
  const updateCartAndStorage = (newCart) => {
    setCart(newCart);
    localStorage.setItem("menuflow_cart", JSON.stringify(newCart));
  };

  // Adjust Quantity
  const handleQtyChange = (index, change) => {
    const newCart = [...cart];
    const item = newCart[index];
    const newQty = item.quantity + change;

    if (newQty <= 0) {
      // Remove item
      newCart.splice(index, 1);
      addToast(`${item.name} dihapus dari keranjang`, "info");
    } else {
      newCart[index].quantity = newQty;
    }

    updateCartAndStorage(newCart);
  };

  // Remove Item Directly
  const handleRemoveItem = (index) => {
    const newCart = [...cart];
    const itemName = newCart[index].name;
    newCart.splice(index, 1);
    updateCartAndStorage(newCart);
    addToast(`${itemName} dihapus dari keranjang`, "info");
  };

  // Calculate Subtotals
  const subtotal = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const tax = Math.round(subtotal * 0.1); // 10% tax/service
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-brand-dark text-zinc-100 flex flex-col font-sans max-w-md mx-auto relative shadow-2xl border-x border-zinc-900 pb-28">
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
            Keranjang Pesanan
          </h1>
          <p className="text-xs text-zinc-500 font-semibold">Tinjau item pesanan Anda</p>
        </div>
      </header>

      {/* Cart Content */}
      <main className="flex-1 px-4 mt-6">
        {cart.length > 0 ? (
          <div className="flex flex-col gap-4">
            {cart.map((item, idx) => (
              <div 
                key={`${item.menuId}-${idx}`} 
                className="flex gap-4 p-3.5 rounded-2xl bg-brand-card border border-zinc-900/60 shadow-md relative"
              >
                {/* Image */}
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800 border border-zinc-900">
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80";
                    }}
                  />
                </div>

                {/* Info & Quantity controls */}
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-zinc-100 text-sm leading-snug line-clamp-1">
                        {item.name}
                      </h3>
                      <button 
                        onClick={() => handleRemoveItem(idx)}
                        className="text-zinc-500 hover:text-rose-400 transition-colors p-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {item.notes && (
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-brand-amber bg-brand-amber/5 border border-brand-amber/10 px-2.5 py-1 rounded-lg w-max max-w-full">
                        <StickyNote className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="line-clamp-1">{item.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2.5">
                    <span className="font-extrabold text-zinc-300 text-xs">
                      {formatRupiah(item.price * item.quantity)}
                    </span>

                    {/* Counter */}
                    <div className="flex items-center bg-zinc-950 border border-zinc-900 rounded-xl p-1">
                      <button
                        onClick={() => handleQtyChange(idx, -1)}
                        className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 active:scale-95 transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQtyChange(idx, 1)}
                        className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 active:scale-95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Price Calculations */}
            <div className="mt-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-md">
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-4">Rincian Pembayaran</h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-semibold">Subtotal</span>
                  <span className="text-zinc-300 font-bold">{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-semibold">Pajak & Layanan (10%)</span>
                  <span className="text-zinc-300 font-bold">{formatRupiah(tax)}</span>
                </div>
                <div className="h-px bg-zinc-800 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300 font-extrabold text-sm">Total Tagihan</span>
                  <span className="text-brand-amber font-black text-base">{formatRupiah(total)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-700 mb-5 border border-zinc-800/60 shadow-inner">
              <ShoppingCart className="w-10 h-10" />
            </div>
            <p className="text-zinc-300 font-extrabold text-base">Keranjang Anda Kosong</p>
            <p className="text-zinc-500 text-xs mt-1.5 max-w-xs leading-relaxed">
              Anda belum menambahkan makanan atau minuman apapun ke dalam keranjang belanja.
            </p>
            <button
              onClick={() => navigate("/menu")}
              className="mt-6 bg-brand-amber hover:bg-brand-gold text-brand-dark font-extrabold py-3.5 px-6 rounded-xl text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer"
            >
              Lihat Menu Sekarang
            </button>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 max-w-md mx-auto p-4 z-40 bg-gradient-to-t from-brand-dark via-brand-dark to-transparent">
          <button
            onClick={() => navigate("/checkout")}
            className="w-full bg-brand-amber hover:bg-brand-gold text-brand-dark font-extrabold py-4 px-6 rounded-2xl text-center text-sm tracking-wider uppercase transition-all shadow-lg cursor-pointer"
          >
            Lanjut ke Pembayaran ({formatRupiah(total)})
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;
