"use client";
import type { ReactNode } from "react";
export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-slate-900/40 p-4" onClick={onClose}>
      <div role="dialog" aria-label={title} className="w-full max-w-md rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><button onClick={onClose} aria-label="Cerrar" className="text-slate-400">✕</button></div>
        {children}
      </div>
    </div>
  );
}
export const inputCls = "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand";
export const btnPrimary = "rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-60";
export const btnGhost = "rounded-lg border bg-white px-3 py-2 text-sm";
