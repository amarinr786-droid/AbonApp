const cop = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
export const formatCOP = (n: number) => `$${cop.format(n)} COP`;
export const formatFecha = (iso: string) => new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
