"use client";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [loading, user, router]);
  if (loading || !user) return <div className="grid min-h-screen place-items-center text-slate-500">Cargando…</div>;
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="p-4 md:ml-64 md:p-8">{children}</main>
    </div>
  );
}
