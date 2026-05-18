"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="border-t border-zinc-800 py-14"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <span className="text-xl select-none">✂</span>
              <span className="text-lg font-bold tracking-tight">
                <span className="text-white">Barber</span>
                <span className="text-gold">Flow</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed">
              La plataforma inteligente de agendamiento para barberías modernas. Rápida, segura y escalable.
            </p>
          </div>

          <div className="flex flex-wrap gap-12">
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Producto</h4>
              <ul className="space-y-3 text-sm text-zinc-500">
                <li><Link href="#caracteristicas" className="hover:text-white transition-colors">Características</Link></li>
                <li><Link href="#precios" className="hover:text-white transition-colors">Precios</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Changelog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-3 text-sm text-zinc-500">
                <li><Link href="#" className="hover:text-white transition-colors">Acerca de</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contacto</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-zinc-500">
                <li><Link href="#" className="hover:text-white transition-colors">Privacidad</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Términos de uso</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-zinc-600">© 2026 BarberFlow. Todos los derechos reservados.</p>
          <p className="text-sm text-zinc-600">
            Construido con{" "}
            <span className="text-zinc-500">Next.js · Supabase · Tailwind CSS</span>
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
