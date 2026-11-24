"use client";
import { useState } from "react";
import Modal, { btnGhost, btnPrimary, inputCls } from "@/components/common/Modal";
import { Empty, ErrorMsg, OkMsg } from "@/components/common/Feedback";
import { useLista } from "@/components/common/useLista";
import ClienteForm from "@/components/clientes/ClienteForm";
import { clientesService } from "@/lib/services/clientesService";
import { formatFecha } from "@/lib/format";
import type { Cliente } from "@/lib/types";

export default function ClientesPage() {
  const [q, setQ] = useState("");
  const { data, loading, error, recargar } = useLista(() => clientesService.listar(q), q);
  const [form, setForm] = useState<Cliente | "nuevo" | null>(null);
  const [borrar, setBorrar] = useState<Cliente | null>(null);
  const [ver, setVer] = useState<Cliente | null>(null);
  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");

  async function eliminar() {
    if (!borrar) return;
    try { await clientesService.eliminar(borrar.id); setMsg("Cliente eliminado."); setErr(""); recargar(); }
    catch (x) { setErr((x as Error).message); } // el backend rechaza si tiene deudas asociadas
    setBorrar(null);
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <button onClick={() => setForm("nuevo")} className={btnPrimary}>Registrar cliente</button>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre…" className={`${inputCls} max-w-sm bg-white`} />
      <OkMsg msg={msg} /><ErrorMsg msg={error || err} />
      {loading ? <p className="text-slate-500">Cargando clientes…</p> : data.length === 0 && !error ? <Empty text="No hay clientes para mostrar." /> : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr>{["Nombre", "Identificación", "Teléfono", "Correo", "Registro", ""].map((h) => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{data.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">{c.nombre}</td><td className="p-3">{c.identificacion}</td><td className="p-3">{c.telefono}</td><td className="p-3">{c.email}</td><td className="p-3">{formatFecha(c.creadoEn)}</td>
                <td className="space-x-3 p-3 text-right"><button onClick={() => setVer(c)} className="text-brand">Ver</button><button onClick={() => setForm(c)} className="text-brand">Editar</button><button onClick={() => setBorrar(c)} className="text-red-600">Eliminar</button></td>
              </tr>))}</tbody>
          </table>
        </div>)}
      {form && <Modal title={form === "nuevo" ? "Registrar cliente" : "Editar cliente"} onClose={() => setForm(null)}>
        <ClienteForm cliente={form === "nuevo" ? undefined : form} onCancel={() => setForm(null)} onDone={() => { setForm(null); setMsg("Cliente guardado."); recargar(); }} /></Modal>}
      {ver && <Modal title={ver.nombre} onClose={() => setVer(null)}><dl className="space-y-1 text-sm"><p>Identificación: {ver.identificacion}</p><p>Teléfono: {ver.telefono || "—"}</p><p>Correo: {ver.email || "—"}</p><p>Registrado: {formatFecha(ver.creadoEn)}</p></dl></Modal>}
      {borrar && <Modal title="Eliminar cliente" onClose={() => setBorrar(null)}>
        <p className="mb-4 text-sm">¿Eliminar a <b>{borrar.nombre}</b>? Solo es posible si no tiene deudas asociadas.</p>
        <div className="flex justify-end gap-2"><button onClick={() => setBorrar(null)} className={btnGhost}>Cancelar</button><button onClick={eliminar} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white">Eliminar</button></div></Modal>}
    </div>
  );
}
