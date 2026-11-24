"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authService } from "@/lib/services/authService";
import type { Usuario } from "@/lib/types";

interface Ctx { user: Usuario | null; loading: boolean; login: (e: string, p: string) => Promise<void>; register: (d: { nombre: string; email: string; password: string; plan?: string }) => Promise<void>; logout: () => Promise<void> }
const AuthContext = createContext<Ctx | null>(null);

// La sesión vive en una cookie httpOnly emitida por el backend; aquí nunca se guardan contraseñas ni tokens.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { authService.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
  const login = useCallback(async (e: string, p: string) => setUser(await authService.login(e, p)), []);
  const register = useCallback(async (d: { nombre: string; email: string; password: string; plan?: string }) => setUser(await authService.register(d)), []);
  const logout = useCallback(async () => { await authService.logout().catch(() => {}); setUser(null); }, []);
  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => { const c = useContext(AuthContext); if (!c) throw new Error("useAuth fuera de AuthProvider"); return c; };
