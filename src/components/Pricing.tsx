"use client";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Trial",
    price: "Gratis",
    period: "7 días",
    description: "Prueba todas las funciones sin costo.",
    features: [
      "Barberos ilimitados",
      "Citas ilimitadas",
      "Dashboard completo",
      "Agendamiento online",
      "Soporte por email",
    ],
    cta: "Empezar gratis",
    href: "/auth/login?tab=registro",
    highlighted: false,
  },
  {
    name: "Pro Mensual",
    price: "$49.900",
    period: "/ mes COP",
    description: "Para barberías en crecimiento.",
    features: [
      "Barberos ilimitados",
      "Citas ilimitadas",
      "Página pública de agendamiento",
      "Reportes avanzados",
      "Soporte prioritario",
    ],
    cta: "Comenzar prueba gratis",
    href: "/auth/login?tab=registro",
    highlighted: true,
  },
  {
    name: "Pro Anual",
    price: "$479.000",
    period: "/ año COP",
    description: "Ahorra 2 meses pagando anualmente.",
    features: [
      "Todo lo del plan mensual",
      "2 meses gratis (ahorro 20%)",
      "Factura anual",
    ],
    cta: "Comenzar prueba gratis",
    href: "/auth/login?tab=registro",
    highlighted: false,
  },
];

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function Pricing({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <section id="precios" className="py-24 border-t border-line">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-gold uppercase tracking-widest">Precios</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold">Planes para cada barbería</h2>
          <p className="mt-4 text-ink-2 max-w-xl mx-auto">
            Empieza gratis y escala cuando lo necesites. Sin contratos, cancela cuando quieras.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={cardVariant}
              whileHover={{ y: plan.highlighted ? -4 : -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`rounded-2xl p-8 border ${
                plan.highlighted
                  ? "border-gold bg-gradient-to-b from-gold/10 to-zinc-900 md:scale-105 shadow-xl shadow-gold/10"
                  : "border-line bg-card"
              }`}
            >
              {plan.highlighted && (
                <div className="mb-5 inline-block rounded-full bg-gold px-3 py-1 text-xs font-bold text-zinc-950 uppercase tracking-wide">
                  Más popular
                </div>
              )}
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-ink-3 text-sm mb-5">{plan.description}</p>
              <div className="flex items-end gap-1 mb-7">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-ink-3 mb-1.5 text-sm">{plan.period}</span>
              </div>
              <ul className="mb-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-ink-2">
                    <Check className="w-4 h-4 text-gold flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={isLoggedIn ? "/dashboard/upgrade" : plan.href}
                className={`block w-full rounded-full py-3 text-center text-sm font-semibold transition-all ${
                  plan.highlighted
                    ? "bg-gold text-zinc-950 hover:bg-amber-400 hover:scale-105"
                    : "border border-line-2 text-ink hover:border-zinc-500 hover:bg-chip"
                }`}
              >
                {isLoggedIn ? "Ver planes →" : plan.cta}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
