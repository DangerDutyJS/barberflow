"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "bf_install_tutorial_v1";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !/Chrome/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

function isAlreadyInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

// ── Visual iOS share button diagram ──────────────────────────────────────────

function IOSShareDiagram() {
  return (
    <div className="relative mx-auto w-64 select-none">
      {/* Fake Safari bottom bar */}
      <div className="rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="w-6 h-6 rounded-md bg-zinc-700 flex items-center justify-center text-zinc-500 text-xs">←</div>
        <div className="w-6 h-6 rounded-md bg-zinc-700 flex items-center justify-center text-zinc-500 text-xs">→</div>
        {/* Share button — highlighted */}
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          className="relative w-8 h-8 rounded-xl bg-gold/20 border-2 border-gold flex items-center justify-center"
        >
          <span className="text-gold text-base">⬆</span>
          {/* Pulse ring */}
          <motion.div
            animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className="absolute inset-0 rounded-xl border border-gold"
          />
        </motion.div>
        <div className="w-6 h-6 rounded-md bg-zinc-700 flex items-center justify-center text-zinc-500 text-xs">⧉</div>
        <div className="w-6 h-6 rounded-md bg-zinc-700 flex items-center justify-center text-zinc-500 text-xs">⋯</div>
      </div>

      {/* Arrow + label */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
        className="flex flex-col items-center mt-2"
      >
        <div className="w-0.5 h-5 bg-gold" />
        <div className="text-xs text-gold font-semibold">Toca aquí</div>
      </motion.div>
    </div>
  );
}

// ── Visual iOS menu item diagram ──────────────────────────────────────────────

function IOSMenuDiagram() {
  return (
    <div className="relative mx-auto w-64 select-none">
      <div className="rounded-2xl border border-zinc-700 bg-zinc-800 overflow-hidden">
        {/* Menu items */}
        {["Copiar", "Favoritos", "Leer más tarde"].map((item) => (
          <div key={item} className="px-4 py-2.5 border-b border-zinc-700 text-sm text-zinc-500 flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-zinc-700" />
            {item}
          </div>
        ))}
        {/* Highlighted item */}
        <motion.div
          animate={{ backgroundColor: ["rgb(39,39,42)", "rgba(212,168,83,0.18)", "rgb(39,39,42)"] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          className="px-4 py-2.5 border-b border-zinc-700 flex items-center gap-3"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="w-6 h-6 rounded-lg bg-gold/20 border border-gold flex items-center justify-center text-gold text-xs"
          >
            ➕
          </motion.div>
          <span className="text-sm font-semibold text-gold">Agregar a inicio</span>
        </motion.div>
        <div className="px-4 py-2.5 text-sm text-zinc-500 flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-zinc-700" />
          Más opciones
        </div>
      </div>
    </div>
  );
}

// ── Desktop address bar diagram ───────────────────────────────────────────────

function DesktopInstallDiagram() {
  return (
    <div className="relative mx-auto w-full max-w-xs select-none">
      {/* Fake address bar */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 flex items-center gap-2">
        <div className="flex-1 rounded-lg bg-zinc-700 h-5 flex items-center px-2">
          <span className="text-xs text-zinc-500 truncate">barber-rylax.vercel.app</span>
        </div>
        {/* Install icon highlighted */}
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          className="relative w-7 h-7 rounded-lg bg-gold/20 border-2 border-gold flex items-center justify-center"
        >
          <span className="text-gold text-sm">⊕</span>
          <motion.div
            animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className="absolute inset-0 rounded-lg border border-gold"
          />
        </motion.div>
      </div>
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 1.4 }}
        className="flex flex-col items-end pr-3 mt-1"
      >
        <div className="w-0.5 h-4 bg-gold ml-auto mr-2.5" />
        <div className="text-xs text-gold font-semibold">Haz clic aquí</div>
      </motion.div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function InstallTutorial() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [step, setStep] = useState(0);
  const [installing, setInstalling] = useState(false);
  const deferredPrompt = useRef<{ prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null>(null);

  useEffect(() => {
    if (isAlreadyInstalled()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const p = detectPlatform();
    setPlatform(p);

    // Capture install prompt for Android/Desktop
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as unknown as typeof deferredPrompt.current;
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Small delay so the prompt has time to fire before showing tutorial
    const t = setTimeout(() => setVisible(true), 800);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(t);
    };
  }, []);

  async function handleInstallNow() {
    if (!deferredPrompt.current) return;
    setInstalling(true);
    try {
      await deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === "accepted") {
        localStorage.setItem(STORAGE_KEY, "done");
        setVisible(false);
      }
    } finally {
      setInstalling(false);
    }
  }

  function finish() {
    localStorage.setItem(STORAGE_KEY, "done");
    setVisible(false);
  }

  function next() {
    if (platform === "ios") {
      if (step < 3) setStep((s) => s + 1);
      else finish();
    } else {
      finish();
    }
  }

  if (!visible) return null;

  // ── Android / Desktop: try to trigger install natively ──────────────────────
  if (platform !== "ios") {
    const canInstall = !!deferredPrompt.current;
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-zinc-950/95 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full max-w-sm sm:rounded-2xl rounded-t-2xl border border-zinc-800 bg-zinc-900 p-8"
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-2xl">✂</span>
              <span className="text-xl font-bold">
                <span className="text-white">Barber</span>
                <span className="text-gold">Flow</span>
              </span>
            </div>

            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: 2, duration: 0.6, delay: 0.4 }}
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gold/10 border border-gold/30 text-4xl"
            >
              📲
            </motion.div>

            <h2 className="text-lg font-bold text-white text-center mb-2">
              Instala BarberFlow como app
            </h2>
            <p className="text-sm text-zinc-400 text-center leading-relaxed mb-6">
              Accede directo desde tu{" "}
              {platform === "android" ? "pantalla de inicio" : "escritorio"}, sin abrir el
              navegador. Se ve y funciona como una app real.
            </p>

            {canInstall ? (
              <button
                onClick={handleInstallNow}
                disabled={installing}
                className="w-full rounded-xl bg-gold py-3.5 text-sm font-bold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-[1.02] disabled:opacity-60 mb-3"
              >
                {installing ? "Instalando..." : "Instalar ahora →"}
              </button>
            ) : (
              <>
                <DesktopInstallDiagram />
                <p className="text-xs text-zinc-500 text-center mt-3 mb-4">
                  Haz clic en el ícono <span className="text-gold font-bold">⊕</span> en la barra de direcciones
                </p>
                <button
                  onClick={finish}
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 py-3.5 text-sm font-semibold text-white hover:border-gold hover:text-gold transition-all mb-3"
                >
                  Ya la instalé ✓
                </button>
              </>
            )}

            <button onClick={finish} className="w-full text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-1">
              Instalar después
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── iOS: visual step-by-step guide ─────────────────────────────────────────
  const iosSteps = [
    {
      title: "Instala BarberFlow en tu iPhone",
      desc: "Agrégala a tu pantalla de inicio para usarla como una app real, sin abrir Safari cada vez.",
      visual: (
        <div className="text-5xl mx-auto w-fit">📱</div>
      ),
      btn: "Empezar →",
    },
    {
      title: "1. Toca el botón Compartir",
      desc: "En Safari, toca el botón de compartir en la barra inferior (centro). Es el cuadrado con la flecha.",
      visual: <IOSShareDiagram />,
      btn: "Siguiente →",
    },
    {
      title: "2. Toca «Agregar a inicio»",
      desc: "Desplázate en el menú hasta ver «Agregar a pantalla de inicio» y tócalo.",
      visual: <IOSMenuDiagram />,
      btn: "Siguiente →",
    },
    {
      title: "3. Toca «Agregar»",
      desc: "En la esquina superior derecha del popup que aparece, toca «Agregar». ¡Listo!",
      visual: (
        <div className="mx-auto w-64 rounded-2xl border border-zinc-700 bg-zinc-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-blue-400">Cancelar</span>
            <span className="text-sm text-zinc-300 font-medium">Agregar a inicio</span>
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              className="text-xs font-bold text-gold"
            >
              Agregar
            </motion.span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-zinc-700 flex items-center justify-center text-2xl border border-gold/30">✂</div>
            <span className="text-sm text-white font-medium">BarberFlow</span>
            <span className="text-xs text-zinc-500">barber-rylax.vercel.app</span>
          </div>
        </div>
      ),
      btn: "¡Ya está instalada! →",
    },
  ];

  const current = iosSteps[step];
  const progress = step / (iosSteps.length - 1);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-zinc-950/95 backdrop-blur-sm"
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-sm sm:rounded-2xl rounded-t-2xl border border-zinc-800 bg-zinc-900 p-8"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-2xl">✂</span>
            <span className="text-xl font-bold">
              <span className="text-white">Barber</span>
              <span className="text-gold">Flow</span>
            </span>
          </div>

          <div className="mb-5">{current.visual}</div>

          <h2 className="text-lg font-bold text-white text-center mb-2">{current.title}</h2>
          <p className="text-sm text-zinc-400 text-center leading-relaxed mb-6">{current.desc}</p>

          <button
            onClick={next}
            className={`w-full rounded-xl py-3.5 text-sm font-bold transition-all hover:scale-[1.02] mb-4 ${
              step === iosSteps.length - 1
                ? "bg-gold text-zinc-950 hover:bg-amber-400"
                : "bg-zinc-800 border border-zinc-700 text-white hover:border-gold hover:text-gold"
            }`}
          >
            {current.btn}
          </button>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mb-3">
            {iosSteps.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === step ? "w-6 h-2 bg-gold" : i < step ? "w-2 h-2 bg-gold/40" : "w-2 h-2 bg-zinc-700"
                }`}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gold rounded-full"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
