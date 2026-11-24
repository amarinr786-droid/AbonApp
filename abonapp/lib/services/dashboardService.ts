import { api } from "../api";
import type { ResumenDashboard, Deuda, Abono } from "../types";
export const dashboardService = {
  resumen: () => api<ResumenDashboard & { ultimasDeudas: Deuda[]; ultimosAbonos: Abono[] }>("/dashboard"),
};
