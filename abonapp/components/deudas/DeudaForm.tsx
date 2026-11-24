"use client";
import { useEffect, useState, type FormEvent } from "react";
import { deudasService } from "@/lib/services/deudasService";
import { clientesService } from "@/lib/services/clientesService";
import type { Cliente, Deuda } from "@/lib/types";
import { btnGhost, btnPrimary, inputCls } from "@/components/common/Modal";
import { ErrorMsg } from "@/components/common/Feedback";

// Al editar solo se permiten descripción y fecha límite.
export default function DeudaForm({ deuda, onDone, onCancel }: { deuda?: Deuda; onDone: () => void; onCancel: () => void }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!deuda) clientesService.listar().then(setClientes).catch((e) => setErr(e.message)); }, [deuda]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const descripcion = String(f.get("descripcion")).trim(); const fechaLimite = String(f.get("fechaLimite")) || undefined;
    if (!descripcion) return setErr("La descripción es obligatoria.");
    setBusy(true); setErr("");
    try {
      if (deuda) await deudasService.editar(deuda.id, { descripcion, fechaLimite });
      else {
        const valorInicial = Number(f.get("valorInicial")); const clienteId = Number(f.get("clienteId"));
        if (!clienteId) { setBusy(false); return setErr("Selecciona un cliente."); }
        if (!(valorInicial > 0)) { setBusy(false); return setErr("El valor debe ser mayor que cero."); }
        await deudasService.crear({ clienteId, descripcion, valorInicial, fechaLimite });
      }
      onDone();
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      {!deuda && <select name="clienteId" className={inputCls} defaultValue=""><option value="" disabled>Selecciona un cliente</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>}
      <input name="descripcion" defaultValue={deuda?.descripcion} placeholder="Descripción" className={inputCls} />
      {!deuda && <input name="valorInicial" type="number" min="1" placeholder="Valor inicial (COP)" className={inputCls} />}
      <label className="block text-xs text-slate-500">Fecha límite<input name="fechaLimite" type="date" defaultValue={deuda?.fechaLimite?.slice(0, 10)} className={inputCls} /></label>
      <ErrorMsg msg={err} />
      <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className={btnGhost}>Cancelar</button><button disabled={busy} className={btnPrimary}>{busy ? "Guardando…" : "Guardar"}</button></div>
    </form>
  );
}
