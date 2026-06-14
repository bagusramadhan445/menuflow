import { db, storage, isFirebaseActive } from "../firebaseConfig";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  getDocs, 
  setDoc,
  getDoc,
  where
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- DEFAULT SEED DATA ---
const DEFAULT_CATEGORIES = [
  { id: "makanan", name: "Makanan Utama", slug: "makanan" },
  { id: "minuman", name: "Minuman Segar", slug: "minuman" },
  { id: "camilan", name: "Camilan / Snack", slug: "camilan" },
  { id: "dessert", name: "Dessert & Roti", slug: "dessert" }
];

const DEFAULT_MENUS = [
  {
    name: "Nasi Goreng Spesial",
    category: "makanan",
    price: 28000,
    description: "Nasi goreng premium dengan telur mata sapi, sate ayam, acar segar, dan kerupuk udang renyah.",
    imageUrl: "https://images.unsplash.com/photo-1603133872878-685f586b641d?auto=format&fit=crop&w=600&q=80",
    isActive: true
  },
  {
    name: "Mie Goreng Jawa",
    category: "makanan",
    price: 24000,
    description: "Mie telur kenyal dengan bumbu rempah khas Jawa, irisan daging ayam, bakso, dan sayuran segar.",
    imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80",
    isActive: true
  },
  {
    name: "Ayam Bakar Madu",
    category: "makanan",
    price: 35000,
    description: "Ayam bakar bumbu madu gurih manis, disajikan dengan nasi putih hangat, sambal terasi, dan lalapan lengkap.",
    imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3e73ae83b?auto=format&fit=crop&w=600&q=80",
    isActive: true
  },
  {
    name: "Es Teh Manis Jasmine",
    category: "minuman",
    price: 6000,
    description: "Es teh manis segar beraroma bunga melati pilihan, penghilang dahaga terbaik.",
    imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80",
    isActive: true
  },
  {
    name: "Matcha Green Tea Latte",
    category: "minuman",
    price: 22000,
    description: "Matcha Jepang murni dipadukan dengan susu segar premium dan pemanis alami.",
    imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80",
    isActive: true
  },
  {
    name: "Kopi Susu Gula Aren",
    category: "minuman",
    price: 18000,
    description: "Kopi espresso arabika dicampur susu cair segar dan sirup gula aren murni khas Nusantara.",
    imageUrl: "https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?auto=format&fit=crop&w=600&q=80",
    isActive: true
  },
  {
    name: "Kentang Goreng Crispy",
    category: "camilan",
    price: 15000,
    description: "Kentang goreng renyah bumbu bawang gurih, disajikan dengan saus sambal dan mayones.",
    imageUrl: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80",
    isActive: true
  },
  {
    name: "Dimsum Ayam Premium",
    category: "camilan",
    price: 20000,
    description: "Dimsum ayam kukus bertekstur lembut dan padat, isi 4 pcs dengan cocolan chili oil pedas gurih.",
    imageUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
    isActive: true
  },
  {
    name: "Pisang Bakar Cokelat Keju",
    category: "dessert",
    price: 17000,
    description: "Pisang raja bakar ditaburi cokelat meses melimpah, parutan keju cheddar gurih, dan kental manis.",
    imageUrl: "https://images.unsplash.com/photo-1584949514123-4755f74c2f67?auto=format&fit=crop&w=600&q=80",
    isActive: true
  },
  {
    name: "Croissant Butter Hangat",
    category: "dessert",
    price: 22000,
    description: "Roti pastry asal Perancis bertekstur flaky, renyah di luar dan lembut mentega di dalam.",
    imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
    isActive: true
  }
];

const DEFAULT_PROMOS = [
  {
    id: "promo1",
    title: "Diskon 20% Akhir Pekan khusus pembelian Nasi Goreng & Kopi Gula Aren!",
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    isActive: true
  },
  {
    id: "promo2",
    title: "Makan Bareng Bestie: Dapatkan Free Dimsum untuk transaksi di atas Rp 100.000!",
    imageUrl: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=1200&q=80",
    isActive: true
  }
];

// --- LOCAL STORAGE MOCK SYSTEM CONTROLLER ---
const getLocalData = (key) => JSON.parse(localStorage.getItem(key)) || [];
const setLocalData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

const mockListeners = {
  menus: new Set(),
  categories: new Set(),
  promos: new Set(),
  orders: new Set()
};

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === "menuflow_orders") {
      notifyMockListeners("orders");
    }
  });
}

const notifyMockListeners = (collectionName) => {
  const data = getLocalData(`menuflow_${collectionName}`);
  mockListeners[collectionName].forEach(callback => callback(data));
};

