import { api } from "../api";
import type { Abono } from "../types";
export const abonosService = {
  listar: (p: { q?: string; desde?: string; hasta?: string } = {}) => api<Abono[]>(`/abonos?${new URLSearchParams(p as Record<string, string>)}`),
  crear: (d: { deudaId: number; valor: number; fecha: string; observacion?: string }) => api<Abono>("/abonos", { method: "POST", body: JSON.stringify(d) }),
};
