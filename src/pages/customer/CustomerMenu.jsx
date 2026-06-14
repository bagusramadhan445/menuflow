import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { dbService } from "../../services/db";
import { formatRupiah } from "../../utils/format";
import { Search, ShoppingBag, Plus, Minus, X, HelpCircle, Utensils } from "lucide-react";
import { useToast } from "../../context/ToastContext";

// LazyImage Sub-component for loading states and image fallbacks
const LazyImage = ({ src, alt, fallback }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div className="w-full h-full relative bg-zinc-900 flex items-center justify-center">
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <div className="w-5 h-5 border-2 border-brand-amber border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {error || !src ? (
        <img 
          src={fallback} 
          alt={alt} 
          className="w-full h-full object-cover"
        />
      ) : (
        <img 
          src={src} 
          alt={alt} 
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
};

const CustomerMenu = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Route parameters & Session tracking for Table Number
  const urlTable = searchParams.get("table");
  const [tableNumber, setTableNumber] = useState("");
  const [orderMode, setOrderMode] = useState(() => {
    return localStorage.getItem("menuflow_order_mode") || "takeaway";
  });

  // Modal selector for Order Mode
  const [modeModalOpen, setModeModalOpen] = useState(false);
  const [tempMode, setTempMode] = useState("takeaway");
  const [tempTable, setTempTable] = useState("");

  // Data States
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Cart Local State (synced to LocalStorage)
  const [cart, setCart] = useState([]);

  // Drawer / Customization State
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemQty, setItemQty] = useState(1);
  const [itemNote, setItemNote] = useState("");

  // Handle Table Number Setup
  useEffect(() => {
    if (urlTable) {
      localStorage.setItem("menuflow_table", urlTable);
      localStorage.setItem("menuflow_order_mode", "dine-in");
      setTableNumber(urlTable);
      setOrderMode("dine-in");
    } else {
      const savedMode = localStorage.getItem("menuflow_order_mode") || "takeaway";
      const savedTable = localStorage.getItem("menuflow_table") || "";
      setOrderMode(savedMode);
      if (savedMode === "dine-in") {
        setTableNumber(savedTable);
      } else {
        setTableNumber("");
      }
    }
  }, [urlTable]);

  const handleOpenModeModal = () => {
    setTempMode(orderMode);
    setTempTable(tableNumber);
    setModeModalOpen(true);
  };

  const handleSaveMode = () => {
    if (tempMode === "dine-in" && !tempTable.trim()) {
      addToast("Nomor meja wajib diisi untuk Makan di Tempat!", "warning");
      return;
    }

    setOrderMode(tempMode);
    localStorage.setItem("menuflow_order_mode", tempMode);

    if (tempMode === "dine-in") {
      setTableNumber(tempTable.trim());
      localStorage.setItem("menuflow_table", tempTable.trim());
    } else {
      setTableNumber("");
      localStorage.removeItem("menuflow_table");
    }

    setModeModalOpen(false);
    addToast(`Mode pemesanan diubah menjadi: ${tempMode === "dine-in" ? "Dine In" : "Takeaway"}`, "success");
  };

  // Load Data & Cart
  useEffect(() => {
    // Seed DB if empty
    dbService.seedDefaultData().then(() => {
      // Subscribe to Categories
      const unsubCat = dbService.subscribeCategories((data) => {
        setCategories(data);
      });

      // Subscribe to Menus
      const unsubMenus = dbService.subscribeMenus((data) => {
        setMenus(data.filter(item => item.isActive));
        setLoading(false);
      });

      // Subscribe to Promos
      const unsubPromos = dbService.subscribePromos((data) => {
        setPromos(data.filter(p => p.isActive));
      });

      return () => {
        unsubCat();
        unsubMenus();
        unsubPromos();
      };
    });

    // Load Cart from LocalStorage
    const savedCart = JSON.parse(localStorage.getItem("menuflow_cart")) || [];
    setCart(savedCart);
  }, []);

  // Sync Cart to LocalStorage
  const updateCartAndStorage = (newCart) => {
    setCart(newCart);
    localStorage.setItem("menuflow_cart", JSON.stringify(newCart));
  };

  // Open Drawer to Add Item
  const handleOpenAddDrawer = (item) => {
    setSelectedItem(item);
    setItemQty(1);
    setItemNote("");
  };

  // Add Item to Cart
  const handleAddToCart = () => {
    if (!selectedItem) return;

    const cartItem = {
      menuId: selectedItem.id,
      name: selectedItem.name,
      price: selectedItem.price,
      imageUrl: selectedItem.imageUrl,
      quantity: itemQty,
      notes: itemNote.trim()
    };

    const newCart = [...cart];
    // Find item with same ID AND same notes
    const existingIndex = newCart.findIndex(
      (i) => i.menuId === cartItem.menuId && i.notes === cartItem.notes
    );

    if (existingIndex !== -1) {
      newCart[existingIndex].quantity += cartItem.quantity;
    } else {
      newCart.push(cartItem);
    }

    updateCartAndStorage(newCart);
    addToast(`${selectedItem.name} berhasil ditambahkan ke keranjang`, "success");
    setSelectedItem(null); // Close Drawer
  };

  // Calculate cart stats
  const totalCartItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalCartPrice = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  // Filter Menus
  const filteredMenus = menus.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-brand-dark pb-24 text-zinc-100 flex flex-col font-sans max-w-md mx-auto relative shadow-2xl border-x border-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-nav px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-amber/15 rounded-xl border border-brand-amber/25 text-brand-amber">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-white font-sans">
              Menu<span className="text-brand-amber">Flow</span>
            </h1>
            <p className="text-xs text-zinc-400 font-medium">Digital QR Menu</p>
          </div>
        </div>

        <button 
          onClick={handleOpenModeModal}
          className={`px-3 py-1.5 rounded-full font-bold text-xs border transition-all cursor-pointer shadow-md ${
            orderMode === "dine-in"
              ? "bg-brand-amber text-brand-dark border-brand-amber animate-pulse font-extrabold"
              : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
          }`}
        >
          {orderMode === "dine-in" ? `Meja ${tableNumber}` : "Takeaway"}
        </button>
      </header>

      {/* Promos Banner Slider */}
      {promos.length > 0 && (
        <section className="px-4 mt-5">
          <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1">
            {promos.map((promo) => (
              <div 
                key={promo.id} 
                className="flex-shrink-0 w-full snap-start rounded-2xl overflow-hidden glass aspect-[21/9] relative shadow-lg group border border-white/5"
              >
                <img 
                  src={promo.imageUrl} 
                  alt={promo.title} 
                  className="w-full h-full object-cover brightness-[0.65] transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black via-black/40 to-transparent">
                  <p className="text-xs font-bold text-brand-amber uppercase tracking-wider mb-0.5">Promo Spesial</p>
                  <p className="text-sm font-semibold text-zinc-100 leading-tight line-clamp-2">{promo.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search Input */}
      <section className="px-4 mt-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Cari makanan atau minuman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-card border border-zinc-800 focus:border-brand-amber/50 rounded-2xl pl-12 pr-10 py-3.5 text-zinc-200 text-sm font-medium transition-all focus:outline-none placeholder-zinc-500 shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </section>

      {/* Categories Filter Horizontal scroll */}
      <section className="mt-5 px-4">
        <div className="flex flex-nowrap gap-2.5 overflow-x-auto pb-2 whitespace-nowrap">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 border ${
              selectedCategory === "all"
                ? "bg-brand-amber text-brand-dark border-brand-amber shadow-lg shadow-brand-amber/10 font-extrabold"
                : "bg-brand-card hover:bg-zinc-800 text-zinc-400 border-zinc-800/80"
            }`}
          >
            Semua Menu
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 border ${
                selectedCategory === cat.slug
                  ? "bg-brand-amber text-brand-dark border-brand-amber shadow-lg shadow-brand-amber/10 font-extrabold"
                  : "bg-brand-card hover:bg-zinc-800 text-zinc-400 border-zinc-800/80"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Menu Grid */}
      <main className="mt-6 px-4 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-brand-amber border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-zinc-500 text-xs tracking-wider">Menyiapkan hidangan...</p>
          </div>
        ) : filteredMenus.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredMenus.map((item) => (
              <div 
                key={item.id} 
                className="flex items-stretch rounded-2xl overflow-hidden bg-brand-card border border-zinc-900/60 p-3.5 gap-4 animate-fade-in hover:border-zinc-800/80 transition-all shadow-md"
              >
                {/* Image */}
                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 relative bg-zinc-800 border border-zinc-900">
                  <LazyImage 
                    src={item.imageUrl} 
                    alt={item.name} 
                    fallback="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <h3 className="font-bold text-zinc-100 text-sm leading-snug line-clamp-1">{item.name}</h3>
                    <p className="text-zinc-500 text-xs font-normal mt-1 leading-normal line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-extrabold text-brand-amber text-sm leading-none">
                      {formatRupiah(item.price)}
                    </span>
                    <button
                      onClick={() => handleOpenAddDrawer(item)}
                      className="p-1.5 rounded-lg bg-brand-amber hover:bg-brand-gold text-brand-dark transition-all shadow-md cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-600 mb-4 border border-zinc-800">
              <Search className="w-8 h-8" />
            </div>
            <p className="text-zinc-400 font-bold text-sm">Menu tidak ditemukan</p>
            <p className="text-zinc-600 text-xs mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
          </div>
        )}
      </main>

      {/* Floating Cart Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 max-w-md mx-auto p-4 z-40 bg-gradient-to-t from-brand-dark via-brand-dark to-transparent">
          <button
            onClick={() => navigate("/cart")}
            className="w-full bg-brand-amber hover:bg-brand-gold text-brand-dark px-5 py-4 rounded-2xl flex items-center justify-between transition-all shadow-lg pulse-glow cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="relative p-1.5 bg-brand-dark rounded-xl text-brand-amber">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-brand-amber">
                  {totalCartItems}
                </span>
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-dark/60">Lihat Pesanan</p>
                <p className="font-extrabold text-sm leading-tight text-brand-dark">
                  {formatRupiah(totalCartPrice)}
                </p>
              </div>
            </div>
            <span className="font-extrabold text-sm text-brand-dark tracking-wider uppercase flex items-center gap-1">
              Keranjang &rarr;
            </span>
          </button>
        </div>
      )}

      {/* Bottom Sheet Drawer for Item Customization */}
      {selectedItem && (
        <>
          {/* Overlay */}
          <div 
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 bg-black/70 z-50 transition-opacity backdrop-blur-sm"
          />
          {/* Sheet */}
          <div className="fixed bottom-0 inset-x-0 max-w-md mx-auto rounded-t-[2.5rem] bg-zinc-900 border-t border-zinc-800 p-6 z-50 max-h-[85vh] overflow-y-auto shadow-2xl animate-fade-in flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-semibold text-brand-amber uppercase tracking-wider">
                Detail Menu
              </span>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media details */}
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-zinc-800 mb-4 border border-zinc-800">
              <LazyImage 
                src={selectedItem.imageUrl} 
                alt={selectedItem.name} 
                fallback="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80"
              />
            </div>

            <h2 className="font-extrabold text-xl text-white tracking-tight">{selectedItem.name}</h2>
            <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed font-normal">{selectedItem.description}</p>
            <p className="font-black text-brand-amber text-lg mt-3">{formatRupiah(selectedItem.price)}</p>

            <div className="h-px bg-zinc-800/80 my-5" />

            {/* Notes Input */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Catatan Pesanan <span className="text-zinc-600">(opsional)</span>
              </label>
              <textarea
                rows="2"
                placeholder="Contoh: pedas sedang, es sedikit, kuah pisah..."
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-amber/40 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:ring-0 transition-colors resize-none placeholder-zinc-600 font-medium"
              />
            </div>

            {/* Controls & Add Action */}
            <div className="flex items-center justify-between gap-4 mt-auto">
              <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-2xl p-1.5">
                <button
                  onClick={() => setItemQty(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 active:scale-95 transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-extrabold text-lg text-white">
                  {itemQty}
                </span>
                <button
                  onClick={() => setItemQty(prev => prev + 1)}
                  className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 bg-brand-amber hover:bg-brand-gold text-brand-dark font-extrabold py-4 px-6 rounded-2xl transition-all shadow-lg text-sm text-center tracking-wider uppercase cursor-pointer"
              >
                Tambah ({formatRupiah(selectedItem.price * itemQty)})
              </button>
            </div>
          </div>
        </>
      )}

      {/* Order Mode Selection Modal */}
      {modeModalOpen && (
        <>
          <div 
            onClick={() => setModeModalOpen(false)}
            className="fixed inset-0 bg-black/75 z-[999] transition-opacity backdrop-blur-sm"
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-sm w-[90%] p-6 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl z-[1000] animate-fade-in flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="font-extrabold text-base text-white">Mode Pemesanan</h3>
              <button 
                onClick={() => setModeModalOpen(false)}
                className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setTempMode("dine-in")}
                className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  tempMode === "dine-in"
                    ? "bg-brand-amber/5 border-brand-amber text-white"
                    : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:bg-zinc-900/50"
                }`}
              >
                <span className="text-xs font-bold block">Makan di Tempat (Dine In)</span>
                <span className="text-[10px] text-zinc-500 font-medium">Santap hidangan hangat langsung di meja restoran</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTempMode("takeaway");
                  setTempTable("");
                }}
                className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  tempMode === "takeaway"
                    ? "bg-brand-amber/5 border-brand-amber text-white"
                    : "bg-zinc-950 border-zinc-900 text-zinc-450 hover:bg-zinc-900/50"
                }`}
              >
                <span className="text-xs font-bold block">Bawa Pulang (Takeaway)</span>
                <span className="text-[10px] text-zinc-500 font-medium">Kemas hidangan untuk dinikmati di rumah</span>
              </button>
            </div>

            {tempMode === "dine-in" && (
              <div className="animate-fade-in">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Nomor Meja Anda *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 5, A3, VIP-1"
                  value={tempTable}
                  onChange={(e) => setTempTable(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-amber/40 focus:outline-none rounded-xl px-4 py-3 text-sm text-zinc-200 font-semibold"
                />
              </div>
            )}

            <button
              onClick={handleSaveMode}
              className="w-full bg-brand-amber hover:bg-brand-gold text-brand-dark font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Simpan Pilihan
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerMenu;
