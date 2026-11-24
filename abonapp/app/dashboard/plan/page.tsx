"use client";
import { useAuth } from "@/context/AuthContext";
import { PLANES } from "@/lib/plans";
import { formatCOP } from "@/lib/format";

export default function PlanPage() {
  const { user } = useAuth();
  const planActual = PLANES.find((p) => p.id === user?.plan) ?? PLANES[0];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Mi plan</h1>

      {/* Plan activo */}
      <div className="rounded-xl border-2 border-brand bg-brand-soft p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">Plan actual</p>
        <h2 className="mt-1 text-xl font-bold text-brand">{planActual.nombre}</h2>
        <p className="mt-1 text-sm text-slate-600">{planActual.descripcion}</p>
        <ul className="mt-3 space-y-1">
          {planActual.items.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="text-brand">✓</span> {item}
            </li>
          ))}
        </ul>
        {planActual.precio === 0 ? (
          <span className="mt-3 inline-block rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">Gratuito</span>
        ) : (
          <span className="mt-3 inline-block rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
            {formatCOP(planActual.precio)} / mes
          </span>
        )}
      </div>

      {/* Otros planes */}
      <h2 className="text-lg font-medium">Otros planes disponibles</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PLANES.filter((p) => p.id !== planActual.id).map((p) => (
          <div key={p.id} className="relative rounded-xl border bg-white p-5">
            {p.recomendado && (
              <span className="absolute right-4 top-4 rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-white">
                Recomendado
              </span>
            )}
            <h3 className="text-lg font-semibold">{p.nombre}</h3>
            <p className="mt-1 text-sm text-slate-500">{p.descripcion}</p>
            <ul className="mt-3 space-y-1">
              {p.items.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="text-slate-400">✓</span> {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xl font-bold">
              {p.precio === 0 ? "Gratis" : `${formatCOP(p.precio)} / mes`}
            </p>
            <p className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-center text-sm text-slate-400">
              Contacta con soporte para cambiar de plan
            </p>
          </div>
        ))}
      </div>

      {/* Nota académica */}
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
        <strong>Nota:</strong> Este es un proyecto universitario. Los pagos y cambios de plan son simulados.
      </p>
    </div>
  );
}
