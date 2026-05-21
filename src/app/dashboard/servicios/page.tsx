"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Servicio } from "@/types/database";
import { Scissors, Banknote, Clock, ClipboardList, Search, X } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrecio(precio: number) {
  return `$${precio.toLocaleString("es-CO")}`;
}

function formatDuracion(minutos: number) {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

// ── Modal ─────────────────────────────────────────────────────────────────────

const DURACIONES_RAPIDAS = [15, 20, 30, 45, 60, 90, 120];

interface ServicioForm {
  nombre: string;
  descripcion: string;
  duracion_minutos: number;
  precio: number;
}

interface ModalProps {
  servicio: Servicio | null;
  onClose: () => void;
  onSave: (data: ServicioForm) => Promise<void>;
  saving: boolean;
}

function ServicioModal({ servicio, onClose, onSave, saving }: ModalProps) {
  const [form, setForm] = useState<ServicioForm>({
    nombre:           servicio?.nombre           ?? "",
    descripcion:      servicio?.descripcion       ?? "",
    duracion_minutos: servicio?.duracion_minutos  ?? 30,
    precio:           servicio?.precio            ?? 0,
  });
  const [error, setError] = useState("");

  function set<K extends keyof ServicioForm>(key: K, value: ServicioForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (form.duracion_minutos < 5) { setError("La duración mínima es 5 minutos."); return; }
    if (form.precio < 0) { setError("El precio no puede ser negativo."); return; }
    setError("");
    await onSave({ ...form, nombre: form.nombre.trim(), descripcion: form.descripcion.trim() });
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
        className="w-full max-w-md rounded-2xl border border-line bg-card p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">{servicio ? "Editar servicio" : "Nuevo servicio"}</h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-ink-2 mb-1.5">Nombre <span className="text-gold">*</span></label>
            <input
              type="text" value={form.nombre} onChange={(e) => set("nombre", e.target.value)}
              placeholder="Ej: Corte clásico" autoFocus
              className="w-full rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-ink-2 mb-1.5">Descripción <span className="text-ink-4 text-xs">(opcional)</span></label>
            <textarea
              value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)}
              placeholder="Describe el servicio brevemente..." rows={2}
              className="w-full rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-ink-2 mb-1.5">Duración <span className="text-gold">*</span></label>
            <div className="flex flex-wrap gap-2 mb-2">
              {DURACIONES_RAPIDAS.map((d) => (
                <button key={d} type="button" onClick={() => set("duracion_minutos", d)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    form.duracion_minutos === d ? "bg-gold text-zinc-950" : "border border-line-2 text-ink-2 hover:border-zinc-500 hover:text-ink"
                  }`}>
                  {formatDuracion(d)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number" value={form.duracion_minutos}
                onChange={(e) => set("duracion_minutos", Math.max(5, parseInt(e.target.value) || 5))}
                min={5} max={480}
                className="w-24 rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm text-ink outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-center"
              />
              <span className="text-sm text-ink-3">minutos</span>
              <span className="text-sm text-ink-4 ml-auto">= {formatDuracion(form.duracion_minutos)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-ink-2 mb-1.5">Precio (COP) <span className="text-gold">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3 text-sm font-medium">$</span>
              <input
                type="number" value={form.precio}
                onChange={(e) => set("precio", Math.max(0, parseInt(e.target.value) || 0))}
                min={0} placeholder="0"
                className="w-full rounded-xl border border-line-2 bg-chip pl-8 pr-4 py-3 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
              />
            </div>
            {form.precio > 0 && <p className="mt-1 text-xs text-ink-4">{formatPrecio(form.precio)} COP</p>}
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </motion.p>
          )}

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-line-2 py-3 text-sm font-semibold text-ink-2 hover:border-zinc-500 hover:text-ink transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving || !form.nombre.trim()}
              className="flex-[2] rounded-xl bg-gold py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100">
              {saving ? "Guardando..." : servicio ? "Guardar cambios" : "Crear servicio"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div className="mb-2 text-ink-2">{icon}</div>
      <div className="text-xl font-bold text-ink">{value}</div>
      <div className="text-xs text-ink-3 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-ink-4 mt-1">{sub}</div>}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

type Filtro = "todos" | "activos" | "inactivos";
type Orden = "nombre" | "precio_asc" | "precio_desc" | "duracion";

export default function ServiciosPage() {
  const router = useRouter();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createClient(), []);

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [barberia, setBarberia] = useState<{ id: string; nombre: string } | null>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);
  const [showModal, setShowModal]     = useState(false);
  const [editando, setEditando] = useState<Servicio | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [orden, setOrden] = useState<Orden>("nombre");

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: bar } = await supabase.from("barberias").select("id, nombre").eq("owner_id", user.id).single();
      if (!bar) { router.push("/onboarding"); return; }
      setBarberia(bar);
      await cargarServicios(bar.id);
      setLoadingData(false);
    }
    cargar();
  }, []);

  async function cargarServicios(barberiaId: string) {
    const { data, error } = await supabase
      .from("servicios")
      .select("*")
      .eq("barberia_id", barberiaId)
      .order("created_at", { ascending: true });
    if (error) {
      setErrorMsg(`Error: ${error.message} (${error.code})`);
    } else {
      setErrorMsg(null);
    }
    setServicios(data ?? []);
  }

  // ── Stats calculadas ──
  const stats = useMemo(() => {
    const activos = servicios.filter((s) => s.activo);
    const precios = servicios.filter((s) => s.precio > 0).map((s) => Number(s.precio));
    const duraciones = servicios.map((s) => s.duracion_minutos);
    return {
      total: servicios.length,
      activos: activos.length,
      precioPromedio: precios.length ? Math.round(precios.reduce((a, b) => a + b, 0) / precios.length) : 0,
      precioMax: precios.length ? Math.max(...precios) : 0,
      duracionPromedio: duraciones.length ? Math.round(duraciones.reduce((a, b) => a + b, 0) / duraciones.length) : 0,
    };
  }, [servicios]);

  // ── Lista filtrada y ordenada ──
  const serviciosFiltrados = useMemo(() => {
    let lista = [...servicios];

    if (filtro === "activos")   lista = lista.filter((s) => s.activo);
    if (filtro === "inactivos") lista = lista.filter((s) => !s.activo);

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter((s) => s.nombre.toLowerCase().includes(q) || s.descripcion?.toLowerCase().includes(q));
    }

    if (orden === "nombre")       lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
    if (orden === "precio_asc")   lista.sort((a, b) => Number(a.precio) - Number(b.precio));
    if (orden === "precio_desc")  lista.sort((a, b) => Number(b.precio) - Number(a.precio));
    if (orden === "duracion")     lista.sort((a, b) => a.duracion_minutos - b.duracion_minutos);

    return lista;
  }, [servicios, filtro, busqueda, orden]);

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleGuardar(form: ServicioForm) {
    if (!barberia) return;
    setSaving(true);
    try {
      if (editando) {
        const { error } = await supabase.from("servicios").update({ ...form, descripcion: form.descripcion || null }).eq("id", editando.id);
        if (error) throw error;
        mostrarToast("Servicio actualizado");
      } else {
        const { error } = await supabase.from("servicios").insert({ ...form, barberia_id: barberia.id, descripcion: form.descripcion || null });
        if (error) throw error;
        mostrarToast("Servicio creado");
      }
      await cargarServicios(barberia.id);
      setShowModal(false);
      setEditando(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string, activo: boolean) {
    if (!barberia) return;
    await supabase.from("servicios").update({ activo: !activo }).eq("id", id);
    await cargarServicios(barberia.id);
    mostrarToast(activo ? "Servicio desactivado" : "Servicio activado");
  }

  async function handleEliminar(id: string) {
    if (!barberia) return;
    await supabase.from("servicios").delete().eq("id", id);
    await cargarServicios(barberia.id);
    setConfirmDeleteId(null);
    mostrarToast("Servicio eliminado");
  }

  function abrirAgregar() { setEditando(null); setShowModal(true); }
  function abrirEditar(s: Servicio) { setEditando(s); setShowModal(true); }

  return (
    <div className="min-h-screen bg-base text-ink">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb + título */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-ink-3 mb-1">
              <Link href="/dashboard" className="hover:text-ink-2 transition-colors">Dashboard</Link>
              <span>/</span>
              <span className="text-ink-2">Servicios</span>
            </div>
            <h1 className="text-2xl font-bold">Servicios</h1>
          </div>
          <button onClick={abrirAgregar}
            className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-[1.02]">
            <span className="text-base leading-none">+</span> Nuevo servicio
          </button>
        </div>

        {loadingData ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-line-2 border-t-gold animate-spin" />
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400">
                <strong className="font-semibold">Error al cargar servicios:</strong> {errorMsg}
              </div>
            )}
            {/* Stats */}
            {servicios.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
              >
                <StatCard icon={<Scissors className="w-6 h-6" />} label="Total servicios" value={String(stats.total)}
                  sub={`${stats.activos} activo${stats.activos !== 1 ? "s" : ""}`} />
                <StatCard icon={<Banknote className="w-6 h-6" />} label="Precio promedio"
                  value={stats.precioPromedio > 0 ? formatPrecio(stats.precioPromedio) : "—"}
                  sub={stats.precioMax > 0 ? `Máx ${formatPrecio(stats.precioMax)}` : undefined} />
                <StatCard icon={<Clock className="w-6 h-6" />} label="Duración promedio"
                  value={stats.duracionPromedio > 0 ? formatDuracion(stats.duracionPromedio) : "—"} />
                <StatCard icon={<ClipboardList className="w-6 h-6" />} label="Catálogo público"
                  value={`${stats.activos} servicio${stats.activos !== 1 ? "s" : ""}`}
                  sub="visibles para clientes" />
              </motion.div>
            )}

            {servicios.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="mb-4 text-ink-3"><Scissors className="w-12 h-12 mx-auto" /></div>
                <h3 className="text-lg font-semibold mb-2">Sin servicios aún</h3>
                <p className="text-ink-3 text-sm mb-6 max-w-xs">
                  Agrega los cortes y servicios que ofrece tu barbería con sus precios y tiempos.
                </p>
                <button onClick={abrirAgregar}
                  className="rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-[1.02]">
                  Crear primer servicio
                </button>
              </motion.div>
            ) : (
              <>
                {/* Buscador + filtros + orden */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  {/* Búsqueda */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 w-4 h-4" />
                    <input
                      type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar servicio..."
                      className="w-full rounded-xl border border-line bg-card pl-9 pr-4 py-2.5 text-sm text-ink placeholder-ink-3 outline-none focus:border-zinc-600 transition-colors"
                    />
                    {busqueda && (
                      <button onClick={() => setBusqueda("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Filtro estado */}
                  <div className="flex rounded-xl border border-line bg-card p-1 gap-1">
                    {([["todos", "Todos"], ["activos", "Activos"], ["inactivos", "Inactivos"]] as [Filtro, string][]).map(([val, label]) => (
                      <button key={val} onClick={() => setFiltro(val)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                          filtro === val ? "bg-zinc-700 text-ink" : "text-ink-3 hover:text-ink-2"
                        }`}>
                        {label}
                        {val === "todos" && <span className="ml-1.5 text-ink-4">{servicios.length}</span>}
                        {val === "activos" && <span className="ml-1.5 text-ink-4">{stats.activos}</span>}
                        {val === "inactivos" && <span className="ml-1.5 text-ink-4">{servicios.length - stats.activos}</span>}
                      </button>
                    ))}
                  </div>

                  {/* Orden */}
                  <select
                    value={orden} onChange={(e) => setOrden(e.target.value as Orden)}
                    className="rounded-xl border border-line bg-card px-3 py-2.5 text-xs text-ink-2 outline-none focus:border-zinc-600 transition-colors"
                  >
                    <option value="nombre">Ordenar: A–Z</option>
                    <option value="precio_asc">Precio: menor a mayor</option>
                    <option value="precio_desc">Precio: mayor a menor</option>
                    <option value="duracion">Duración</option>
                  </select>
                </div>

                {/* Sin resultados de búsqueda */}
                {serviciosFiltrados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-3 text-ink-3"><Search className="w-10 h-10 mx-auto" /></div>
                    <p className="text-ink-3 text-sm">
                      No se encontraron servicios{busqueda ? ` para "${busqueda}"` : ""}.
                    </p>
                    <button onClick={() => { setBusqueda(""); setFiltro("todos"); }}
                      className="mt-3 text-xs text-gold hover:text-amber-400 transition-colors">
                      Limpiar filtros
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Tabla desktop */}
                    <div className="hidden sm:block rounded-2xl border border-line overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-line bg-card/80">
                            <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-3 uppercase tracking-wider w-8">#</th>
                            <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-3 uppercase tracking-wider">Servicio</th>
                            <th className="text-center px-5 py-3.5 text-xs font-semibold text-ink-3 uppercase tracking-wider">Duración</th>
                            <th className="text-right px-5 py-3.5 text-xs font-semibold text-ink-3 uppercase tracking-wider">Precio</th>
                            <th className="text-center px-5 py-3.5 text-xs font-semibold text-ink-3 uppercase tracking-wider">Estado</th>
                            <th className="px-5 py-3.5 w-64" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 bg-card">
                          <AnimatePresence mode="popLayout">
                            {serviciosFiltrados.map((s, i) => (
                              <motion.tr key={s.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className={`group transition-colors hover:bg-chip/40 ${!s.activo ? "opacity-50" : ""}`}>
                                <td className="px-5 py-4 text-line-2 text-xs">{i + 1}</td>
                                <td className="px-5 py-4">
                                  <div className="font-medium text-ink">{s.nombre}</div>
                                  {s.descripcion && <div className="text-xs text-ink-3 mt-0.5 max-w-xs truncate">{s.descripcion}</div>}
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-chip px-2.5 py-1 text-xs text-ink-2">
                                    <Clock className="w-3.5 h-3.5" /> {formatDuracion(s.duracion_minutos)}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <span className={`font-semibold ${Number(s.precio) === 0 ? "text-ink-3" : "text-gold"}`}>
                                    {Number(s.precio) === 0 ? "Gratis" : formatPrecio(Number(s.precio))}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    s.activo ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-chip text-ink-3 border border-line-2"
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${s.activo ? "bg-green-400" : "bg-zinc-600"}`} />
                                    {s.activo ? "Activo" : "Inactivo"}
                                  </span>
                                </td>
                                <td className="px-5 py-4">
                                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => abrirEditar(s)}
                                      className="rounded-lg border border-line-2 px-3 py-1.5 text-xs text-ink-2 hover:border-zinc-500 hover:text-ink transition-colors">
                                      Editar
                                    </button>
                                    <button onClick={() => handleToggle(s.id, s.activo)}
                                      className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                                        s.activo ? "border-line-2 text-ink-2 hover:border-zinc-500 hover:text-ink" : "border-gold/30 text-gold hover:border-gold"
                                      }`}>
                                      {s.activo ? "Desactivar" : "Activar"}
                                    </button>
                                    {confirmDeleteId === s.id ? (
                                      <div className="flex gap-1">
                                        <button onClick={() => setConfirmDeleteId(null)}
                                          className="rounded-lg border border-line-2 px-3 py-1.5 text-xs text-ink-2 hover:text-ink transition-colors">
                                          Cancelar
                                        </button>
                                        <button onClick={() => handleEliminar(s.id)}
                                          className="rounded-lg bg-red-500/20 border border-red-500/40 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/30 transition-colors">
                                          Confirmar
                                        </button>
                                      </div>
                                    ) : (
                                      <button onClick={() => setConfirmDeleteId(s.id)}
                                        className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink-4 hover:border-red-500/40 hover:text-red-400 transition-colors">
                                        Eliminar
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>

                    {/* Cards móvil */}
                    <div className="sm:hidden flex flex-col gap-3">
                      <AnimatePresence mode="popLayout">
                        {serviciosFiltrados.map((s) => (
                          <motion.div key={s.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className={`rounded-2xl border border-line bg-card p-4 ${!s.activo ? "opacity-50" : ""}`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate">{s.nombre}</h3>
                                {s.descripcion && <p className="text-xs text-ink-3 mt-0.5 line-clamp-2">{s.descripcion}</p>}
                              </div>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0 ml-2 ${
                                s.activo ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-chip text-ink-3 border border-line-2"
                              }`}>
                                <span className={`w-1 h-1 rounded-full ${s.activo ? "bg-green-400" : "bg-zinc-600"}`} />
                                {s.activo ? "Activo" : "Inactivo"}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 mb-3 text-sm">
                              <span className="inline-flex items-center gap-1 rounded-lg bg-chip px-2 py-0.5 text-xs text-ink-2">
                                🕐 {formatDuracion(s.duracion_minutos)}
                              </span>
                              <span className={`font-bold ${Number(s.precio) === 0 ? "text-ink-3 text-xs" : "text-gold text-sm"}`}>
                                {Number(s.precio) === 0 ? "Gratis" : formatPrecio(Number(s.precio))}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <button onClick={() => abrirEditar(s)} className="flex-1 rounded-xl border border-line-2 py-2 text-xs font-semibold text-ink-2 hover:text-ink transition-colors">Editar</button>
                              <button onClick={() => handleToggle(s.id, s.activo)}
                                className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors ${
                                  s.activo ? "border-line-2 text-ink-2 hover:text-ink" : "border-gold/30 text-gold"
                                }`}>
                                {s.activo ? "Desactivar" : "Activar"}
                              </button>
                              {confirmDeleteId === s.id ? (
                                <>
                                  <button onClick={() => setConfirmDeleteId(null)} className="flex-1 rounded-xl border border-line-2 py-2 text-xs text-ink-2">Cancelar</button>
                                  <button onClick={() => handleEliminar(s.id)} className="flex-1 rounded-xl bg-red-500/20 border border-red-500/40 py-2 text-xs text-red-400">Confirmar</button>
                                </>
                              ) : (
                                <button onClick={() => setConfirmDeleteId(s.id)} className="flex-1 rounded-xl border border-line py-2 text-xs text-ink-4 hover:text-red-400 transition-colors">Eliminar</button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Footer de tabla */}
                    <div className="mt-4 flex items-center justify-between text-xs text-ink-4">
                      <span>
                        {serviciosFiltrados.length} resultado{serviciosFiltrados.length !== 1 ? "s" : ""}
                        {(busqueda || filtro !== "todos") && ` · ${servicios.length} en total`}
                      </span>
                      {stats.precioMax > 0 && (
                        <span>Ingreso potencial por cliente: {formatPrecio(stats.precioMax)} COP</span>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <ServicioModal
            servicio={editando}
            onClose={() => { setShowModal(false); setEditando(null); }}
            onSave={handleGuardar}
            saving={saving}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl border border-line-2 bg-card px-5 py-3 text-sm font-medium shadow-xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
