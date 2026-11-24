// Planes académicos: edita solo este archivo para cambiar precios y límites.
export const PLANES = [
  { id: "gratuito", nombre: "Gratuito", precio: 0, descripcion: "Ideal para probar la plataforma.", limiteClientes: 10, recomendado: false,
    items: ["Hasta 10 clientes", "Hasta 15 deudas activas", "Registro de abonos", "Dashboard básico"] },
  { id: "basico", nombre: "Básico", precio: 19900, descripcion: "Ideal para pequeños emprendimientos.", limiteClientes: 100, recomendado: true,
    items: ["Hasta 100 clientes", "Deudas ilimitadas", "Registro de abonos", "Historial de pagos", "Dashboard completo"] },
  { id: "profesional", nombre: "Profesional", precio: 39900, descripcion: "Para negocios con mayor volumen.", limiteClientes: null, recomendado: false,
    items: ["Clientes ilimitados", "Deudas ilimitadas", "Abonos ilimitados", "Reportes y estadísticas", "Exportación de información"] },
] as const;
