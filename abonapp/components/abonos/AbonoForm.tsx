"use client";
import { useState, type FormEvent } from "react";
import { abonosService } from "@/lib/services/abonosService";
import { btnGhost, btnPrimary, inputCls } from "@/components/common/Modal";
import { ErrorMsg } from "@/components/common/Feedback";
import { formatCOP } from "@/lib/format";

// Validación previa en cliente; la validación definitiva la hace el backend.
export default function AbonoForm({ deudaId, saldo, onDone, onCancel }: { deudaId: number; saldo: number; onDone: () => void; onCancel: () => void }) {
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget); const valor = Number(f.get("valor"));
    if (saldo <= 0) return setErr("La deuda ya está pagada.");
    if (!(valor > 0)) return setErr("El abono debe ser mayor que cero.");
    if (valor > saldo) return setErr(`El abono no puede superar el saldo pendiente (${formatCOP(saldo)}).`);
    setBusy(true); setErr("");
    try { await abonosService.crear({ deudaId, valor, fecha: String(f.get("fecha")), observacion: String(f.get("observacion") ?? "") || undefined }); onDone(); }
    catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-slate-500">Saldo pendiente: {formatCOP(saldo)}</p>
      <input name="valor" type="number" min="1" placeholder="Valor del abono" className={inputCls} />
      <input name="fecha" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
      <input name="observacion" placeholder="Observación (opcional)" className={inputCls} />
      <ErrorMsg msg={err} />
      <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className={btnGhost}>Cancelar</button><button disabled={busy} className={btnPrimary}>{busy ? "Guardando…" : "Registrar abono"}</button></div>
    </form>
  );
}
