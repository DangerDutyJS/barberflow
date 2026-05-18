"use client";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Crea tu cuenta",
    description:
      "Regístrate gratis en menos de 2 minutos con tu email o cuenta de Google. Sin tarjeta de crédito requerida.",
  },
  {
    number: "02",
    title: "Configura tu barbería",
    description:
      "Agrega tus barberos, define servicios, precios y horarios de atención. Listo en minutos.",
  },
  {
    number: "03",
    title: "Recibe citas online",
    description:
      "Comparte tu link personalizado y empieza a recibir reservas de inmediato. Así de simple.",
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18 } },
};

const stepVariant = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-gold uppercase tracking-widest">Proceso</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold">Empieza en 3 pasos</h2>
          <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
            Sin configuraciones complicadas ni conocimientos técnicos. Estarás listo para recibir citas en minutos.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="relative grid grid-cols-1 md:grid-cols-3 gap-10"
        >
          <div className="hidden md:block absolute top-8 left-[22%] right-[22%] h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={stepVariant}
              className="relative flex flex-col items-center text-center"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gold/50 bg-gold/10 ring-4 ring-zinc-950">
                <span className="text-lg font-bold text-gold">{step.number}</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold">{step.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-8 py-3.5 text-base font-semibold text-zinc-950 hover:bg-gold-light transition-all hover:scale-105 shadow-lg shadow-gold/20"
          >
            Crear cuenta gratis
            <span>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
