"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { dashboardService } from "@/lib/services/dashboardService";
import { formatCOP, formatFecha } from "@/lib/format";

type Data = Awaited<ReturnType<typeof dashboardService.resumen>>;

export default function DashboardPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { dashboardService.resumen().then(setData).catch((e) => setError(e.message)); }, []);

  const cards = data ? [
    ["Clientes registrados", String(data.clientes)],
    ["Total de deudas", formatCOP(data.totalDeudas)],
    ["Total recibido en abonos", formatCOP(data.totalAbonado)],
    ["Saldo pendiente por cobrar", formatCOP(data.saldoPendiente)],
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/clientes" className="rounded-lg border bg-white px-3 py-2 text-sm">Nuevo cliente</Link>
          <Link href="/dashboard/deudas" className="rounded-lg bg-brand px-3 py-2 text-sm text-white">Registrar deuda</Link>
        </div>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!data && !error && <p className="text-slate-500">Cargando indicadores…</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([t, v]) => (
          <div key={t} className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">{t}</p><p className="mt-2 text-2xl font-semibold">{v}</p></div>
        ))}
      </div>
      {data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border bg-white p-5"><h2 className="mb-3 font-medium">Últimas deudas</h2>
            {data.ultimasDeudas.length === 0 ? <p className="text-sm text-slate-500">Aún no hay deudas registradas.</p> :
              data.ultimasDeudas.map((d) => <p key={d.id} className="flex justify-between border-t py-2 text-sm"><span>{d.cliente}</span><span>{formatCOP(d.saldoPendiente)}</span></p>)}
          </section>
          <section className="rounded-xl border bg-white p-5"><h2 className="mb-3 font-medium">Últimos abonos</h2>
            {data.ultimosAbonos.length === 0 ? <p className="text-sm text-slate-500">Aún no hay abonos registrados.</p> :
              data.ultimosAbonos.map((a) => <p key={a.id} className="flex justify-between border-t py-2 text-sm"><span>{a.cliente} · {formatFecha(a.fecha)}</span><span className="text-green-700">{formatCOP(a.valor)}</span></p>)}
          </section>
        </div>
      )}
    </div>
  );
}
