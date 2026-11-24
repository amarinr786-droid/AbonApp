import { api } from "../api";
import type { Deuda, Abono } from "../types";
export const deudasService = {
  listar: (p: { q?: string; estado?: string } = {}) => api<Deuda[]>(`/deudas?${new URLSearchParams(p as Record<string, string>)}`),
  obtener: (id: number) => api<Deuda & { abonos: Abono[] }>(`/deudas/${id}`),
  crear: (d: { clienteId: number; descripcion: string; valorInicial: number; fechaLimite?: string }) => api<Deuda>("/deudas", { method: "POST", body: JSON.stringify(d) }),
  editar: (id: number, d: { descripcion?: string; fechaLimite?: string }) => api<Deuda>(`/deudas/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  anular: (id: number) => api<void>(`/deudas/${id}`, { method: "DELETE" }),
};
