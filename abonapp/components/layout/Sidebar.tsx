"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "./Logo";
import { useAuth } from "@/context/AuthContext";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/clientes", label: "Clientes" },
  { href: "/dashboard/deudas", label: "Deudas" },
  { href: "/dashboard/abonos", label: "Abonos" },
  { href: "/dashboard/plan", label: "Mi plan" },
  { href: "/dashboard/configuracion", label: "Configuración" },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/dashboard" ? path === h : path.startsWith(h));
  return (
    <>
      <div className="flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
        <Logo href="/dashboard" />
        <button aria-label="Abrir menú" onClick={() => setOpen(!open)} className="rounded-md border px-3 py-1 text-sm">Menú</button>
      </div>
      <aside className={`${open ? "block" : "hidden"} w-full border-r bg-white p-4 md:fixed md:inset-y-0 md:block md:w-64`}>
        <div className="mb-6 hidden md:block"><Logo href="/dashboard" /></div>
        <nav className="space-y-1">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${active(l.href) ? "bg-brand-soft text-brand" : "text-slate-600 hover:bg-slate-100"}`}>
              {l.label}
            </Link>
          ))}
          <button onClick={async () => { await logout(); router.replace("/login"); }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">Cerrar sesión</button>
        </nav>
      </aside>
    </>
  );
}