// --- DATA SERVICE OBJECT ---
export const dbService = {
  isMock: !isFirebaseActive,

  // Seed default data if database is empty
  seedDefaultData: async () => {
    if (isFirebaseActive) {
      try {
        // Check categories
        const catSnap = await getDocs(collection(db, "categories"));
        if (catSnap.empty) {
          console.log("🌱 Seeding Firebase Categories...");
          for (const cat of DEFAULT_CATEGORIES) {
            await setDoc(doc(db, "categories", cat.id), { name: cat.name, slug: cat.slug, createdAt: new Date() });
          }
        }

        // Check menus
        const menuSnap = await getDocs(collection(db, "menus"));
        if (menuSnap.empty) {
          console.log("🌱 Seeding Firebase Menus...");
          for (const item of DEFAULT_MENUS) {
            await addDoc(collection(db, "menus"), { ...item, createdAt: new Date() });
          }
        }

        // Check promos
        const promoSnap = await getDocs(collection(db, "promos"));
        if (promoSnap.empty) {
          console.log("🌱 Seeding Firebase Promos...");
          for (const promo of DEFAULT_PROMOS) {
            await setDoc(doc(db, "promos", promo.id), { title: promo.title, imageUrl: promo.imageUrl, isActive: promo.isActive, createdAt: new Date() });
          }
        }
      } catch (error) {
        console.error("❌ Seeding database failed:", error);
      }
    } else {
      // LocalStorage Mock Seeding
      if (getLocalData("menuflow_categories").length === 0) {
        setLocalData("menuflow_categories", DEFAULT_CATEGORIES.map(c => ({ ...c, createdAt: new Date().toISOString() })));
      }
      if (getLocalData("menuflow_menus").length === 0) {
        setLocalData("menuflow_menus", DEFAULT_MENUS.map((m, idx) => ({ ...m, id: `menu_${idx + 1}`, createdAt: new Date().toISOString() })));
      }
      if (getLocalData("menuflow_promos").length === 0) {
        setLocalData("menuflow_promos", DEFAULT_PROMOS.map(p => ({ ...p, createdAt: new Date().toISOString() })));
      }
    }
  },

  // --- CATEGORIES CRUD & SUBSCRIPTIONS ---
  subscribeCategories: (callback) => {
    if (isFirebaseActive) {
      const q = query(collection(db, "categories"), orderBy("name", "asc"));
      return onSnapshot(q, (snapshot) => {
        const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(categories);
      }, (error) => console.error("Categories subscription failed", error));
    } else {
      mockListeners.categories.add(callback);
      callback(getLocalData("menuflow_categories"));
      return () => mockListeners.categories.delete(callback);
    }
  },

  addCategory: async (name) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    if (isFirebaseActive) {
      await setDoc(doc(db, "categories", slug), { name, slug, createdAt: new Date() });
    } else {
      const categories = getLocalData("menuflow_categories");
      if (categories.some(c => c.slug === slug)) throw new Error("Kategori sudah ada!");
      categories.push({ id: slug, name, slug, createdAt: new Date().toISOString() });
      setLocalData("menuflow_categories", categories);
      notifyMockListeners("categories");
    }
  },

  deleteCategory: async (id) => {
    if (isFirebaseActive) {
      await deleteDoc(doc(db, "categories", id));
    } else {
      let categories = getLocalData("menuflow_categories");
      categories = categories.filter(c => c.id !== id);
      setLocalData("menuflow_categories", categories);
      notifyMockListeners("categories");
    }
  },

  // --- MENUS CRUD & SUBSCRIPTIONS ---
  subscribeMenus: (callback) => {
    if (isFirebaseActive) {
      const q = query(collection(db, "menus"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snapshot) => {
        const menus = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(menus);
      });
    } else {
      mockListeners.menus.add(callback);
      callback(getLocalData("menuflow_menus"));
      return () => mockListeners.menus.delete(callback);
    }
  },

  addMenu: async (menuData) => {
    if (isFirebaseActive) {
      await addDoc(collection(db, "menus"), { ...menuData, createdAt: new Date() });
    } else {
      const menus = getLocalData("menuflow_menus");
      const newItem = {
        ...menuData,
        id: `menu_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      menus.push(newItem);
      setLocalData("menuflow_menus", menus);
      notifyMockListeners("menus");
    }
  },

  updateMenu: async (id, menuData) => {
    if (isFirebaseActive) {
      await updateDoc(doc(db, "menus", id), menuData);
    } else {
      const menus = getLocalData("menuflow_menus");
      const index = menus.findIndex(m => m.id === id);
      if (index !== -1) {
        menus[index] = { ...menus[index], ...menuData };
        setLocalData("menuflow_menus", menus);
        notifyMockListeners("menus");
      }
    }
  },

  deleteMenu: async (id) => {
    if (isFirebaseActive) {
      await deleteDoc(doc(db, "menus", id));
    } else {
      let menus = getLocalData("menuflow_menus");
      menus = menus.filter(m => m.id !== id);
      setLocalData("menuflow_menus", menus);
      notifyMockListeners("menus");
    }
  },

  // --- PROMOS CRUD & SUBSCRIPTIONS ---
  subscribePromos: (callback) => {
    if (isFirebaseActive) {
      const q = query(collection(db, "promos"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snapshot) => {
        const promos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(promos);
      });
    } else {
      mockListeners.promos.add(callback);
      callback(getLocalData("menuflow_promos"));
      return () => mockListeners.promos.delete(callback);
    }
  },

  addPromo: async (promoData) => {
    if (isFirebaseActive) {
      await addDoc(collection(db, "promos"), { ...promoData, createdAt: new Date() });
    } else {
      const promos = getLocalData("menuflow_promos");
      const newPromo = {
        ...promoData,
        id: `promo_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      promos.push(newPromo);
      setLocalData("menuflow_promos", promos);
      notifyMockListeners("promos");
    }
  },

  updatePromo: async (id, promoData) => {
    if (isFirebaseActive) {
      await updateDoc(doc(db, "promos", id), promoData);
    } else {
      const promos = getLocalData("menuflow_promos");
      const index = promos.findIndex(p => p.id === id);
      if (index !== -1) {
        promos[index] = { ...promos[index], ...promoData };
        setLocalData("menuflow_promos", promos);
        notifyMockListeners("promos");
      }
    }
  },

  deletePromo: async (id) => {
    if (isFirebaseActive) {
      await deleteDoc(doc(db, "promos", id));
    } else {
      let promos = getLocalData("menuflow_promos");
      promos = promos.filter(p => p.id !== id);
      setLocalData("menuflow_promos", promos);
      notifyMockListeners("promos");
    }
  },

  // --- ORDERS CRUD & SUBSCRIPTIONS ---
  createOrder: async (orderData) => {
    const completeOrder = {
      ...orderData,
      status: "baru",
      createdAt: isFirebaseActive ? new Date() : new Date().toISOString(),
      updatedAt: isFirebaseActive ? new Date() : new Date().toISOString(),
    };

    if (isFirebaseActive) {
      const docRef = await addDoc(collection(db, "orders"), completeOrder);
      return docRef.id;
    } else {
      const orders = getLocalData("menuflow_orders");
      const newId = `order_${Date.now()}`;
      const newOrder = { id: newId, ...completeOrder };
      orders.push(newOrder);
      setLocalData("menuflow_orders", orders);
      notifyMockListeners("orders");
      return newId;
    }
  },

  getOrder: async (orderId) => {
    if (isFirebaseActive) {
      const docRef = doc(db, "orders", orderId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt;
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt;
        return { id: docSnap.id, ...data, createdAt, updatedAt };
      }
      return null;
    } else {
      const orders = getLocalData("menuflow_orders");
      const order = orders.find(o => o.id === orderId);
      if (order) {
        return {
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt)
        };
      }
      return null;
    }
  },

  subscribeOrders: (callback) => {
    if (isFirebaseActive) {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => {
          const data = doc.data();
          // Safe conversion of Firebase timestamp to JS Date
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt;
          const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt;
          return { id: doc.id, ...data, createdAt, updatedAt };
        });
        callback(orders);
      });
    } else {
      mockListeners.orders.add(callback);
      // Map timestamps back to Date objects for consistent APIs
      const orders = getLocalData("menuflow_orders").map(o => ({
        ...o,
        createdAt: new Date(o.createdAt),
        updatedAt: new Date(o.updatedAt)
      })).sort((a, b) => b.createdAt - a.createdAt);
      callback(orders);
      return () => mockListeners.orders.delete(callback);
    }
  },

  updateOrderStatus: async (orderId, status) => {
    const updateData = { 
      status, 
      updatedAt: isFirebaseActive ? new Date() : new Date().toISOString() 
    };

    if (isFirebaseActive) {
      await updateDoc(doc(db, "orders", orderId), updateData);
    } else {
      const orders = getLocalData("menuflow_orders");
      const index = orders.findIndex(o => o.id === orderId);
      if (index !== -1) {
        orders[index] = { ...orders[index], ...updateData };
        setLocalData("menuflow_orders", orders);
        notifyMockListeners("orders");
      }
    }
  },

  uploadMenuImage: async (file) => {
    if (isFirebaseActive) {
      const storageRef = ref(storage, `menu-images/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } else {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    }
  }
};
