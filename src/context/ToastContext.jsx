import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from "lucide-react";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 3000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Render Overlay */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start p-4 rounded-xl shadow-glass border backdrop-blur-md animate-fade-in transition-all duration-300 ${
              toast.type === "success"
                ? "bg-zinc-900/95 border-emerald-500/35 text-emerald-100"
                : toast.type === "error"
                ? "bg-zinc-900/95 border-rose-500/35 text-rose-100"
                : toast.type === "warning"
                ? "bg-zinc-900/95 border-amber-500/35 text-amber-100"
                : "bg-zinc-900/95 border-zinc-700/35 text-zinc-100"
            }`}
          >
            <div className="flex-shrink-0 mr-3 mt-0.5">
              {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400" />}
              {toast.type === "error" && <AlertOctagon className="w-5 h-5 text-rose-400" />}
              {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-amber-400" />}
            </div>
            <div className="flex-1 text-sm font-medium leading-tight text-zinc-200">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 ml-3 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
