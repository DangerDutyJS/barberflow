"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-full border border-line-2 px-4 py-1.5 text-sm text-ink-2 hover:border-zinc-500 hover:text-ink transition-colors"
    >
      Cerrar sesión
    </button>
  );
}
