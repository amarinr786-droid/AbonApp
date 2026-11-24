import { api } from "../api";
import type { Usuario } from "../types";
export const authService = {
  login: (email: string, password: string) => api<Usuario>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (d: { nombre: string; email: string; password: string; plan?: string }) => api<Usuario>("/auth/register", { method: "POST", body: JSON.stringify(d) }),
  me: () => api<Usuario>("/auth/me"),
  logout: () => api<void>("/auth/logout", { method: "POST" }),
  actualizarPerfil: (d: { nombre: string; email: string }) => api<Usuario>("/auth/perfil", { method: "PUT", body: JSON.stringify(d) }),
  cambiarPassword: (d: { actual: string; nueva: string }) => api<void>("/auth/password", { method: "PUT", body: JSON.stringify(d) }),
};
