// Estados posibles de una actuacion a lo largo de su ciclo de vida
export type EstadoActuacion =
  | 'pendiente_pago'
  | 'pago_confirmado'
  | 'en_proceso'
  | 'entregada';
// Etiquetas legibles para mostrar en la UI
export const ETIQUETAS_ESTADO_ACTUACION: Record<EstadoActuacion, string> = {
  pendiente_pago: 'Pendiente de pago',
  pago_confirmado: 'Pago confirmado',
  en_proceso: 'En proceso',
  entregada: 'Entregada',
};
// Colores asociados a cada estado (paleta high-end de la app)
export const COLORES_ESTADO_ACTUACION: Record<EstadoActuacion, string> = {
  pendiente_pago: '#8E8E93',
  pago_confirmado: '#0071E3',
  en_proceso: '#FF9500',
  entregada: '#34C759',
};
// Estructura del documento entregable adjunto a una actuacion
// El documento es siempre opcional: cualquier actuacion puede tener uno o ninguno
export interface DocumentoEntregable {
  url: string;
  nombre_archivo: string;
  tamano_bytes: number;
  fecha_subida: number;
  subido_por: string;
}
// Limite de tamano para documentos subidos a Storage
export const TAMANO_MAXIMO_DOCUMENTO_BYTES = 25 * 1024 * 1024;

// Tipos MIME permitidos para upload
export const TIPOS_MIME_PERMITIDOS = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
