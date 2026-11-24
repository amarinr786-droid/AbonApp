"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Modal, { btnPrimary } from "@/components/common/Modal";
import { Empty, ErrorMsg, OkMsg } from "@/components/common/Feedback";
import EstadoBadge from "@/components/common/EstadoBadge";
import AbonoForm from "@/components/abonos/AbonoForm";
import { deudasService } from "@/lib/services/deudasService";
import { formatCOP, formatFecha } from "@/lib/format";

type Detalle = Awaited<ReturnType<typeof deudasService.obtener>>;

export default function DetalleDeuda() {
  const id = useSearchParams().get("id") ?? "";
  const [d, setD] = useState<Detalle | null>(null);
  const [error, setError] = useState(""); const [msg, setMsg] = useState(""); const [abono, setAbono] = useState(false);
  const cargar = useCallback(() => { deudasService.obtener(Number(id)).then(setD).catch((e) => setError(e.message)); }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  if (error && !d) return <div className="space-y-3"><ErrorMsg msg={error} /><Link href="/dashboard/deudas" className="text-brand">← Volver a deudas</Link></div>;
  if (!d) return <p className="text-slate-500">Cargando deuda…</p>;
  const items = [["Valor inicial", formatCOP(d.valorInicial)], ["Total abonado", formatCOP(d.totalAbonado)], ["Saldo pendiente", formatCOP(d.saldoPendiente)]];
  return (
    <div className="space-y-5">
      <Link href="/dashboard/deudas" className="text-sm text-brand">← Volver a deudas</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">{d.cliente}</h1><p className="text-sm text-slate-500">{d.descripcion}</p></div>
        <div className="flex items-center gap-3"><EstadoBadge estado={d.estado} />{d.estado !== "pagada" && <button onClick={() => setAbono(true)} className={btnPrimary}>Registrar abono</button>}</div>
      </div>
      <OkMsg msg={msg} />
      <div className="grid gap-4 sm:grid-cols-3">{items.map(([t, v]) => <div key={t} className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">{t}</p><p className="mt-1 text-xl font-semibold">{v}</p></div>)}</div>
      <p className="text-sm text-slate-500">Creada: {formatFecha(d.creadoEn)} · Fecha límite: {d.fechaLimite ? formatFecha(d.fechaLimite) : "sin definir"}</p>
      <section><h2 className="mb-2 font-medium">Historial de abonos</h2>
        {d.abonos.length === 0 ? <Empty text="Esta deuda aún no tiene abonos." /> : (
          <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3 font-medium">Fecha</th><th className="p-3 font-medium">Valor</th><th className="p-3 font-medium">Observación</th></tr></thead>
            <tbody>{d.abonos.map((a) => <tr key={a.id} className="border-t"><td className="p-3">{formatFecha(a.fecha)}</td><td className="p-3 text-green-700">{formatCOP(a.valor)}</td><td className="p-3">{a.observacion ?? "—"}</td></tr>)}</tbody></table></div>)}
      </section>
      {abono && <Modal title="Registrar abono" onClose={() => setAbono(false)}><AbonoForm deudaId={d.id} saldo={d.saldoPendiente} onCancel={() => setAbono(false)} onDone={() => { setAbono(false); setMsg("Abono registrado."); cargar(); }} /></Modal>}
    </div>
  );
}
