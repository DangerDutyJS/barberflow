"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type Tab = "login" | "registro";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) setError(decodeURIComponent(err));
    const tabParam = searchParams.get("tab") as Tab | null;
    if (tabParam === "registro") setTab("registro");
  }, [searchParams]);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (tab === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos."
          : error.message);
      } else {
        router.push("/dashboard");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: nombre } },
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess("¡Cuenta creada! Revisa tu email para confirmar tu cuenta.");
      }
    }

    setLoading(false);
  }

  async function handleForgotPassword() {
    if (!email) { setError("Ingresa tu email para restablecer la contraseña."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    });
    if (error) setError(error.message);
    else setSuccess("Te enviamos un email para restablecer tu contraseña. Revisa tu bandeja.");
    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(212,168,83,0.07),transparent)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="text-2xl">✂</span>
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-ink">Barber</span>
            <span className="text-gold">Flow</span>
          </span>
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-line bg-card p-8">
          {/* Tabs */}
          <div className="flex rounded-xl bg-chip p-1 mb-7">
            {(["login", "registro"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); setSuccess(""); }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                  tab === t
                    ? "bg-base text-ink shadow"
                    : "text-ink-3 hover:text-ink-2"
                }`}
              >
                {t === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </button>
            ))}
          </div>

          {/* Botón Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm font-medium text-ink hover:border-zinc-500 hover:bg-zinc-700 transition-all disabled:opacity-50 mb-5"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-chip" />
            <span className="text-xs text-ink-4">o con email</span>
            <div className="flex-1 h-px bg-chip" />
          </div>

          {/* Formulario */}
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            {tab === "registro" && (
              <div>
                <label className="block text-sm text-ink-2 mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="w-full rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm text-ink placeholder-zinc-600 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-ink-2 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm text-ink placeholder-zinc-600 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm text-ink-2">Contraseña</label>
                {tab === "login" && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-gold hover:text-amber-400 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm text-ink placeholder-zinc-600 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                {error}
              </motion.p>
            )}

            {success && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400"
              >
                {success}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-zinc-950 hover:bg-gold-light transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 mt-1"
            >
              {loading
                ? "Cargando..."
                : tab === "login"
                ? "Iniciar sesión"
                : "Crear cuenta"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-4 mt-6">
          <Link href="/" className="hover:text-ink-2 transition-colors">
            ← Volver al inicio
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
