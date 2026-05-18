"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface NavbarProps {
  isLoggedIn?: boolean;
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl select-none">✂</span>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-white">Barber</span>
              <span className="text-gold">Flow</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#caracteristicas" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Características
            </Link>
            <Link href="#como-funciona" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Cómo funciona
            </Link>
            <Link href="#precios" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Precios
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors"
              >
                Mi dashboard →
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
                  Iniciar sesión
                </Link>
                <Link
                  href="/auth/login?tab=registro"
                  className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors"
                >
                  Empezar gratis
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-zinc-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-zinc-800 py-4 flex flex-col gap-4"
          >
            <Link href="#caracteristicas" onClick={() => setOpen(false)} className="text-sm text-zinc-400 hover:text-white">
              Características
            </Link>
            <Link href="#como-funciona" onClick={() => setOpen(false)} className="text-sm text-zinc-400 hover:text-white">
              Cómo funciona
            </Link>
            <Link href="#precios" onClick={() => setOpen(false)} className="text-sm text-zinc-400 hover:text-white">
              Precios
            </Link>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-zinc-950 text-center"
              >
                Mi dashboard →
              </Link>
            ) : (
              <Link
                href="/auth/login?tab=registro"
                onClick={() => setOpen(false)}
                className="rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-zinc-950 text-center"
              >
                Empezar gratis
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
