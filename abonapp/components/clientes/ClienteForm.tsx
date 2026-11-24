"use client";
import { useState, type FormEvent } from "react";
import { clientesService } from "@/lib/services/clientesService";
import type { Cliente } from "@/lib/types";
import { btnGhost, btnPrimary, inputCls } from "@/components/common/Modal";
import { ErrorMsg } from "@/components/common/Feedback";

export default function ClienteForm({ cliente, onDone, onCancel }: { cliente?: Cliente; onDone: () => void; onCancel: () => void }) {
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const d = { nombre: String(f.get("nombre")).trim(), identificacion: String(f.get("identificacion")).trim(), telefono: String(f.get("telefono")).trim(), email: String(f.get("email")).trim() };
    if (!d.nombre || !d.identificacion) return setErr("Nombre e identificación son obligatorios.");
    setBusy(true); setErr("");
    try { if (cliente) await clientesService.editar(cliente.id, d); else await clientesService.crear(d); onDone(); }
    catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <input name="nombre" defaultValue={cliente?.nombre} placeholder="Nombre completo" className={inputCls} />
      <input name="identificacion" defaultValue={cliente?.identificacion} placeholder="Identificación" className={inputCls} />
      <input name="telefono" defaultValue={cliente?.telefono} placeholder="Teléfono" className={inputCls} />
      <input name="email" type="email" defaultValue={cliente?.email} placeholder="Correo electrónico" className={inputCls} />
      <ErrorMsg msg={err} />
      <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className={btnGhost}>Cancelar</button><button disabled={busy} className={btnPrimary}>{busy ? "Guardando…" : "Guardar"}</button></div>
    </form>
  );
}
