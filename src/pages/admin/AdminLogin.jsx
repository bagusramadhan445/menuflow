import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { LogIn, Mail, Lock, ShieldCheck, HelpCircle } from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/admin");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      addToast("Selamat Datang, Admin MenuFlow!", "success");
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Gagal masuk. Silakan cek email & sandi Anda.");
      addToast(err.message || "Login gagal!", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center px-4 font-sans relative overflow-hidden">
      {/* Background Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-brand-amber/10 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-yellow-500/5 blur-3xl -z-10 pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md glass rounded-3xl p-8 shadow-glass border border-white/5 flex flex-col gap-6">
        
        {/* Title */}
        <div className="text-center">
          <div className="inline-flex p-3 bg-brand-amber/15 rounded-2xl text-brand-amber border border-brand-amber/25 mb-4 animate-bounce" style={{ animationDuration: '3s' }}>
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Menu<span className="text-brand-amber">Flow</span> Admin
          </h2>
          <p className="text-zinc-500 text-xs mt-1.5 font-semibold">Masuk untuk mengelola pesanan & menu digital</p>
        </div>

        {/* Info Callout */}
        <div className="p-3.5 rounded-2xl bg-brand-amber/5 border border-brand-amber/10 flex items-start gap-2.5 text-[11px] leading-relaxed text-brand-amber">
          <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block mb-0.5">Mode Uji Coba / Standar:</span>
            Gunakan email <strong className="font-mono bg-zinc-950 px-1 py-0.5 rounded text-white select-all">admin@menuflow.com</strong> dan kata sandi <strong className="font-mono bg-zinc-950 px-1 py-0.5 rounded text-white select-all">password123</strong> untuk masuk.
          </div>
        </div>

        {error && (
          <div className="p-3 text-xs font-bold text-rose-300 bg-rose-950/20 border border-rose-500/10 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email input */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="email"
              required
              placeholder="Email Admin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800/80 focus:border-brand-amber/40 focus:outline-none rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium text-zinc-200 placeholder-zinc-600 transition-colors"
            />
          </div>

          {/* Password input */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="password"
              required
              placeholder="Kata Sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800/80 focus:border-brand-amber/40 focus:outline-none rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium text-zinc-200 placeholder-zinc-600 transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-amber hover:bg-brand-gold text-brand-dark disabled:bg-zinc-800 disabled:text-zinc-600 font-extrabold py-3.5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-md mt-2 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>Masuk Ke Dashboard</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
