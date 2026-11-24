import { api } from "../api";
import type { Cliente } from "../types";
export const clientesService = {
  listar: (q = "") => api<Cliente[]>(`/clientes?q=${encodeURIComponent(q)}`),
  crear: (d: Omit<Cliente, "id" | "creadoEn">) => api<Cliente>("/clientes", { method: "POST", body: JSON.stringify(d) }),
  editar: (id: number, d: Partial<Cliente>) => api<Cliente>(`/clientes/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  eliminar: (id: number) => api<void>(`/clientes/${id}`, { method: "DELETE" }),
};
