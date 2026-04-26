import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase/config';

const THEME = {
  primary: '#B21F24',
  text: '#1D1D1F',
  button: '#6E6E73',
  background: '#F5F5F7',
  white: '#FFFFFF',
  gray: '#86868B',
  border: '1px solid #E5E5E7',
};

export default function PanelPagos({ estudioId, onBack }: any) {
  const [actuaciones, setActuaciones] = useState<any[]>([]);
  const [, setCasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'recibidos' | 'coordinar' | 'arquitecto'>('recibidos');

  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    try {
      const casosRef = collection(db, 'Estudios', estudioId, 'Casos');
      const casosSnap = await getDocs(casosRef);
      const casosData = casosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCasos(casosData);

      const todasActuaciones: any[] = [];
      for (const caso of casosData) {
        const actRef = collection(db, 'Estudios', estudioId, 'Casos', caso.id, 'Actuaciones');
        const actSnap = await getDocs(actRef);
        actSnap.docs.forEach(d => {
          todasActuaciones.push({ id: d.id, caseId: caso.id, casoData: caso, ...d.data() });
        });
      }
      setActuaciones(todasActuaciones);
    } catch (e) {
      console.error('Error:', e);
    }
    setLoading(false);
  };

  const marcarPagadoUsuario = async (caseId: string, actId: string) => {
    await updateDoc(
      doc(db, 'Estudios', estudioId, 'Casos', caseId, 'Actuaciones', actId),
      { pago_usuario: 'pagado' }
    );
    setActuaciones(prev => prev.map(a => a.id === actId ? { ...a, pago_usuario: 'pagado' } : a));
  };

  const marcarPagadoArquitecto = async (caseId: string, actId: string) => {
    await updateDoc(
      doc(db, 'Estudios', estudioId, 'Casos', caseId, 'Actuaciones', actId),
      { pago_arquitecto: 'pagado' }
    );
    setActuaciones(prev => prev.map(a => a.id === actId ? { ...a, pago_arquitecto: 'pagado' } : a));
  };
  const recibidos = actuaciones.filter(a =>
    a.metodo_pago && a.metodo_pago !== 'Internacional' && a.estado !== 'coordinando_pago'
  );
  const coordinar = actuaciones.filter(a =>
    a.metodo_pago === 'Internacional' || a.estado === 'coordinando_pago'
  );
  const conHonorario = actuaciones.filter(a =>
    a.honorario_arquitecto && a.honorario_arquitecto > 0
  );

  const totalIngresos = recibidos
    .filter(a => a.pago_usuario === 'pagado')
    .reduce((sum, a) => sum + (parseInt((a.precio || '').replace(/[^0-9]/g, '')) || 0), 0);

  const totalPendienteArq = conHonorario
    .filter(a => a.pago_arquitecto !== 'pagado')
    .reduce((sum, a) => sum + (a.honorario_arquitecto || 0), 0);

  const lista = filtro === 'recibidos' ? recibidos
              : filtro === 'coordinar' ? coordinar
              : conHonorario;

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: THEME.background,
    padding: '20px',
    maxWidth: '500px',
    margin: '0 auto',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid ' + THEME.text,
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '1px',
    color: THEME.text,
  };

  const btnBack = {
    background: 'transparent',
    border: '1px solid ' + THEME.button,
    color: THEME.button,
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '10px',
    cursor: 'pointer',
  };
  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <button onClick={onBack} style={btnBack}>← Volver</button>
        <span>TESORERÍA</span>
        <span style={{ width: '60px' }}></span>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: 900, color: THEME.text, marginBottom: '20px' }}>
        PANEL DE PAGOS
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div style={{ padding: '12px', backgroundColor: THEME.white, borderRadius: '8px', border: THEME.border }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: THEME.gray, marginBottom: '4px' }}>INGRESOS COBRADOS</p>
          <p style={{ fontSize: '18px', fontWeight: 900, color: '#2E7D32' }}>
            ${totalIngresos.toLocaleString('es-UY')}
          </p>
        </div>
        <div style={{ padding: '12px', backgroundColor: THEME.white, borderRadius: '8px', border: THEME.border }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: THEME.gray, marginBottom: '4px' }}>HONORARIOS PENDIENTES</p>
          <p style={{ fontSize: '18px', fontWeight: 900, color: THEME.primary }}>
            ${totalPendienteArq.toLocaleString('es-UY')}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {(['recibidos', 'coordinar', 'arquitecto'] as const).map(f => {
          const labels = { recibidos: 'Recibidos', coordinar: 'Coordinar', arquitecto: 'Al arquitecto' };
          const counts = { recibidos: recibidos.length, coordinar: coordinar.length, arquitecto: conHonorario.length };
          const activo = filtro === f;
          return (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '10px',
                fontWeight: 900,
                border: activo ? '2px solid ' + THEME.button : '1px solid #E5E5E7',
                backgroundColor: activo ? THEME.button : THEME.white,
                color: activo ? THEME.white : THEME.button,
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              {labels[f]} ({counts[f]})
            </button>
          );
        })}
      </div>

      {loading ? (
        <p style={{ color: THEME.gray }}>Cargando...</p>
      ) : lista.length === 0 ? (
        <div style={{ padding: '20px', backgroundColor: THEME.white, border: THEME.border, borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ color: THEME.gray }}>No hay registros en esta categoría.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {lista.map(a => (
            <div key={a.id} style={{ padding: '14px', backgroundColor: THEME.white, borderRadius: '8px', border: THEME.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: THEME.gray }}>
                  {a.casoData?.titulo || a.caseId}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: THEME.primary }}>
                  {a.servicio_nombre || 'Sin servicio'}
                </span>
              </div>

              {filtro === 'recibidos' && (
                <>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: THEME.text, marginBottom: '4px' }}>
                    {a.precio || '—'} · {a.metodo_pago || '—'}
                  </p>
                  <p style={{ fontSize: '11px', color: a.pago_usuario === 'pagado' ? '#2E7D32' : '#B21F24' }}>
                    {a.pago_usuario === 'pagado' ? '✅ Acreditado' : '⏳ Pendiente'}
                  </p>
                  {a.pago_usuario !== 'pagado' && (
                    <button
                      onClick={() => marcarPagadoUsuario(a.caseId, a.id)}
                      style={{ marginTop: '8px', padding: '6px 12px', fontSize: '10px', fontWeight: 700, backgroundColor: THEME.button, color: THEME.white, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Marcar como pagado
                    </button>
                  )}
                </>
              )}

              {filtro === 'coordinar' && (
                <>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: THEME.text, marginBottom: '4px' }}>
                    {a.precio || '—'} · {a.casoData?.pais || 'Internacional'}
                  </p>
                  <p style={{ fontSize: '11px', color: THEME.gray, marginBottom: '6px' }}>
                    {a.casoData?.email_usuario || '—'}
                  </p>
                  <button
                    onClick={() => marcarPagadoUsuario(a.caseId, a.id)}
                    style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 700, backgroundColor: THEME.primary, color: THEME.white, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Marcar como pagado
                  </button>
                </>
              )}

              {filtro === 'arquitecto' && (
                <>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: THEME.text, marginBottom: '4px' }}>
                    Honorario: ${(a.honorario_arquitecto || 0).toLocaleString('es-UY')}
                  </p>
                  <p style={{ fontSize: '11px', color: a.pago_arquitecto === 'pagado' ? '#2E7D32' : '#B21F24', marginBottom: '6px' }}>
                    {a.pago_arquitecto === 'pagado' ? '✅ Pagado al arquitecto' : '⏳ Pendiente'}
                  </p>
                  {a.pago_arquitecto !== 'pagado' && (
                    <button
                      onClick={() => marcarPagadoArquitecto(a.caseId, a.id)}
                      style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 700, backgroundColor: THEME.button, color: THEME.white, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Marcar como pagado al arquitecto
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
