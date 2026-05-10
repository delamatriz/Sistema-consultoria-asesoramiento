import { useState } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { TAMANO_MAXIMO_DOCUMENTO_BYTES, TIPOS_MIME_PERMITIDOS } from './tipos/actuacion';
interface Props {
  estudioId: string;
  caseId: string;
  actuacionId: string;
  onUploadComplete: (url: string, nombreArchivo: string, tamanoBytes: number) => void;
  onError: (mensaje: string) => void;
}
export default function UploadDocumento({ estudioId, caseId, actuacionId, onUploadComplete, onError }: Props) {
  const [progreso, setProgreso] = useState<number>(0);
  const [subiendo, setSubiendo] = useState<boolean>(false);
  function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!TIPOS_MIME_PERMITIDOS.includes(archivo.type)) {
      onError('Tipo de archivo no permitido. Solo PDF, Word o Excel.');
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_DOCUMENTO_BYTES) {
      onError('El archivo supera el limite de 25 MB.');
      return;
    }
    subirArchivo(archivo);
  }
  function subirArchivo(archivo: File) {
    const storage = getStorage();
    const path = 'Estudios/' + estudioId + '/Casos/' + caseId + '/Actuaciones/' + actuacionId + '/' + archivo.name;
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, archivo);
    setSubiendo(true);
    uploadTask.on('state_changed',
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgreso(pct);
      },
      (error) => {
        setSubiendo(false);
        onError('Error al subir el archivo: ' + error.message);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setSubiendo(false);
        onUploadComplete(url, archivo.name, archivo.size);
      }
    );
  }
  return (
    <div style={{ marginBottom: '8px' }}>
      <label style={{
        display: 'inline-block',
        padding: '8px 16px',
        backgroundColor: '#F5F5F7',
        border: '1px solid #D2D2D7',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 700,
        color: '#1D1D1F',
        cursor: subiendo ? 'not-allowed' : 'pointer',
        opacity: subiendo ? 0.6 : 1
      }}>
        {subiendo ? 'Subiendo ' + progreso + '%...' : 'Adjuntar documento'}
        <input
          type="file"
          accept=".pdf,.docx,.xlsx"
          onChange={handleArchivo}
          disabled={subiendo}
          style={{ display: 'none' }}
        />
      </label>
      {!subiendo && (
        <span style={{ fontSize: '12px', color: '#6E6E73', marginLeft: '10px' }}>
          Ninguno
        </span>
      )}
    </div>
  );
}
