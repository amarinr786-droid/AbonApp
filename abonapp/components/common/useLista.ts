"use client";
import { useEffect, useRef, useState } from "react";
// Carga una lista desde un servicio; se vuelve a cargar cuando cambia `key` o se llama a `recargar`.
export function useLista<T>(fetcher: () => Promise<T[]>, key: string) {
  const ref = useRef(fetcher);
  useEffect(() => { ref.current = fetcher; });
  const [tick, setTick] = useState(0);
  const id = `${key}#${tick}`;
  const [res, setRes] = useState<{ id: string; data: T[]; error: string }>({ id: "", data: [], error: "" });
  useEffect(() => {
    let vivo = true;
    ref.current()
      .then((data) => vivo && setRes({ id, data, error: "" }))
      .catch((e) => vivo && setRes({ id, data: [], error: e.message }));
    return () => { vivo = false; };
  }, [id]);
  return { data: res.data, loading: res.id !== id, error: res.error, recargar: () => setTick((t) => t + 1) };
}
