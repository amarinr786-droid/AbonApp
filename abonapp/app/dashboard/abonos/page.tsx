"use client";
import { useState } from "react";
import { Empty, ErrorMsg, OkMsg } from "@/components/common/Feedback";
import EstadoBadge from "@/components/common/EstadoBadge";
import { inputCls } from "@/components/common/Modal";
import { useLista } from "@/components/common/useLista";
import { abonosService } from "@/lib/services/abonosService";
import { formatCOP, formatFecha } from "@/lib/format";

export default function AbonosPage() {
  const [q, setQ] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const { data, loading, error } = useLista(
    () => abonosService.listar({ q, desde, hasta }),
    `${q}|${desde}|${hasta}`
  );

  const totalFiltrado = data.reduce((acc, a) => acc + a.valor, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Historial de abonos</h1>
        {data.length > 0 && (
          <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
            Total: {formatCOP(totalFiltrado)}
          </span>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por cliente…"
          className={`${inputCls} max-w-xs bg-white`}
        />
        <input
          type="date"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          className={`${inputCls} max-w-[10rem] bg-white`}
          title="Desde"
        />
        <input
          type="date"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          className={`${inputCls} max-w-[10rem] bg-white`}
          title="Hasta"
        />
        {(q || desde || hasta) && (
          <button
            onClick={() => { setQ(""); setDesde(""); setHasta(""); }}
            className="rounded-lg border bg-white px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <OkMsg msg="" />
      <ErrorMsg msg={error} />

      {loading ? (
        <p className="text-slate-500">Cargando abonos…</p>
      ) : data.length === 0 && !error ? (
        <Empty text="No hay abonos para mostrar." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {["Cliente", "Deuda", "Fecha", "Valor", "Observación"].map((h) => (
                  <th key={h} className="p-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3 font-medium">{a.cliente}</td>
                  <td className="p-3 text-slate-500">#{a.deudaId}</td>
                  <td className="p-3">{formatFecha(a.fecha)}</td>
                  <td className="p-3 font-semibold text-green-700">{formatCOP(a.valor)}</td>
                  <td className="p-3 text-slate-500">{a.observacion ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
