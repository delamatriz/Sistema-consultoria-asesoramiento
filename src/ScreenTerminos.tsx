function ScreenTerminos({ onBack }: any) {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 20px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#6E6E73', marginBottom: '20px' }}>Volver</button>
      <h2 style={{ fontSize: 'clamp(18px, 4vw, 26px)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '6px' }}>TERMINOS Y CONDICIONES</h2>
      <p style={{ fontSize: '12px', color: '#6E6E73', marginBottom: '30px' }}>Ultima actualizacion: mayo 2026</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '25px', border: '1px solid #E5E5E7' }}>
          <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.12em', color: '#6E6E73', margin: '0 0 8px 0', textTransform: 'uppercase' }}>1. Consulta Inicial gratuita</p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#1D1D1F', margin: 0 }}>La Consulta Inicial es un servicio orientativo sin costo. El diagnostico emitido ha sido elaborado por un profesional del estudio pero no cuenta con firma profesional certificada, por lo que no constituye un documento tecnico con validez formal ante terceros, administraciones o aseguradoras.</p>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '25px', border: '1px solid #E5E5E7' }}>
          <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.12em', color: '#6E6E73', margin: '0 0 8px 0', textTransform: 'uppercase' }}>2. Alcance de la Consulta Inicial</p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#1D1D1F', margin: 0 }}>El diagnostico se basa en la informacion y fotografias aportadas por el usuario. De La Matriz no se responsabiliza por orientaciones incorrectas derivadas de informacion incompleta o inexacta proporcionada por el consultante.</p>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '25px', border: '1px solid #E5E5E7' }}>
          <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.12em', color: '#6E6E73', margin: '0 0 8px 0', textTransform: 'uppercase' }}>3. Servicios profesionales contratados</p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#1D1D1F', margin: 0 }}>Los servicios abonados son prestados por arquitectos matriculados. Los documentos entregados tienen validez profesional y pueden ser utilizados ante terceros, administraciones publicas y aseguradoras segun corresponda.</p>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '25px', border: '1px solid #E5E5E7' }}>
          <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.12em', color: '#6E6E73', margin: '0 0 8px 0', textTransform: 'uppercase' }}>4. Pagos</p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#1D1D1F', margin: 0 }}>Los pagos se gestionan a traves de plataformas de pago seguras. MercadoPago actua como portal de acceso que habilita multiples formas de pago: tarjetas de credito y debito, transferencias bancarias, efectivo a traves de redes de cobranza y otros medios disponibles segun el pais de residencia. Para usuarios fuera de Uruguay y Argentina se coordinan formas de pago alternativas en forma directa con el estudio.</p>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '25px', border: '1px solid #E5E5E7' }}>
          <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.12em', color: '#6E6E73', margin: '0 0 8px 0', textTransform: 'uppercase' }}>5. Confidencialidad</p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#1D1D1F', margin: 0 }}>Los datos personales y la informacion del inmueble son tratados con estricta confidencialidad y no son compartidos con terceros.</p>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '25px', border: '1px solid #E5E5E7' }}>
          <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.12em', color: '#6E6E73', margin: '0 0 8px 0', textTransform: 'uppercase' }}>6. Propiedad intelectual</p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#1D1D1F', margin: 0 }}>Los informes y documentos generados son propiedad de De La Matriz Arquitectos y del usuario contratante.</p>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '25px', border: '1px solid #E5E5E7' }}>
          <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.12em', color: '#6E6E73', margin: '0 0 8px 0', textTransform: 'uppercase' }}>7. Jurisdiccion</p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#1D1D1F', margin: 0 }}>Estos terminos se rigen por la legislacion uruguaya vigente. Para usuarios de otros paises de la region, De La Matriz Arquitectos opera bajo la normativa profesional uruguaya, siendo Uruguay la jurisdiccion competente para cualquier controversia que pudiera surgir.</p>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '25px', border: '1px solid #E5E5E7' }}>
          <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.12em', color: '#6E6E73', margin: '0 0 8px 0', textTransform: 'uppercase' }}>8. Limitacion de responsabilidad</p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#1D1D1F', margin: 0 }}>De La Matriz Arquitectos no se responsabiliza por danos directos o indirectos derivados de la no implementacion de las recomendaciones tecnicas emitidas, ni por situaciones preexistentes no comunicadas por el usuario al momento de la consulta.</p>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '25px', border: '1px solid #E5E5E7' }}>
          <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.12em', color: '#6E6E73', margin: '0 0 8px 0', textTransform: 'uppercase' }}>9. Proteccion de datos personales</p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#1D1D1F', margin: 0 }}>Los datos personales recopilados se tratan conforme a la Ley 18.331 de Proteccion de Datos Personales de Uruguay. El usuario tiene derecho a acceder, rectificar y cancelar sus datos en cualquier momento contactando al estudio.</p>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '25px', border: '1px solid #E5E5E7' }}>
          <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.12em', color: '#6E6E73', margin: '0 0 8px 0', textTransform: 'uppercase' }}>10. Modificacion de los terminos</p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#1D1D1F', margin: 0 }}>De La Matriz Arquitectos se reserva el derecho de modificar estos terminos en cualquier momento. Los cambios seran notificados a traves de la plataforma y entraran en vigor desde su publicacion.</p>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '25px', border: '1px solid #E5E5E7' }}>
          <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.12em', color: '#6E6E73', margin: '0 0 8px 0', textTransform: 'uppercase' }}>11. Aceptacion</p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#1D1D1F', margin: 0 }}>El uso de la plataforma y la contratacion de cualquier servicio implica la aceptacion plena de estos terminos y condiciones.</p>
        </div>
      </div>
    </div>
  );
}

export default ScreenTerminos;
