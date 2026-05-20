"use client";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Star, ArrowRight } from "lucide-react";

interface HeroProps {
  isLoggedIn?: boolean;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", delay },
  }),
};

const statVariant: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut", delay },
  }),
};

export default function Hero({ isLoggedIn = false }: HeroProps) {
  return (
    <section className="relative pt-36 pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(212,168,83,0.10),transparent)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMXYxaC0xem0tMTUgMGgxdjFoLTF6bTE1LTE1aDF2MWgtMXptMTUgMGgxdjFoLTF6bS0xNSAxNWgxdjFoLTF6bTE1IDBoMXYxaC0xem0tMTUgMTVoMXYxaC0xem0xNSAwaDF2MWgtMXoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L2c+PC9zdmc+')] opacity-40" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 mb-8"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
          <span className="text-sm text-gold font-medium">La plataforma #1 para barberías</span>
        </motion.div>

        <motion.h1
          custom={0.15}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6"
        >
          Gestiona tu barbería
          <br />
          <span className="text-gold">con inteligencia</span>
        </motion.h1>

        <motion.p
          custom={0.3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-2xl text-lg text-ink-2 leading-relaxed mb-10"
        >
          Agendamiento online, gestión de barberos, pagos y clientes — todo en una plataforma
          moderna. Diseñada para barberías que quieren crecer.
        </motion.p>

        <motion.div
          custom={0.45}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
        >
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-gold px-8 py-3.5 text-base font-semibold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-105 shadow-lg shadow-gold/20"
            >
              Ir a mi dashboard →
            </Link>
          ) : (
            <Link
              href="/auth/login?tab=registro"
              className="rounded-full bg-gold px-8 py-3.5 text-base font-semibold text-zinc-950 hover:bg-amber-400 transition-all hover:scale-105 shadow-lg shadow-gold/20"
            >
              Empezar gratis
            </Link>
          )}
          <a
            href="#como-funciona"
            className="rounded-full border border-line-2 px-8 py-3.5 text-base font-semibold text-ink hover:border-zinc-500 hover:bg-card transition-colors"
          >
            Ver cómo funciona →
          </a>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row gap-10 justify-center items-center"
        >
          {[
            { value: "500+", label: "Barberías activas" },
            { value: "10k+", label: "Citas por mes" },
            { value: "4.9", label: "Calificación promedio", star: true },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={0.6 + i * 0.12}
              variants={statVariant}
              initial="hidden"
              animate="visible"
              className="text-center"
            >
              <div className="text-4xl font-bold text-ink mb-1 flex items-center justify-center gap-1">
                {stat.value}{"star" in stat && stat.star && <Star className="w-6 h-6 text-gold fill-gold" />}
              </div>
              <div className="text-sm text-ink-3">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
