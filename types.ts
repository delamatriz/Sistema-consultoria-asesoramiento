export enum Rol { DIRECTOR = 'DIRECTOR', ARQUITECTO = 'ARQUITECTO', CLIENTE = 'CLIENTE' }
export enum EstadoConsulta { CREADA = 'CREADA', EN_ANALISIS = 'EN_ANALISIS', RESPONDIDA = 'RESPONDIDA', ESCALADA = 'ESCALADA', CERRADA = 'CERRADA' }
export enum EstadoEtapa { EN_PROCESO = 'EN_PROCESO', FINALIZADA = 'FINALIZADA' }

export interface InformeFinal {
  diagnóstico: string;
  pautas: string;
  pdf_url: string;
  validado_por_arquitecto: boolean;
  fecha_emisión?: number;
}