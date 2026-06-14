import React, { useState, useEffect } from "react";
import { dbService } from "../../services/db";
import { formatRupiah } from "../../utils/format";
import AdminNavbar from "../../components/AdminNavbar";
import { 
  Plus, 
  Edit, 
  Trash2, 
  ChefHat, 
  Tag, 
  Image as ImageIcon, 
  X, 
  Check, 
  AlertTriangle 
} from "lucide-react";
import { useToast } from "../../context/ToastContext";

const AdminMenuManagement = () => {
  const { addToast } = useToast();
  
  // Tabs: "menus" | "categories" | "promos"
  const [activeTab, setActiveTab] = useState("menus");

  // Data states
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Modals States
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null); // If null, we are ADDING. If object, EDITING.
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null); // If null, adding. If object, editing.

  // Menu Form Inputs
  const [menuName, setMenuName] = useState("");
  const [menuPrice, setMenuPrice] = useState("");
  const [menuDesc, setMenuDesc] = useState("");
  const [menuImage, setMenuImage] = useState("");
  const [menuCat, setMenuCat] = useState("");
  const [menuActive, setMenuActive] = useState(true);

  // Menu Image Upload States
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [submittingMenu, setSubmittingMenu] = useState(false);

  // Category Form Inputs
  const [catName, setCatName] = useState("");

  // Promo Form Inputs
  const [promoTitle, setPromoTitle] = useState("");
  const [promoImage, setPromoImage] = useState("");
  const [promoActive, setPromoActive] = useState(true);

  useEffect(() => {
    setLoading(true);
    dbService.seedDefaultData().then(() => {
      // Subscribe categories
      const unsubCat = dbService.subscribeCategories((data) => {
        setCategories(data);
      });

      // Subscribe menus
      const unsubMenus = dbService.subscribeMenus((data) => {
        setMenus(data);
        setLoading(false);
      });

      // Subscribe promos
      const unsubPromos = dbService.subscribePromos((data) => {
        setPromos(data);
      });

      return () => {
        unsubCat();
        unsubMenus();
        unsubPromos();
      };
    });
  }, []);

  // --- MENU CRUD HANDLERS ---
  const handleOpenMenuModal = (item = null) => {
    if (item) {
      setEditingMenu(item);
      setMenuName(item.name);
      setMenuPrice(item.price.toString());
      setMenuDesc(item.description);
      setMenuImage(item.imageUrl);
      setImagePreviewUrl(item.imageUrl || "");
      setSelectedImageFile(null);
      setMenuCat(item.category);
      setMenuActive(item.isActive);
    } else {
      setEditingMenu(null);
      setMenuName("");
      setMenuPrice("");
      setMenuDesc("");
      setMenuImage("");
      setImagePreviewUrl("");
      setSelectedImageFile(null);
      setMenuCat(categories[0]?.slug || "");
      setMenuActive(true);
    }
    setMenuModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Type Validation
    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      addToast("Format file harus PNG, JPEG, atau WEBP!", "error");
      return;
    }

    // Size Validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      addToast("Ukuran file maksimal 5MB!", "error");
      return;
    }

    setSelectedImageFile(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl("");
    setMenuImage("");
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    if (!menuName.trim() || !menuPrice || !menuCat) {
      addToast("Harap isi semua kolom wajib!", "warning");
      return;
    }
    const priceNum = parseInt(menuPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      addToast("Harga harus bernilai positif!", "warning");
      return;
    }

    setSubmittingMenu(true);

    try {
      let finalImageUrl = menuImage;

      // If a file is selected, upload it
      if (selectedImageFile) {
        addToast("Mengunggah gambar...", "info");
        finalImageUrl = await dbService.uploadMenuImage(selectedImageFile);
      }

      const payload = {
        name: menuName.trim(),
        price: priceNum,
        category: menuCat,
        description: menuDesc.trim(),
        imageUrl: finalImageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80",
        isActive: menuActive
      };

      if (editingMenu) {
        await dbService.updateMenu(editingMenu.id, payload);
        addToast("Item menu berhasil diperbarui", "success");
      } else {
        await dbService.addMenu(payload);
        addToast("Item menu baru berhasil ditambahkan", "success");
      }
      setMenuModalOpen(false);
    } catch (err) {
      console.error(err);
      addToast("Gagal menyimpan item menu", "error");
    } finally {
      setSubmittingMenu(false);
    }
  };

  const handleDeleteMenu = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus menu ini?")) return;
    try {
      await dbService.deleteMenu(id);
      addToast("Item menu berhasil dihapus", "success");
    } catch (err) {
      console.error(err);
      addToast("Gagal menghapus menu", "error");
    }
  };

  const handleToggleMenuStatus = async (item) => {
    try {
      await dbService.updateMenu(item.id, { isActive: !item.isActive });
      addToast(`Menu ${item.isActive ? 'dinonaktifkan' : 'diaktifkan'}`, "success");
    } catch (err) {
      console.error(err);
      addToast("Gagal mengubah status menu", "error");
    }
  };

  // --- CATEGORY CRUD HANDLERS ---
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) {
      addToast("Nama Kategori wajib diisi!", "warning");
      return;
    }
    try {
      await dbService.addCategory(catName.trim());
      addToast("Kategori baru berhasil ditambahkan", "success");
      setCatName("");
      setCategoryModalOpen(false);
    } catch (err) {
      addToast(err.message || "Gagal menyimpan kategori", "error");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Menghapus kategori ini tidak akan menghapus item menu secara otomatis. Yakin ingin menghapus kategori?")) return;
    try {
      await dbService.deleteCategory(id);
      addToast("Kategori berhasil dihapus", "success");
    } catch (err) {
      console.error(err);
      addToast("Gagal menghapus kategori", "error");
    }
  };

  // --- PROMO CRUD HANDLERS ---
  const handleOpenPromoModal = (promo = null) => {
    if (promo) {
      setEditingPromo(promo);
      setPromoTitle(promo.title);
      setPromoImage(promo.imageUrl);
      setPromoActive(promo.isActive);
    } else {
      setEditingPromo(null);
      setPromoTitle("");
      setPromoImage("");
      setPromoActive(true);
    }
    setPromoModalOpen(true);
  };

  const handleSavePromo = async (e) => {
    e.preventDefault();
    if (!promoTitle.trim() || !promoImage.trim()) {
      addToast("Semua kolom promo wajib diisi!", "warning");
      return;
    }

    const payload = {
      title: promoTitle.trim(),
      imageUrl: promoImage.trim(),
      isActive: promoActive
    };

    try {
      if (editingPromo) {
        await dbService.updatePromo(editingPromo.id, payload);
        addToast("Promo banner berhasil diperbarui", "success");
      } else {
        await dbService.addPromo(payload);
        addToast("Promo banner baru berhasil ditambahkan", "success");
      }
      setPromoModalOpen(false);
    } catch (err) {
      console.error(err);
      addToast("Gagal menyimpan promo banner", "error");
    }
  };

  const handleDeletePromo = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus promo banner ini?")) return;
    try {
      await dbService.deletePromo(id);
      addToast("Promo banner berhasil dihapus", "success");
    } catch (err) {
      console.error(err);
      addToast("Gagal menghapus promo", "error");
    }
  };

  const handleTogglePromoStatus = async (item) => {
    try {
      await dbService.updatePromo(item.id, { isActive: !item.isActive });
      addToast(`Promo banner ${item.isActive ? 'dinonaktifkan' : 'diaktifkan'}`, "success");
    } catch (err) {
      console.error(err);
      addToast("Gagal mengubah status promo banner", "error");
    }
  };

  // Helper name mapping
  const getCategoryName = (catSlug) => {
    const found = categories.find(c => c.slug === catSlug);
    return found ? found.name : catSlug;
  };

  return (
    <div className="min-h-screen bg-brand-dark pb-12 text-zinc-100 font-sans">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-6 mt-8 flex flex-col gap-6">
        
        {/* Main Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <ChefHat className="w-6 h-6 text-brand-amber" />
              <span>Manajemen Database Menu</span>
            </h2>
            <p className="text-zinc-500 text-xs md:text-sm mt-0.5 font-medium">Kelola catalog hidangan, kategori pemilah, dan banner promosi.</p>
          </div>

          <div className="flex gap-3">
            {activeTab === "menus" && (
              <button
                onClick={() => handleOpenMenuModal()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-amber hover:bg-brand-gold text-brand-dark text-xs font-extrabold tracking-wider uppercase transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Tambah Menu</span>
              </button>
            )}
            {activeTab === "categories" && (
              <button
                onClick={() => setCategoryModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-amber hover:bg-brand-gold text-brand-dark text-xs font-extrabold tracking-wider uppercase transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Tambah Kategori</span>
              </button>
            )}
            {activeTab === "promos" && (
              <button
                onClick={() => handleOpenPromoModal()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-amber hover:bg-brand-gold text-brand-dark text-xs font-extrabold tracking-wider uppercase transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Tambah Promo</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 border-b border-zinc-900 pb-2">
          <button
            onClick={() => setActiveTab("menus")}
            className={`px-5 py-3 rounded-xl text-xs font-bold transition-all border ${
              activeTab === "menus"
                ? "bg-zinc-900 text-brand-amber border-zinc-800"
                : "bg-transparent text-zinc-400 border-transparent hover:bg-zinc-900 hover:text-white"
            }`}
          >
            Daftar Makanan & Minuman
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-5 py-3 rounded-xl text-xs font-bold transition-all border ${
              activeTab === "categories"
                ? "bg-zinc-900 text-brand-amber border-zinc-800"
                : "bg-transparent text-zinc-400 border-transparent hover:bg-zinc-900 hover:text-white"
            }`}
          >
            Kategori
          </button>
          <button
            onClick={() => setActiveTab("promos")}
            className={`px-5 py-3 rounded-xl text-xs font-bold transition-all border ${
              activeTab === "promos"
                ? "bg-zinc-900 text-brand-amber border-zinc-800"
                : "bg-transparent text-zinc-400 border-transparent hover:bg-zinc-900 hover:text-white"
            }`}
          >
            Promo Banner
          </button>
        </div>

        {/* --- DYNAMIC CONTENT --- */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-3 border-brand-amber border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-zinc-500 text-xs tracking-wider">Memuat katalog...</p>
          </div>
        ) : (
          <>
            {/* 1. MENUS TAB */}
            {activeTab === "menus" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menus.map((item) => (
                  <div key={item.id} className="p-4 rounded-3xl bg-brand-card border border-zinc-900/60 flex flex-col gap-4 shadow-md group relative">
                    {/* Media */}
                    <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-850 border border-zinc-900 relative">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80";
                        }}
                      />
                      
                      {/* Floating Category Tag */}
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-zinc-950/75 border border-zinc-800 text-[10px] font-bold text-brand-amber backdrop-blur-sm uppercase">
                        {getCategoryName(item.category)}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex flex-col gap-1.5 flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm text-zinc-200 group-hover:text-white transition-colors">{item.name}</h4>
                        <span className="font-extrabold text-brand-amber text-xs whitespace-nowrap">{formatRupiah(item.price)}</span>
                      </div>
                      <p className="text-zinc-550 text-xs font-normal line-clamp-2 leading-relaxed">{item.description}</p>
                    </div>

                    <div className="h-px bg-zinc-950" />

                    {/* Footer toggles & actions */}
                    <div className="flex items-center justify-between mt-0.5">
                      <button
                        onClick={() => handleToggleMenuStatus(item)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                          item.isActive
                            ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
                            : "bg-zinc-900 border-zinc-800 text-zinc-500"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? "bg-emerald-400 animate-pulse" : "bg-zinc-655"}`} />
                        <span>{item.isActive ? "Aktif (Tampil)" : "Nonaktif"}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenMenuModal(item)}
                          className="p-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 hover:border-zinc-750 text-zinc-400 hover:text-white transition-all cursor-pointer"
                          title="Edit Menu"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMenu(item.id)}
                          className="p-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-rose-950/20 hover:border-rose-500/20 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer"
                          title="Hapus Menu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. CATEGORIES TAB */}
            {activeTab === "categories" && (
              <div className="max-w-2xl bg-brand-card border border-zinc-900/60 rounded-3xl p-6 shadow-md">
                <h3 className="font-extrabold text-sm text-zinc-200 tracking-tight border-b border-zinc-900 pb-3 mb-4">
                  Daftar Kategori Pemilah
                </h3>
                
                <div className="flex flex-col gap-2.5">
                  {categories.map((cat, idx) => (
                    <div 
                      key={cat.id} 
                      className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/45 border border-zinc-900 hover:border-zinc-850 hover:bg-zinc-950/60 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-extrabold text-zinc-650 font-mono">#{idx+1}</span>
                        <div className="p-2 bg-brand-amber/10 rounded-xl text-brand-amber border border-brand-amber/15">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-zinc-200 leading-none">{cat.name}</p>
                          <p className="text-[10px] text-zinc-550 font-semibold font-mono mt-1 select-all">slug: {cat.slug}</p>
                        </div>
                      </div>

                      {/* We prevent deletion of system standard categories if we want, or allow it with warnings */}
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-rose-950/20 hover:border-rose-500/20 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. PROMOS TAB */}
            {activeTab === "promos" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {promos.map((promo) => (
                  <div key={promo.id} className="p-4 rounded-3xl bg-brand-card border border-zinc-900/60 flex flex-col gap-4 shadow-md relative group">
                    {/* Media Aspect Ratio fit banner */}
                    <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden bg-zinc-850 border border-zinc-900 relative">
                      <img 
                        src={promo.imageUrl} 
                        alt={promo.title} 
                        className="w-full h-full object-cover brightness-[0.7] group-hover:scale-[1.02] transition-transform duration-700"
                      />
                    </div>

                    <div className="flex-1">
                      <h4 className="font-extrabold text-sm text-zinc-200 leading-snug">{promo.title}</h4>
                    </div>

                    <div className="h-px bg-zinc-950" />

                    {/* Toggle and delete */}
                    <div className="flex items-center justify-between mt-0.5">
                      <button
                        onClick={() => handleTogglePromoStatus(promo)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                          promo.isActive
                            ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
                            : "bg-zinc-900 border-zinc-800 text-zinc-500"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${promo.isActive ? "bg-emerald-400 animate-pulse" : "bg-zinc-655"}`} />
                        <span>{promo.isActive ? "Aktif (Tampil)" : "Nonaktif"}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenPromoModal(promo)}
                          className="p-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 hover:border-zinc-750 text-zinc-400 hover:text-white transition-all cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePromo(promo.id)}
                          className="p-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-rose-950/20 hover:border-rose-500/20 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* --- MODALS OVERLAYS --- */}

      {/* 1. Menu Create/Edit Modal */}
      {menuModalOpen && (
        <>
          <div onClick={() => setMenuModalOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg w-full p-6 bg-zinc-950 border border-zinc-900 rounded-3xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto animate-fade-in flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <h3 className="font-black text-lg text-white">
                {editingMenu ? "Ubah Data Menu" : "Tambah Item Menu Baru"}
              </h3>
              <button onClick={() => setMenuModalOpen(false)} className="p-1 rounded-xl bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="flex flex-col gap-4">
              {/* Item Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Nama Menu *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Nasi Bakar Cakalang"
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 focus:border-brand-amber/40 focus:outline-none rounded-xl px-4 py-3 text-sm text-zinc-200"
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Harga (Rupiah) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 18000"
                    value={menuPrice}
                    onChange={(e) => setMenuPrice(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-850 focus:border-brand-amber/40 focus:outline-none rounded-xl px-4 py-3 text-sm text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Kategori *</label>
                  <select
                    value={menuCat}
                    onChange={(e) => setMenuCat(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-850 focus:border-brand-amber/40 focus:outline-none rounded-xl px-4 py-3 text-sm text-zinc-350 font-bold"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.slug} className="bg-zinc-950 text-white font-bold">{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Menu Image Upload */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Foto Hidangan
                </label>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center p-4 rounded-xl bg-zinc-900 border border-zinc-850">
                  {/* Preview Container */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 flex-shrink-0 flex items-center justify-center relative">
                    {imagePreviewUrl ? (
                      <img 
                        src={imagePreviewUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80";
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-zinc-600 gap-1">
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-1 flex flex-col gap-2 w-full">
                    <div className="flex gap-2">
                      <label className="flex-1 py-2.5 rounded-lg bg-zinc-850 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all text-xs font-bold text-center cursor-pointer flex items-center justify-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Pilih Gambar</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>

                      {imagePreviewUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-850 hover:bg-rose-950/20 hover:border-rose-500/20 text-zinc-550 hover:text-rose-400 transition-all cursor-pointer"
                          title="Hapus Gambar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-[9px] text-zinc-550 font-semibold leading-normal">
                      Hanya PNG, JPG, atau WEBP. Maksimal ukuran 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Deskripsi Hidangan</label>
                <textarea
                  rows="3"
                  placeholder="Jelaskan cita rasa hidangan Anda..."
                  value={menuDesc}
                  onChange={(e) => setMenuDesc(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 focus:border-brand-amber/40 focus:outline-none rounded-xl px-4 py-3 text-sm text-zinc-200 resize-none"
                />
              </div>

              {/* Status toggle */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-900 rounded-xl border border-zinc-850">
                <div className="text-left">
                  <p className="text-xs font-bold text-zinc-200">Status Aktif</p>
                  <p className="text-[10px] text-zinc-500">Tampilkan hidangan di browser customer</p>
                </div>
                <input
                  type="checkbox"
                  checked={menuActive}
                  onChange={(e) => setMenuActive(e.target.checked)}
                  className="w-5 h-5 rounded accent-brand-amber border-zinc-800 bg-zinc-900"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submittingMenu}
                className="w-full bg-brand-amber hover:bg-brand-gold text-brand-dark disabled:bg-zinc-800 disabled:text-zinc-605 font-black py-4.5 rounded-xl text-xs uppercase tracking-wider transition-all mt-2 cursor-pointer flex items-center justify-center gap-2"
              >
                {submittingMenu ? (
                  <>
                    <div className="w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></div>
                    <span>Menyimpan Item...</span>
                  </>
                ) : (
                  <span>{editingMenu ? "Perbarui Item" : "Tambahkan Item Baru"}</span>
                )}
              </button>
            </form>
          </div>
        </>
      )}

      {/* 2. Category Modal */}
      {categoryModalOpen && (
        <>
          <div onClick={() => setCategoryModalOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-sm w-full p-6 bg-zinc-950 border border-zinc-900 rounded-3xl shadow-2xl z-50 animate-fade-in flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <h3 className="font-black text-base text-white">Tambah Kategori Baru</h3>
              <button onClick={() => setCategoryModalOpen(false)} className="p-1 rounded-lg bg-zinc-900 border border-zinc-850 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Nama Kategori</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Mocktail, Seafood"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 focus:border-brand-amber/40 focus:outline-none rounded-xl px-4 py-3 text-sm text-zinc-200"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-amber hover:bg-brand-gold text-brand-dark font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Simpan Kategori
              </button>
            </form>
          </div>
        </>
      )}

      {/* 3. Promo Modal */}
      {promoModalOpen && (
        <>
          <div onClick={() => setPromoModalOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-full p-6 bg-zinc-950 border border-zinc-900 rounded-3xl shadow-2xl z-50 animate-fade-in flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <h3 className="font-black text-base text-white">
                {editingPromo ? "Ubah Banner Promo" : "Tambah Banner Promo Baru"}
              </h3>
              <button onClick={() => setPromoModalOpen(false)} className="p-1 rounded-xl bg-zinc-900 border border-zinc-850 text-zinc-450">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="flex flex-col gap-4">
              {/* Promo Title */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Deskripsi Promo *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Diskon 15% setiap pembelian Matcha Latte"
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 focus:border-brand-amber/40 focus:outline-none rounded-xl px-4 py-3 text-sm text-zinc-200"
                />
              </div>

              {/* Promo Banner Image */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">URL Gambar Banner *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={promoImage}
                  onChange={(e) => setPromoImage(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 focus:border-brand-amber/40 focus:outline-none rounded-xl px-4 py-3 text-sm text-zinc-200"
                />
              </div>

              {/* Promo Active */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-900 rounded-xl border border-zinc-855">
                <div className="text-left">
                  <p className="text-xs font-bold text-zinc-200">Tampilkan Promo</p>
                  <p className="text-[10px] text-zinc-500">Tampilkan banner di halaman atas customer</p>
                </div>
                <input
                  type="checkbox"
                  checked={promoActive}
                  onChange={(e) => setPromoActive(e.target.checked)}
                  className="w-5 h-5 rounded accent-brand-amber border-zinc-800 bg-zinc-900"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-brand-amber hover:bg-brand-gold text-brand-dark font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                {editingPromo ? "Perbarui Banner" : "Simpan Banner"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminMenuManagement;
