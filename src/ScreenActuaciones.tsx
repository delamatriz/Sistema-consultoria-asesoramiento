function ScreenActuaciones({ onBack }: any) {
  const actuaciones = [
    {
      titulo: 'Consulta Inicial',
      descripcion: 'Tu primer contacto con nuestro equipo tecnico. Un arquitecto especialista analiza tu caso, identifica el problema y te orienta sobre el camino a seguir. Sin compromiso, sin costo.'
    },
    {
      titulo: 'Informe Tecnico',
      descripcion: 'Informe certificado por arquitecto matriculado con identificacion tecnica de la patologia, analisis de causas, evaluacion de riesgo y recomendaciones de intervencion. Valido ante administraciones, aseguradoras y terceros.'
    },
    {
      titulo: 'Informe Ampliado',
      descripcion: 'Todo lo del informe tecnico con mayor profundidad de analisis. Incluye antecedentes del inmueble, estudio comparativo de alternativas de intervencion y propuesta tecnica detallada. Ideal para casos complejos.'
    },
    {
      titulo: 'Videollamada Tecnica',
      descripcion: 'Atencion personalizada en tiempo real. Un arquitecto especialista te guia en el relevamiento visual del problema desde donde estes. Rapido, eficiente y sin necesidad de desplazamientos.'
    },
    {
      titulo: 'Visita Presencial con Informe',
      descripcion: 'El arquitecto se desplaza al inmueble para un relevamiento tecnico completo in situ. Diagnostico certificado con informe firmado. La opcion mas completa para casos que requieren presencia profesional.'
    },
    {
      titulo: 'Pautas Terapeuticas',
      descripcion: 'Guia tecnica detallada con las medidas correctivas necesarias para resolver el problema. Especificaciones de materiales, procedimientos de reparacion y criterios de ejecucion.'
    },
    {
      titulo: 'Memoria Descriptiva',
      descripcion: 'Documentacion tecnica completa para obras de mayor entidad. Incluye descripcion detallada de los trabajos, especificaciones constructivas y criterios tecnicos. Base documental para licitaciones y contratos.'
    },
    {
      titulo: 'Costos de Obra',
      descripcion: 'Gestion y analisis de presupuestos de obra. Solicitamos cotizaciones, las evaluamos tecnicamente y te presentamos un analisis comparativo para que puedas tomar la mejor decision con respaldo profesional.'
    },
    {
      titulo: 'Supervision de Obra',
      descripcion: 'Seguimiento y control de las obras, asegurando la calidad, la seguridad y el cumplimiento de las pautas terapeuticas y memoria constructiva. Verificamos que la obra se ejecute con los estandares tecnicos requeridos.'
    },
    {
      titulo: 'Otras Actuaciones',
      descripcion: 'Asesoramiento tecnico especifico, consultas profesionales, gestion de tramites ante organismos publicos, elaboracion de proyectos, certificaciones y cualquier otra actuacion tecnica que requieras. Consultanos.'
    },
  ];
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 20px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#6E6E73', marginBottom: '20px' }}>Volver</button>
      <h2 style={{ fontSize: 'clamp(18px, 4vw, 26px)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '10px' }}>NUESTRAS ACTUACIONES</h2>
      <p style={{ fontSize: '15px', fontWeight: 600, color: '#6E6E73', marginBottom: '30px' }}>Conoce en detalle cada uno de nuestros servicios tecnicos profesionales.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {actuaciones.map((a, i) => (
          <div key={i} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '25px', border: '1px solid #E5E5E7' }}>
            <p style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.12em', color: '#1D1D1F', margin: '0 0 10px 0', textTransform: 'uppercase', borderLeft: '5px solid #B21F24', paddingLeft: '10px' }}>{a.titulo}</p>
            <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#1D1D1F', margin: 0 }}>{a.descripcion}</p>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '12px', color: '#6E6E73', marginTop: '30px', textAlign: 'center' }}>Los plazos de entrega y coordinacion se confirman dentro de las 48 horas de recibido el pago.</p>
    </div>
  );
}
export default ScreenActuaciones;