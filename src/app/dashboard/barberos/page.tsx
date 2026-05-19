"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import SignOutButton from "@/components/SignOutButton";
import type { Barbero } from "@/types/database";

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ nombre, fotoUrl, size = 16 }: { nombre: string; fotoUrl: string | null; size?: number }) {
  const initials = nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nombre}
        className={`w-${size} h-${size} rounded-full object-cover border-2 border-line-2`}
      />
    );
  }

  return (
    <div className={`w-${size} h-${size} rounded-full bg-gold/20 border-2 border-gold/40 flex items-center justify-center`}>
      <span className="text-gold font-bold text-lg">{initials}</span>
    </div>
  );
}

// ── Modal agregar / editar ────────────────────────────────────────────────────

interface ModalProps {
  barbero: Barbero | null;
  onClose: () => void;
  onSave: (nombre: string, fotoUrl: string) => Promise<void>;
  saving: boolean;
}

function BarberoModal({ barbero, onClose, onSave, saving }: ModalProps) {
  const [nombre, setNombre] = useState(barbero?.nombre ?? "");
  const [fotoUrl, setFotoUrl] = useState(barbero?.foto_url ?? "");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setError("");
    await onSave(nombre.trim(), fotoUrl.trim());
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-2xl border border-line bg-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">
            {barbero ? "Editar barbero" : "Agregar barbero"}
          </h2>
          <button
            onClick={onClose}
            className="text-ink-3 hover:text-ink transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-ink-2 mb-1.5">
              Nombre <span className="text-gold">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Carlos Mendoza"
              autoFocus
              className="w-full rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-ink-2 mb-1.5">
              URL de foto <span className="text-ink-4 text-xs">(opcional)</span>
            </label>
            <input
              type="url"
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
            />
          </div>

          {nombre && (
            <div className="flex items-center gap-3 rounded-xl border border-line bg-chip/50 p-3">
              <Avatar nombre={nombre} fotoUrl={fotoUrl || null} size={10} />
              <span className="text-sm text-ink-2">{nombre}</span>
            </div>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-line-2 py-3 text-sm font-semibold text-ink-2 hover:border-zinc-500 hover:text-ink transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !nombre.trim()}
              className="flex-[2] rounded-xl bg-gold py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
            >
              {saving ? "Guardando..." : barbero ? "Guardar cambios" : "Agregar barbero"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Card de barbero ───────────────────────────────────────────────────────────

interface CardProps {
  barbero: Barbero;
  onEdit: (b: Barbero) => void;
  onToggle: (id: string, activo: boolean) => void;
  onDelete: (id: string) => void;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
}

function BarberoCard({ barbero, onEdit, onToggle, onDelete, confirmDeleteId, setConfirmDeleteId }: CardProps) {
  const confirmando = confirmDeleteId === barbero.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border bg-card p-5 flex flex-col items-center text-center transition-colors ${
        barbero.activo ? "border-line" : "border-line/50 opacity-60"
      }`}
    >
      <div className="mb-3">
        <Avatar nombre={barbero.nombre} fotoUrl={barbero.foto_url} size={16} />
      </div>

      <h3 className="font-semibold text-ink mb-1 truncate w-full">{barbero.nombre}</h3>

      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium mb-4 ${
        barbero.activo
          ? "bg-green-500/10 text-green-400 border border-green-500/20"
          : "bg-chip text-ink-3 border border-line-2"
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${barbero.activo ? "bg-green-400" : "bg-zinc-600"}`} />
        {barbero.activo ? "Activo" : "Inactivo"}
      </span>

      <div className="w-full flex flex-col gap-2">
        <button
          onClick={() => onEdit(barbero)}
          className="w-full rounded-xl border border-line-2 py-2 text-xs font-semibold text-ink-2 hover:border-zinc-500 hover:text-ink transition-colors"
        >
          Editar
        </button>

        <button
          onClick={() => onToggle(barbero.id, barbero.activo)}
          className={`w-full rounded-xl border py-2 text-xs font-semibold transition-colors ${
            barbero.activo
              ? "border-line-2 text-ink-2 hover:border-zinc-500 hover:text-ink"
              : "border-gold/30 text-gold hover:border-gold hover:bg-gold/5"
          }`}
        >
          {barbero.activo ? "Desactivar" : "Activar"}
        </button>

        {confirmando ? (
          <div className="flex gap-1.5">
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="flex-1 rounded-xl border border-line-2 py-2 text-xs font-semibold text-ink-2 hover:text-ink transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => onDelete(barbero.id)}
              className="flex-1 rounded-xl bg-red-500/20 border border-red-500/40 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Confirmar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDeleteId(barbero.id)}
            className="w-full rounded-xl border border-line py-2 text-xs font-semibold text-ink-4 hover:border-red-500/40 hover:text-red-400 transition-colors"
          >
            Eliminar
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function BarberosPage() {
  const router = useRouter();
  const supabase = createClient();

  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [barberia, setBarberia] = useState<{ id: string; nombre: string } | null>(null);
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBarbero, setEditingBarbero] = useState<Barbero | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario");
      setAvatarUrl(user.user_metadata?.avatar_url ?? null);

      const { data: bar } = await supabase
        .from("barberias")
        .select("id, nombre")
        .eq("owner_id", user.id)
        .single();

      if (!bar) { router.push("/onboarding"); return; }
      setBarberia(bar);

      await cargarBarberos(bar.id);
      setLoadingData(false);
    }
    cargar();
  }, []);

  async function cargarBarberos(barberiaId: string) {
    const { data } = await supabase
      .from("barberos")
      .select("*")
      .eq("barberia_id", barberiaId)
      .order("created_at", { ascending: true });

    setBarberos(data ?? []);
  }

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function abrirAgregar() {
    setEditingBarbero(null);
    setShowModal(true);
  }

  function abrirEditar(barbero: Barbero) {
    setEditingBarbero(barbero);
    setShowModal(true);
  }

  async function handleGuardar(nombre: string, fotoUrl: string) {
    if (!barberia) return;
    setSaving(true);
    try {
      if (editingBarbero) {
        const { error } = await supabase
          .from("barberos")
          .update({ nombre, foto_url: fotoUrl || null })
          .eq("id", editingBarbero.id);
        if (error) throw error;
        mostrarToast("Barbero actualizado");
      } else {
        const { error } = await supabase
          .from("barberos")
          .insert({ barberia_id: barberia.id, nombre, foto_url: fotoUrl || null });
        if (error) throw error;
        mostrarToast("Barbero agregado");
      }
      await cargarBarberos(barberia.id);
      setShowModal(false);
    } catch {
      // el modal muestra su propio error, aquí no hacemos nada
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string, activo: boolean) {
    if (!barberia) return;
    await supabase.from("barberos").update({ activo: !activo }).eq("id", id);
    await cargarBarberos(barberia.id);
    mostrarToast(activo ? "Barbero desactivado" : "Barbero activado");
  }

  async function handleEliminar(id: string) {
    if (!barberia) return;
    await supabase.from("barberos").delete().eq("id", id);
    await cargarBarberos(barberia.id);
    setConfirmDeleteId(null);
    mostrarToast("Barbero eliminado");
  }

  const nombre = userName;

  return (
    <div className="min-h-screen bg-base text-ink">
      {/* Header */}
      <header className="border-b border-line bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">✂</span>
              <span className="text-lg font-bold tracking-tight">
                <span className="text-ink">Barber</span>
                <span className="text-gold">Flow</span>
              </span>
            </Link>
            {barberia && (
              <>
                <span className="hidden sm:block text-line-2">|</span>
                <span className="hidden sm:block text-sm text-ink-2">{barberia.nombre}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt={nombre} className="w-8 h-8 rounded-full border border-line-2" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold text-sm font-bold">
                  {nombre[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm text-ink-2 hidden sm:block">{nombre}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb + título */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-ink-3 mb-1">
              <Link href="/dashboard" className="hover:text-ink-2 transition-colors">Dashboard</Link>
              <span>/</span>
              <span className="text-ink-2">Mis barberos</span>
            </div>
            <h1 className="text-2xl font-bold">Mis barberos</h1>
          </div>

          <button
            onClick={abrirAgregar}
            className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-[1.02]"
          >
            <span className="text-base leading-none">+</span>
            Agregar barbero
          </button>
        </div>

        {/* Contenido */}
        {loadingData ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-line-2 border-t-gold animate-spin" />
          </div>
        ) : barberos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="text-5xl mb-4">✂</div>
            <h3 className="text-lg font-semibold mb-2">Sin barberos aún</h3>
            <p className="text-ink-3 text-sm mb-6 max-w-xs">
              Agrega a tu equipo para empezar a gestionar citas y asignar servicios.
            </p>
            <button
              onClick={abrirAgregar}
              className="rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-[1.02]"
            >
              Agregar primer barbero
            </button>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {barberos.map((b) => (
                <BarberoCard
                  key={b.id}
                  barbero={b}
                  onEdit={abrirEditar}
                  onToggle={handleToggle}
                  onDelete={handleEliminar}
                  confirmDeleteId={confirmDeleteId}
                  setConfirmDeleteId={setConfirmDeleteId}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Contador */}
        {barberos.length > 0 && (
          <p className="mt-6 text-xs text-ink-4">
            {barberos.filter((b) => b.activo).length} activo{barberos.filter((b) => b.activo).length !== 1 ? "s" : ""} ·{" "}
            {barberos.length} en total
          </p>
        )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <BarberoModal
            barbero={editingBarbero}
            onClose={() => setShowModal(false)}
            onSave={handleGuardar}
            saving={saving}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl border border-line-2 bg-card px-5 py-3 text-sm font-medium shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
