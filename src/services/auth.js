import { auth, isFirebaseActive } from "../firebaseConfig";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

// Mock Auth State
let mockUser = JSON.parse(localStorage.getItem("menuflow_mock_user")) || null;
const authListeners = new Set();

const triggerAuthListeners = () => {
  authListeners.forEach(callback => callback(mockUser));
};

export const authService = {
  isMock: !isFirebaseActive,

  // Login
  login: async (email, password) => {
    if (isFirebaseActive) {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } else {
      // Mock validation
      if (email === "admin@menuflow.com" && password === "password123") {
        mockUser = { email, uid: "mock-admin-uid", displayName: "MenuFlow Admin" };
        localStorage.setItem("menuflow_mock_user", JSON.stringify(mockUser));
        triggerAuthListeners();
        return mockUser;
      } else {
        throw new Error("Email atau password salah. (Gunakan admin@menuflow.com / password123)");
      }
    }
  },

  // Logout
  logout: async () => {
    if (isFirebaseActive) {
      await signOut(auth);
    } else {
      mockUser = null;
      localStorage.removeItem("menuflow_mock_user");
      triggerAuthListeners();
    }
  },

  // Subscribe to auth state changes
  onAuthStateChange: (callback) => {
    if (isFirebaseActive) {
      return onAuthStateChanged(auth, callback);
    } else {
      authListeners.add(callback);
      // Immediately invoke with current mock state
      callback(mockUser);
      return () => {
        authListeners.delete(callback);
      };
    }
  },

  // Get current user synchronous
  getCurrentUser: () => {
    if (isFirebaseActive) {
      return auth?.currentUser || null;
    } else {
      return mockUser;
    }
  }
};
