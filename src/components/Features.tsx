"use client";
import { motion, type Variants } from "framer-motion";
import { Calendar, BarChart2, CreditCard, Users, Bell, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Calendar,
    title: "Agendamiento 24/7",
    description:
      "Tus clientes reservan su cita en cualquier momento desde celular, tablet o computador. Sin llamadas, sin esperas.",
  },
  {
    icon: BarChart2,
    title: "Dashboard en tiempo real",
    description:
      "Visualiza citas, ingresos y clientes activos en un panel limpio y moderno, actualizado al instante con Supabase Realtime.",
  },
  {
    icon: CreditCard,
    title: "Pagos integrados",
    description:
      "Acepta pagos online y gestiona suscripciones mensuales o anuales. Reduce las ausencias y asegura tus ingresos.",
  },
  {
    icon: Users,
    title: "Multi-barbero",
    description:
      "Administra múltiples barberos, horarios y sillas desde un solo panel centralizado. Escala sin límites.",
  },
  {
    icon: Bell,
    title: "Notificaciones automáticas",
    description:
      "Recordatorios de cita por email o SMS. Reduce las ausencias hasta un 60% y mejora la experiencia del cliente.",
  },
  {
    icon: Lock,
    title: "Autenticación segura",
    description:
      "Login con Google, email o número de teléfono. Seguridad de nivel enterprise con Supabase Auth.",
  },
];

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

const headingVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Features() {
  return (
    <section id="caracteristicas" className="py-24 border-t border-line">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-16"
        >
          <motion.span variants={headingVariant} className="block text-sm font-semibold text-gold uppercase tracking-widest">
            Características
          </motion.span>
          <motion.h2 variants={headingVariant} className="mt-3 text-3xl sm:text-4xl font-bold">
            Todo lo que necesita tu barbería
          </motion.h2>
          <motion.p variants={headingVariant} className="mt-4 text-ink-2 max-w-xl mx-auto">
            Una plataforma completa diseñada específicamente para barberías modernas que quieren operar de forma profesional.
          </motion.p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={cardVariant}
              className="group rounded-2xl border border-line bg-card p-7 hover:border-gold/40 hover:bg-card/60 transition-colors duration-300 cursor-default"
            >
              <div className="mb-4 text-gold"><f.icon className="w-8 h-8" /></div>
              <h3 className="mb-2 text-lg font-semibold text-ink group-hover:text-gold transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-ink-3 leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
