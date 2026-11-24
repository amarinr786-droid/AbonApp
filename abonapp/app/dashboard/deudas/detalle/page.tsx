import { Suspense } from "react";
import DetalleDeuda from "./DetalleDeuda";
// En exportación estática no hay rutas dinámicas /deudas/[id]: el detalle se abre con /deudas/detalle/?id=123
export default function Page() { return <Suspense><DetalleDeuda /></Suspense>; }
