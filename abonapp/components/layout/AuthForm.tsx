"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import Logo from "./Logo";
import { useAuth } from "@/context/AuthContext";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const reg = mode === "register";
  const { login, register } = useAuth();
  const router = useRouter();
  const plan = useSearchParams().get("plan") ?? undefined;
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")), password = String(f.get("password")), nombre = String(f.get("nombre") ?? "");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Ingresa un correo válido.");
    if (password.length < 8) return setErr("La contraseña debe tener al menos 8 caracteres.");
    if (reg && password !== f.get("confirmar")) return setErr("Las contraseñas no coinciden.");
    if (reg && !f.get("terminos")) return setErr("Debes aceptar los términos y condiciones.");
    setErr(""); setBusy(true);
    try {
      if (reg) await register({ nombre, email, password, plan }); else await login(email, password);
      router.replace("/dashboard");
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  }

  const input = "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand";
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border bg-white p-6">
        <Logo />
        <h1 className="text-xl font-semibold">{reg ? "Crear cuenta" : "Iniciar sesión"}</h1>
        {reg && <input name="nombre" required placeholder="Nombre completo" className={input} />}
        <input name="email" type="email" required placeholder="Correo electrónico" className={input} />
        <div className="relative">
          <input name="password" type={show ? "text" : "password"} required placeholder="Contraseña" className={input} />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-2 text-xs text-brand">{show ? "Ocultar" : "Mostrar"}</button>
        </div>
        {reg && <input name="confirmar" type={show ? "text" : "password"} required placeholder="Confirmar contraseña" className={input} />}
        {reg && <label className="flex gap-2 text-sm"><input type="checkbox" name="terminos" />Acepto los términos y condiciones</label>}
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-brand py-2 text-sm font-medium text-white disabled:opacity-60">{busy ? "Procesando…" : reg ? "Crear cuenta" : "Iniciar sesión"}</button>
        <p className="text-center text-sm text-slate-500">{reg ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
          <Link href={reg ? "/login" : "/register"} className="text-brand">{reg ? "Inicia sesión" : "Regístrate"}</Link></p>
      </form>
    </div>
  );
}
