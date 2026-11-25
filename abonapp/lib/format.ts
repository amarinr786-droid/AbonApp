const cop = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
export const formatCOP = (n: number) => `$${cop.format(n)} COP`;
export const formatFecha = (iso: string) => {
  // Las fechas "YYYY-MM-DD" se interpretan como locales para no perder un día por UTC.
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const fecha = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
  return fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};
