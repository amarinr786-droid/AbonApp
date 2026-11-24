"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/lib/services/authService";
import { inputCls, btnPrimary } from "@/components/common/Modal";
import { OkMsg, ErrorMsg } from "@/components/common/Feedback";

export default function ConfiguracionPage() {
  const { user, logout } = useAuth();
  const [nombre, setNombre] = useState(user?.nombre ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Cambio de contraseña
  const [pwActual, setPwActual] = useState("");
  const [pwNueva, setPwNueva] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  async function guardarPerfil(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg(""); setErr("");
    try {
      await authService.actualizarPerfil({ nombre, email });
      setMsg("Perfil actualizado correctamente.");
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!pwNueva || pwNueva.length < 6) { setPwErr("La nueva contraseña debe tener al menos 6 caracteres."); return; }
    setPwLoading(true); setPwMsg(""); setPwErr("");
    try {
      await authService.cambiarPassword({ actual: pwActual, nueva: pwNueva });
      setPwMsg("Contraseña actualizada correctamente.");
      setPwActual(""); setPwNueva("");
    } catch (x) {
      setPwErr((x as Error).message);
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-lg">
      <h1 className="text-2xl font-semibold">Configuración</h1>

      {/* Datos del perfil */}
      <section className="rounded-xl border bg-white p-6 space-y-4">
        <h2 className="font-medium">Datos de la cuenta</h2>
        <form onSubmit={guardarPerfil} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          <OkMsg msg={msg} />
          <ErrorMsg msg={err} />
          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      </section>

      {/* Cambiar contraseña */}
      <section className="rounded-xl border bg-white p-6 space-y-4">
        <h2 className="font-medium">Cambiar contraseña</h2>
        <form onSubmit={cambiarPassword} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Contraseña actual</label>
            <input
              type="password"
              value={pwActual}
              onChange={(e) => setPwActual(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Nueva contraseña</label>
            <input
              type="password"
              value={pwNueva}
              onChange={(e) => setPwNueva(e.target.value)}
              required
              minLength={6}
              className={inputCls}
            />
          </div>
          <OkMsg msg={pwMsg} />
          <ErrorMsg msg={pwErr} />
          <button type="submit" disabled={pwLoading} className={btnPrimary}>
            {pwLoading ? "Actualizando…" : "Cambiar contraseña"}
          </button>
        </form>
      </section>

      {/* Zona de peligro */}
      <section className="rounded-xl border border-red-200 bg-red-50 p-6 space-y-3">
        <h2 className="font-medium text-red-700">Zona de peligro</h2>
        <p className="text-sm text-red-600">
          Al cerrar sesión perderás el acceso hasta que vuelvas a ingresar.
        </p>
        <button
          onClick={logout}
          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Cerrar sesión
        </button>
      </section>
    </div>
  );
}
