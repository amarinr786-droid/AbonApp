import Link from "next/link";
import Logo from "@/components/layout/Logo";
import { PLANES } from "@/lib/plans";
import { formatCOP } from "@/lib/format";

const FUNC = ["Gestión de clientes", "Registro de deudas", "Control de abonos", "Cálculo automático de saldos", "Historial de pagos", "Dashboard financiero"];
const FAQ = [["¿Qué es AbonApp?", "Una plataforma para administrar clientes, deudas y abonos en un solo lugar."], ["¿El saldo se calcula automáticamente?", "Sí: saldo pendiente = valor inicial − total abonado, validado por el servidor."], ["¿Puedo cambiar de plan?", "Sí, desde Mi plan. Los planes son una simulación académica, sin cobros reales."]];

export default function Landing() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <Logo />
          <nav className="hidden gap-6 text-sm text-slate-600 md:flex">
            <a href="#inicio">Inicio</a><a href="#funcionalidades">Funcionalidades</a><a href="#planes">Planes</a><a href="#faq">Preguntas frecuentes</a>
          </nav>
          <div className="flex gap-2 text-sm"><Link href="/login" className="px-3 py-2">Iniciar sesión</Link><Link href="/register" className="rounded-lg bg-brand px-3 py-2 text-white">Crear cuenta</Link></div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-24 px-4 py-16">
        <section id="inicio" className="text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">Controla tus deudas. Organiza tus abonos. Recupera el control.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">Administra tus clientes, registra sus pagos y conoce cuánto dinero tienes pendiente por cobrar. Todo desde una sola plataforma.</p>
          <div className="mt-8 flex justify-center gap-3"><Link href="/register" className="rounded-lg bg-brand px-5 py-3 text-white">Comenzar ahora</Link><a href="#planes" className="rounded-lg border bg-white px-5 py-3">Conocer los planes</a></div>
        </section>
        <section id="funcionalidades"><h2 className="mb-6 text-center text-2xl font-semibold">Funcionalidades principales</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{FUNC.map((f) => <div key={f} className="rounded-2xl border border-slate-200 bg-white p-5 font-medium shadow-sm">{f}</div>)}</div></section>
        <section id="planes"><h2 className="mb-2 text-center text-2xl font-semibold">Planes y precios</h2>
          <p className="mb-6 text-center text-sm text-slate-500">Propuesta académica: no se realizan cobros reales.</p>
          <div className="grid gap-4 md:grid-cols-3">{PLANES.map((p) => (
            <div key={p.id} className={`rounded-2xl border bg-white p-6 ${p.recomendado ? "border-brand ring-2 ring-brand" : ""}`}>
              {p.recomendado && <span className="text-xs font-semibold text-brand">Recomendado</span>}
              <h3 className="text-lg font-semibold">{p.nombre}</h3><p className="text-sm text-slate-500">{p.descripcion}</p>
              <p className="my-4 text-3xl font-bold">{p.precio ? formatCOP(p.precio) : "Gratis"}<span className="text-sm font-normal text-slate-500">{p.precio ? "/mes" : ""}</span></p>
              <ul className="mb-6 space-y-1 text-sm">{p.items.map((i) => <li key={i}>✓ {i}</li>)}</ul>
              <Link href={`/register?plan=${p.id}`} className="block rounded-lg bg-brand py-2 text-center text-sm text-white">Elegir {p.nombre}</Link>
            </div>))}</div></section>
        <section id="faq"><h2 className="mb-6 text-center text-2xl font-semibold">Preguntas frecuentes</h2>
          <div className="mx-auto max-w-2xl space-y-2">{FAQ.map(([q, a]) => <details key={q} className="rounded-lg border bg-white p-4"><summary className="cursor-pointer font-medium">{q}</summary><p className="mt-2 text-sm text-slate-600">{a}</p></details>)}</div></section>
      </main>
      <footer className="border-t bg-white p-6 text-center text-sm text-slate-500">© 2026 AbonApp. Proyecto académico.</footer>
    </>
  );
}
