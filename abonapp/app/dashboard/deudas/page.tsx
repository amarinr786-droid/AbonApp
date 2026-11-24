"use client";
import Link from "next/link";
import { useState } from "react";
import Modal, { btnGhost, btnPrimary, inputCls } from "@/components/common/Modal";
import { Empty, ErrorMsg, OkMsg } from "@/components/common/Feedback";
import EstadoBadge from "@/components/common/EstadoBadge";
import { useLista } from "@/components/common/useLista";
import DeudaForm from "@/components/deudas/DeudaForm";
import { deudasService } from "@/lib/services/deudasService";
import { formatCOP, formatFecha } from "@/lib/format";
import type { Deuda } from "@/lib/types";

export default function DeudasPage() {
  const [q, setQ] = useState(""); const [estado, setEstado] = useState("");
  const { data, loading, error, recargar } = useLista(() => deudasService.listar({ q, estado }), `${q}|${estado}`);
  const [form, setForm] = useState<Deuda | "nueva" | null>(null);
  const [anular, setAnular] = useState<Deuda | null>(null);
  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");

  async function confirmarAnular() {
    if (!anular) return;
    try { await deudasService.anular(anular.id); setMsg("Deuda anulada."); setErr(""); recargar(); }
    catch (x) { setErr((x as Error).message); } // el backend rechaza si ya tiene abonos
    setAnular(null);
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">Deudas</h1><button onClick={() => setForm("nueva")} className={btnPrimary}>Nueva deuda</button></div>
      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por cliente…" className={`${inputCls} max-w-xs bg-white`} />
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className={`${inputCls} max-w-[10rem] bg-white`}><option value="">Todos</option><option value="pendiente">Pendiente</option><option value="parcial">Parcial</option><option value="pagada">Pagada</option></select>
      </div>
      <OkMsg msg={msg} /><ErrorMsg msg={error || err} />
      {loading ? <p className="text-slate-500">Cargando deudas…</p> : data.length === 0 && !error ? <Empty text="No hay deudas para mostrar." /> : (
        <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500"><tr>{["Cliente", "Descripción", "Valor", "Abonado", "Saldo", "Límite", "Estado", ""].map((h) => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{data.map((d) => (
            <tr key={d.id} className="border-t">
              <td className="p-3 font-medium">{d.cliente}</td><td className="p-3">{d.descripcion}</td><td className="p-3">{formatCOP(d.valorInicial)}</td><td className="p-3">{formatCOP(d.totalAbonado)}</td><td className="p-3">{formatCOP(d.saldoPendiente)}</td>
              <td className="p-3">{d.fechaLimite ? formatFecha(d.fechaLimite) : "—"}</td><td className="p-3"><EstadoBadge estado={d.estado} /></td>
              <td className="space-x-3 whitespace-nowrap p-3 text-right"><Link href={`/dashboard/deudas/${d.id}`} className="text-brand">Detalle</Link><button onClick={() => setForm(d)} className="text-brand">Editar</button>{d.totalAbonado === 0 && <button onClick={() => setAnular(d)} className="text-red-600">Anular</button>}</td>
            </tr>))}</tbody></table></div>)}
      {form && <Modal title={form === "nueva" ? "Nueva deuda" : "Editar deuda"} onClose={() => setForm(null)}>
        <DeudaForm deuda={form === "nueva" ? undefined : form} onCancel={() => setForm(null)} onDone={() => { setForm(null); setMsg("Deuda guardada."); recargar(); }} /></Modal>}
      {anular && <Modal title="Anular deuda" onClose={() => setAnular(null)}><p className="mb-4 text-sm">¿Anular la deuda de <b>{anular.cliente}</b>? Esta acción no se puede deshacer.</p>
        <div className="flex justify-end gap-2"><button onClick={() => setAnular(null)} className={btnGhost}>Cancelar</button><button onClick={confirmarAnular} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white">Anular</button></div></Modal>}
    </div>
  );
}
