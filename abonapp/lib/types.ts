export type EstadoDeuda = "pendiente" | "parcial" | "pagada";
export interface Usuario { id: number; nombre: string; email: string; plan: string }
export interface Cliente { id: number; nombre: string; identificacion: string; telefono: string; email: string; creadoEn: string }
export interface Deuda { id: number; clienteId: number; cliente: string; descripcion: string; valorInicial: number; totalAbonado: number; saldoPendiente: number; estado: EstadoDeuda; fechaLimite: string | null; creadoEn: string }
export interface Abono { id: number; deudaId: number; cliente: string; valor: number; fecha: string; observacion?: string }
export interface ResumenDashboard { clientes: number; totalDeudas: number; totalAbonado: number; saldoPendiente: number }
