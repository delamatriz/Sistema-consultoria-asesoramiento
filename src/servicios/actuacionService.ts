import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { DocumentoEntregable } from '../tipos/actuacion';
const ESTUDIO_ID = 'DWo8vQwXQ1ScnLc015zU';

export async function tomarActuacion(caseId: string, actuacionId: string): Promise<void> {
  await updateDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId, 'Actuaciones', actuacionId), {
    estado: 'en_proceso',
    fecha_inicio_proceso: serverTimestamp()
  });
}
export async function entregarActuacion(
  caseId: string,
  actuacionId: string,
  documento: DocumentoEntregable | null,
  notas_entrega: string
): Promise<void> {
  await updateDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId, 'Actuaciones', actuacionId), {
    estado: 'entregada',
    fecha_entrega: serverTimestamp(),
    documento_entregable: documento,
    notas_entrega: notas_entrega
  });
}
export function construirDocumentoEntregable(
  url: string,
  nombreArchivo: string,
  tamanoBytes: number,
  subidoPor: string
): DocumentoEntregable {
  return {
    url,
    nombre_archivo: nombreArchivo,
    tamano_bytes: tamanoBytes,
    fecha_subida: Date.now(),
    subido_por: subidoPor
  };
}
