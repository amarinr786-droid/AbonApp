import type { EstadoDeuda } from "@/lib/types";
const S = { pendiente: ["Pendiente", "bg-red-50 text-red-700"], parcial: ["Parcial", "bg-yellow-50 text-yellow-700"], pagada: ["Pagada", "bg-emerald-50 text-emerald-700"] } as const;
export default function EstadoBadge({ estado }: { estado: EstadoDeuda }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${S[estado][1]}`}>{S[estado][0]}</span>;
}
