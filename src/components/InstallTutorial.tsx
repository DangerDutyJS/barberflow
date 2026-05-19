"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "bf_install_tutorial_v1";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
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

interface Step {
  icon: string;
  title: string;
  desc: string;
  hint?: string;
}

const STEPS: Record<Platform, Step[]> = {
  ios: [
    {
      icon: "✂",
      title: "Instala BarberFlow en tu iPhone",
      desc: "Agrega la app a tu pantalla de inicio para acceder rápido, sin abrir el navegador, y usarla como una app nativa.",
      hint: "Solo toma 30 segundos",
    },
    {
      icon: "🧭",
      title: "Paso 1 — Abre en Safari",
      desc: "Esta instalación solo funciona desde Safari. Si estás en Chrome u otro navegador, copia la URL y ábrela en Safari.",
      hint: "La dirección es: barber-rylax.vercel.app",
    },
    {
      icon: "⬆",
      title: "Paso 2 — Toca Compartir",
      desc: "Toca el botón de compartir en la barra inferior de Safari. Es el cuadrado con una flecha apuntando hacia arriba.",
      hint: "Barra inferior → centro",
    },
    {
      icon: "➕",
      title: "Paso 3 — Agregar a pantalla de inicio",
      desc: "Desplázate en el menú hasta encontrar 'Agregar a pantalla de inicio'. Tócalo y luego toca 'Agregar' en la esquina superior derecha.",
      hint: "Ya aparecerá como una app real",
    },
    {
      icon: "🎉",
      title: "¡Listo! Ya tienes BarberFlow instalada",
      desc: "Abre la app desde tu pantalla de inicio. Se verá y funcionará exactamente como una app descargada de la App Store.",
    },
  ],
  android: [
    {
      icon: "✂",
      title: "Instala BarberFlow en tu Android",
      desc: "Agrega la app a tu pantalla de inicio para acceder rápido, sin abrir el navegador, y usarla como una app nativa.",
      hint: "Solo toma 30 segundos",
    },
    {
      icon: "⋮",
      title: "Paso 1 — Toca el menú",
      desc: "En Chrome, toca los tres puntos (⋮) en la esquina superior derecha de la pantalla.",
      hint: "Esquina superior derecha",
    },
    {
      icon: "📲",
      title: "Paso 2 — Instalar app",
      desc: "Busca la opción 'Instalar app' o 'Añadir a pantalla de inicio' en el menú. Tócala.",
      hint: "Puede que aparezca como un banner automático",
    },
    {
      icon: "✔",
      title: "Paso 3 — Confirmar instalación",
      desc: "Toca 'Instalar' o 'Añadir' en el popup que aparece. La app se instalará en tu pantalla de inicio.",
      hint: "Proceso rápido, sin descarga",
    },
    {
      icon: "🎉",
      title: "¡Listo! Ya tienes BarberFlow instalada",
      desc: "Abre la app desde tu pantalla de inicio o cajón de apps. Se verá y funcionará exactamente como una app descargada de Play Store.",
    },
  ],
  desktop: [
    {
      icon: "✂",
      title: "Instala BarberFlow en tu computadora",
      desc: "Agrega la app a tu escritorio o barra de tareas para acceder con un solo clic, sin abrir el navegador.",
      hint: "Compatible con Chrome y Edge",
    },
    {
      icon: "🔍",
      title: "Paso 1 — Busca el ícono de instalación",
      desc: "Mira en la barra de direcciones de Chrome o Edge. A la derecha verás un ícono de instalación (⊕ o ⬇). Haz clic en él.",
      hint: "Barra de URL → extremo derecho",
    },
    {
      icon: "🖥",
      title: "Paso 2 — Instalar BarberFlow",
      desc: "Si no aparece el ícono, ve al menú (⋮) del navegador y busca 'Instalar BarberFlow' o 'Guardar e instalar'. Haz clic.",
      hint: "Menú → Más herramientas → Crear acceso directo",
    },
    {
      icon: "✔",
      title: "Paso 3 — Confirmar",
      desc: "Haz clic en 'Instalar' en el diálogo que aparece. La app se abrirá en su propia ventana y tendrás un acceso directo en el escritorio.",
      hint: "Sin descargas adicionales",
    },
    {
      icon: "🎉",
      title: "¡Listo! BarberFlow está en tu escritorio",
      desc: "Abre la app desde el acceso directo del escritorio o la barra de tareas. Se abrirá sin barra de navegador, como una app real.",
    },
  ],
};

export default function InstallTutorial() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isAlreadyInstalled()) return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (done) return;
    setPlatform(detectPlatform());
    setVisible(true);
  }, []);

  function handleNext() {
    const steps = STEPS[platform];
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      localStorage.setItem(STORAGE_KEY, "done");
      setVisible(false);
    }
  }

  if (!visible) return null;

  const steps = STEPS[platform];
  const current = steps[step];
  const isLast = step === steps.length - 1;
  const isWelcome = step === 0;
  const progress = step / (steps.length - 1);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-zinc-950/95 backdrop-blur-sm"
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.97 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-2xl">✂</span>
            <span className="text-xl font-bold">
              <span className="text-white">Barber</span>
              <span className="text-gold">Flow</span>
            </span>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            {/* Ícono grande */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
              className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl text-4xl ${
                isLast
                  ? "bg-gold/15 border border-gold/30"
                  : isWelcome
                  ? "bg-zinc-800 border border-zinc-700"
                  : "bg-zinc-800 border border-zinc-700"
              }`}
            >
              {current.icon}
            </motion.div>

            {/* Título */}
            <h2 className={`text-lg font-bold mb-3 ${isLast ? "text-gold" : "text-white"}`}>
              {current.title}
            </h2>

            {/* Descripción */}
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              {current.desc}
            </p>

            {/* Hint */}
            {current.hint && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 border border-zinc-700 px-3 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                <span className="text-xs text-zinc-400">{current.hint}</span>
              </div>
            )}

            {/* Botón */}
            <button
              onClick={handleNext}
              className={`w-full rounded-xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.02] ${
                isLast
                  ? "bg-gold text-zinc-950 hover:bg-amber-400"
                  : "bg-zinc-800 border border-zinc-700 text-white hover:border-gold hover:text-gold"
              }`}
            >
              {isLast
                ? "Ir al dashboard →"
                : isWelcome
                ? "Empezar instalación →"
                : "Siguiente →"}
            </button>
          </div>

          {/* Indicador de pasos */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-6 h-2 bg-gold"
                    : i < step
                    ? "w-2 h-2 bg-gold/40"
                    : "w-2 h-2 bg-zinc-700"
                }`}
              />
            ))}
          </div>

          {/* Barra de progreso */}
          <div className="mt-3 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gold rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
