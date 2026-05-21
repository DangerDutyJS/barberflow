"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Barberia } from "@/types/database";
import { PAISES, getDepartamentos, getCiudades } from "@/lib/locations";
import { Scissors } from "lucide-react";

type FormData = Pick<Barberia, "nombre" | "slug" | "descripcion" | "pais" | "departamento" | "ciudad" | "direccion" | "telefono" | "email" | "logo_url">;

export default function ConfiguracionPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [barberia, setBarberia] = useState<Barberia | null>(null);
  const [form, setForm] = useState<FormData>({
    nombre: "", slug: "", descripcion: "", pais: "CO", departamento: "", ciudad: "", direccion: "", telefono: "", email: "", logo_url: "",
  });
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "error" } | null>(null);
  const [slugError, setSlugError] = useState("");

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: bar } = await supabase
        .from("barberias")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (!bar) { router.push("/onboarding"); return; }

      setBarberia(bar);
      setForm({
        nombre: bar.nombre ?? "",
        slug: bar.slug ?? "",
        descripcion: bar.descripcion ?? "",
        pais: bar.pais ?? "CO",
        departamento: bar.departamento ?? "",
        ciudad: bar.ciudad ?? "",
        direccion: bar.direccion ?? "",
        telefono: bar.telefono ?? "",
        email: bar.email ?? "",
        logo_url: bar.logo_url ?? "",
      });
      setLoadingData(false);
    }
    cargar();
  }, []);

  function mostrarToast(msg: string, tipo: "ok" | "error" = "ok") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  }

  function handleSlugChange(val: string) {
    const sanitizado = val.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-");
    setForm((f) => ({ ...f, slug: sanitizado }));
    if (sanitizado.length < 3) {
      setSlugError("Mínimo 3 caracteres.");
    } else if (sanitizado.length > 50) {
      setSlugError("Máximo 50 caracteres.");
    } else {
      setSlugError("");
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !barberia) return;

    if (file.size > 2 * 1024 * 1024) {
      mostrarToast("El archivo no puede superar 2 MB.", "error");
      return;
    }

    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${barberia.id}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("logos").getPublicUrl(path);

      // Añadir cache-bust para forzar recarga de la imagen
      const urlConBust = `${publicUrl}?t=${Date.now()}`;
      setForm((f) => ({ ...f, logo_url: urlConBust }));
      mostrarToast("Logo subido correctamente.");
    } catch {
      mostrarToast("Error al subir el logo. Intenta de nuevo.", "error");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!barberia) return;
    if (!form.nombre.trim()) { mostrarToast("El nombre es obligatorio.", "error"); return; }
    if (slugError) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("barberias")
        .update({
          nombre: form.nombre.trim(),
          slug: form.slug.trim(),
          descripcion: form.descripcion?.trim() || null,
          pais: form.pais || null,
          departamento: form.departamento || null,
          ciudad: form.ciudad || null,
          direccion: form.direccion?.trim() || null,
          telefono: form.telefono?.trim() || null,
          email: form.email?.trim() || null,
          logo_url: form.logo_url?.trim() || null,
        })
        .eq("id", barberia.id);

      if (error) {
        if (error.message.includes("duplicate") || error.message.includes("unique")) {
          mostrarToast("Ese link ya está en uso. Elige otro.", "error");
        } else {
          mostrarToast("Error al guardar. Intenta de nuevo.", "error");
        }
      } else {
        mostrarToast("Cambios guardados correctamente.");
        setBarberia((prev) => prev ? { ...prev, ...form } : prev);
      }
    } finally {
      setSaving(false);
    }
  }

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="min-h-screen bg-base text-ink">
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb + título */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-ink-3 mb-1">
            <Link href="/dashboard" className="hover:text-ink-2 transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-ink-2">Mi barbería</span>
          </div>
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-ink-3 text-sm mt-1">Edita la información pública de tu barbería.</p>
        </div>

        {loadingData ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-line-2 border-t-gold animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleGuardar} className="flex flex-col gap-6">

            {/* Sección — Información básica */}
            <section className="rounded-2xl border border-line bg-card p-6">
              <h2 className="text-sm font-semibold text-ink-2 uppercase tracking-widest mb-5">
                Información básica
              </h2>
              <div className="flex flex-col gap-4">

                <div>
                  <label className="block text-sm text-ink-2 mb-1.5">
                    Nombre de la barbería <span className="text-gold">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    placeholder="Ej: Barbería El Estilo"
                    required
                    className="w-full rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-ink-2 mb-1.5">Descripción</label>
                  <textarea
                    value={form.descripcion ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                    placeholder="Describe tu barbería, especialidades, ambiente..."
                    rows={3}
                    className="w-full rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors resize-none"
                  />
                </div>

                {/* Logo upload */}
                <div>
                  <label className="block text-sm text-ink-2 mb-1.5">Logo</label>
                  <div className="flex items-center gap-4">
                    {/* Preview */}
                    <div className="w-16 h-16 rounded-xl border border-line-2 bg-chip flex items-center justify-center overflow-hidden shrink-0">
                      {form.logo_url ? (
                        <img
                          src={form.logo_url}
                          alt="Logo"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Scissors className="w-7 h-7 text-gold" />
                      )}
                    </div>

                    <div className="flex flex-col gap-2 flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className={`flex items-center justify-center gap-2 rounded-xl border border-line-2 bg-chip px-4 py-2.5 text-sm font-medium text-ink-2 hover:border-gold hover:text-gold transition-colors cursor-pointer ${uploadingLogo ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        {uploadingLogo ? (
                          <>
                            <span className="h-4 w-4 rounded-full border-2 border-zinc-600 border-t-gold animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <span>↑</span>
                            Subir imagen
                          </>
                        )}
                      </label>
                      <p className="text-xs text-ink-4">JPG, PNG, WebP · Máx. 2 MB</p>
                    </div>
                  </div>

                  {/* URL manual como alternativa */}
                  <div className="mt-3">
                    <input
                      type="url"
                      value={form.logo_url ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
                      placeholder="O pega una URL de imagen..."
                      className="w-full rounded-xl border border-line-2 bg-chip px-4 py-2.5 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Sección — Link público */}
            <section className="rounded-2xl border border-line bg-card p-6">
              <h2 className="text-sm font-semibold text-ink-2 uppercase tracking-widest mb-5">
                Link público
              </h2>
              <div>
                <label className="block text-sm text-ink-2 mb-1.5">
                  URL de agendamiento <span className="text-gold">*</span>
                </label>
                <div className="flex items-center rounded-xl border border-line-2 bg-chip overflow-hidden focus-within:border-gold focus-within:ring-1 focus-within:ring-gold transition-colors">
                  <span className="px-3 py-3 text-sm text-ink-3 border-r border-line-2 shrink-0 select-none">
                    /b/
                  </span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="mi-barberia"
                    className="flex-1 bg-transparent px-3 py-3 text-sm text-ink placeholder-ink-3 outline-none"
                  />
                </div>
                {slugError ? (
                  <p className="mt-1.5 text-xs text-red-400">{slugError}</p>
                ) : form.slug ? (
                  <p className="mt-1.5 text-xs text-ink-3">
                    Tu página:{" "}
                    <span className="text-gold font-mono">{appUrl}/b/{form.slug}</span>
                  </p>
                ) : null}
              </div>
            </section>

            {/* Sección — Contacto */}
            <section className="rounded-2xl border border-line bg-card p-6">
              <h2 className="text-sm font-semibold text-ink-2 uppercase tracking-widest mb-5">
                Contacto y ubicación
              </h2>
              <div className="flex flex-col gap-4">
                {/* País */}
                <div>
                  <label className="block text-sm text-ink-2 mb-1.5">País</label>
                  <select
                    value={form.pais ?? "CO"}
                    onChange={(e) => setForm((f) => ({ ...f, pais: e.target.value, departamento: "", ciudad: "" }))}
                    className="w-full rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm text-ink outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                  >
                    {PAISES.map((p) => (
                      <option key={p.codigo} value={p.codigo}>{p.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Departamento */}
                  <div>
                    <label className="block text-sm text-ink-2 mb-1.5">Departamento / Estado</label>
                    {getDepartamentos(form.pais ?? "").length > 0 ? (
                      <select
                        value={form.departamento ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, departamento: e.target.value, ciudad: "" }))}
                        className="w-full rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm text-ink outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                      >
                        <option value="">Selecciona un departamento</option>
                        {getDepartamentos(form.pais ?? "").map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.departamento ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, departamento: e.target.value, ciudad: "" }))}
                        placeholder="Ej: Distrito Capital"
                        className="w-full rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                      />
                    )}
                  </div>

                  {/* Ciudad */}
                  <div>
                    <label className="block text-sm text-ink-2 mb-1.5">Ciudad</label>
                    {getCiudades(form.pais ?? "", form.departamento ?? "").length > 0 ? (
                      <select
                        value={form.ciudad ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))}
                        className="w-full rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm text-ink outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                      >
                        <option value="">Selecciona una ciudad</option>
                        {getCiudades(form.pais ?? "", form.departamento ?? "").map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.ciudad ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))}
                        placeholder="Ej: Bogotá"
                        className="w-full rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                      />
                    )}
                  </div>
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-sm text-ink-2 mb-1.5">Dirección</label>
                  <input
                    type="text"
                    value={form.direccion ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                    placeholder="Calle 10 # 5-20"
                    className="w-full rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-ink-2 mb-1.5">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      value={form.telefono ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                      placeholder="+57 300 000 0000"
                      className="w-full rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-ink-2 mb-1.5">Email de contacto</label>
                    <input
                      type="email"
                      value={form.email ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="barberia@email.com"
                      className="w-full rounded-xl border border-line-2 bg-chip px-4 py-3 text-sm text-ink placeholder-ink-3 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Botón guardar */}
            <div className="flex items-center justify-between">
              <Link
                href="/dashboard"
                className="text-sm text-ink-3 hover:text-ink-2 transition-colors"
              >
                ← Volver al dashboard
              </Link>
              <button
                type="submit"
                disabled={saving || !!slugError || uploadingLogo}
                className="rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-zinc-950/30 border-t-zinc-950 animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  "Guardar cambios"
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl border px-5 py-3 text-sm font-medium shadow-xl ${
              toast.tipo === "error"
                ? "border-red-500/30 bg-card text-red-400"
                : "border-line-2 bg-card text-ink"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
