import React, { useState, useRef } from 'react';



// --- SISTEMA DE DISEÑO: IDENTIDAD VISUAL DE ALTA INGENIERÍA (LUJO TÉCNICO) ---

const THEME = {

  primary: '#B21F24',      // Crimson Matrix (Acción Quirúrgica)

  text: '#1D1D1F',         // Obsidian Black (Autoridad)

  background: '#F5F5F7',    // Titanium White (Aire Premium)

  white: '#FFFFFF',

  gray: '#6E6E73',         // Gris técnico

  softGray: '#E5E5E7',     // Gris Apple para elementos secundarios

  border: '2px solid #1D1D1F', // Bordes Obsidian 2px

  borderNew: '2px solid #2E7D32',      // Verde (Nuevos)

  borderActive: '2px solid #1565C0',   // Azul (Activos)

  borderCritical: '2px solid #B21F24', // Rojo (Críticos)

  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

};



export default function App() {

  const [view, setView] = useState('user_home');

  const [menuOpen, setMenuOpen] = useState(false);

  const [passError, setPassError] = useState('');

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const [selectedService, setSelectedService] = useState<any>(null);



  const navigate = (to: string, caseId?: string) => {

    setView(to);

    setMenuOpen(false);

    setPassError('');

    if (caseId) setSelectedCaseId(caseId);

    window.scrollTo(0, 0);

  };



  const handleLogin = (role: string, pass: string) => {

    if (role === 'DIRECTOR' && pass === 'dir123') navigate('director_dashboard');

    else if (role === 'ARQUITECTO' && pass === 'arq123') navigate('arquitecto_dashboard');

    else setPassError('Credenciales incorrectas para este estudio profesional.');

  };



  const renderContent = () => {

    switch (view) {

      // --- BLOQUE USUARIO: FLUJO ESTRATÉGICO INMUTABLE ---

      case 'user_home': return <ScreenHome onStart={() => navigate('user_carga')} onHow={() => navigate('user_como_funciona')} />;

      case 'user_como_funciona': return <ScreenComoFunciona onNext={() => navigate('user_carga')} />;

      case 'user_quienes_somos': return <ScreenQuienesSomos onBack={() => navigate('user_home')} />;

      case 'user_carga': return <ScreenCarga onNext={() => navigate('user_analizando')} />;

      case 'user_analizando': return <ScreenAnalizando onExit={() => navigate('user_historial')} />;

      case 'user_historial': return <ScreenHistorial onSelect={(id, status) => {

          if (status === 'RESPONDIDA') navigate('user_detalle', id);

          else if (status === 'EN ANÁLISIS') navigate('user_analizando', id);

          else navigate('user_seguimiento', id);

        }} onBack={() => navigate('user_home')} />;

      case 'user_detalle': return <ScreenDetalle caseId={selectedCaseId} onBack={() => navigate('user_historial')} onEscalate={() => navigate('user_opciones')} />;

      case 'user_opciones': return <ScreenOpciones onSelect={(service) => { setSelectedService(service); navigate('user_pago'); }} onBack={() => navigate('user_detalle')} />;

      case 'user_pago': return <ScreenPago service={selectedService} onConfirm={() => navigate('user_metodo_pago')} onBack={() => navigate('user_opciones')} />;

      case 'user_metodo_pago': return <ScreenMetodoPago onBack={() => navigate('user_pago')} />;

      case 'user_seguimiento': return <ScreenSeguimiento caseId={selectedCaseId} onBack={() => navigate('user_historial')} onActuaciones={() => navigate('user_actuaciones')} />;

      case 'user_actuaciones': return <ScreenOpcionesActuacion onSelect={(service) => { setSelectedService(service); navigate('user_pago'); }} onBack={() => navigate('user_seguimiento')} />;

      case 'user_perfil': return <ScreenPerfil onBack={() => navigate('user_home')} />;



      // --- BLOQUE PROFESIONAL: PANELES DE ALTA GESTIÓN Y AUDITORÍA ---

      case 'login_tecnico': return <LoginProfessional onLogin={handleLogin} error={passError} />;

      case 'arquitecto_dashboard': return <PanelADashboard onCase={(id: string) => navigate('arquitecto_ficha', id)} onLogout={() => navigate('user_home')} />;

      case 'arquitecto_ficha': return <PanelBFicha caseId={selectedCaseId} onBack={() => navigate('arquitecto_dashboard')} onAdvanced={() => navigate('arquitecto_tablero')} />;

      case 'director_dashboard': return <PanelCDirector onCase={(id) => navigate('director_auditoria', id)} onConfig={() => navigate('director_config')} onTeam={() => navigate('director_team')} onLogout={() => navigate('user_home')} onConsultas={() => navigate('director_consultas')} onAssign={() => navigate('director_team')} />;

      case 'director_auditoria': return <PanelBFicha caseId={selectedCaseId} onBack={() => navigate('director_dashboard')} isDirectorView={true} />;

      case 'director_consultas': return <PanelGConsultas onCase={(id) => navigate('director_auditoria', id)} onBack={() => navigate('director_dashboard')} />;

      case 'arquitecto_tablero': return <PanelB1Tablero caseId={selectedCaseId} onBack={() => navigate('arquitecto_ficha')} onUserView={() => navigate('user_seguimiento')} />;

      case 'director_config': return <PanelEConfiguracion onBack={() => navigate('director_dashboard')} onTeam={() => navigate('director_team')} />;

      case 'director_team': return <PanelFGestionEquipo onBack={() => navigate('director_dashboard')} onAssignAction={() => navigate('director_dashboard')} />;

      

      default: return <ScreenHome onStart={() => navigate('user_carga')} />;

    }

  };



  return (

    <div style={{ backgroundColor: THEME.background, minHeight: '100vh', fontFamily: THEME.fontFamily, color: THEME.text }}>

      <header style={styles.header}>

        <div style={styles.logo} onClick={() => navigate('user_home')}>

          <div style={styles.isotipo}></div>

          <span style={styles.logoText}>DE LA MATRIZ <span style={{fontWeight: 300}}>ARQUITECTOS</span></span>

        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} style={styles.btnMenu}>{menuOpen ? '✕' : '☰'}</button>

        {menuOpen && (

          <nav style={styles.navMenu}>

            <div style={styles.navItem} onClick={() => navigate('user_home')}>Inicio</div>

            <div style={styles.navItem} onClick={() => navigate('user_como_funciona')}>Cómo funciona</div>

            <div style={styles.navItem} onClick={() => navigate('user_quienes_somos')}>Quiénes somos</div>

            <div style={styles.navItem} onClick={() => navigate('user_historial')}>Mis consultas</div>

            <div style={styles.navItem} onClick={() => navigate('user_perfil')}>Mi perfil</div>

            <div style={{...styles.navItem, color: THEME.primary, borderTop: `1px solid ${THEME.softGray}`, marginTop: '10px'}} onClick={() => navigate('login_tecnico')}>Acceso Profesional 🔐</div>

          </nav>

        )}

      </header>

      <main>{renderContent()}</main>

      <footer style={styles.footer}>© 2026 DE LA MATRIZ • Arquitectura & Asesoramiento Técnico</footer>

    </div>

  );

}



// --- PANTALLAS DE USUARIO: PURGA TOTAL DE RESIDUOS NUMÉRICOS ---



function ScreenHome({ onStart, onHow }: any) {

  return (

    <div style={{...styles.container, textAlign: 'center'}}>

      <h1 style={styles.h1}>ANTES DE GASTAR EN REPARACIONES, ENTENDÉ QUÉ PROBLEMA TIENE TU VIVIENDA.</h1>

      <p style={styles.p}>Asesoramiento online con arquitectos especialistas. Respuesta clara y sin complicaciones.</p>

      <div style={styles.centeredBtnGroup}>

        <button onClick={onStart} style={styles.btnPrimary}>Iniciar mi consulta</button>

        <button onClick={onHow} style={styles.btnSecondaryOutline}>Cómo funciona</button>

      </div>

      <div style={{...styles.trustBoxCompact, marginTop: '45px'}}>

        <p style={styles.trustText}>Diagnóstico independiente · Sin compromiso de obra</p>

      </div>

    </div>

  );

}



function ScreenComoFunciona({ onNext }: any) {

  return (

    <div style={styles.container}>

      <h2 style={styles.h2}>UN DIAGNÓSTICO PROFESIONAL EN POCOS PASOS</h2>

      <p style={styles.subtitleBold}>Te explicamos cómo funciona el sistema y cuándo decidís cómo seguir.</p>

      <div style={styles.gridSteps}>

        <div style={{...styles.step, border: THEME.border}}>

          <strong>Contanos el problema</strong><br/>

          Describí lo que ves y subí evidencia técnica inicial.

        </div>

        <div style={{...styles.step, border: THEME.border}}>

          <strong>Análisis profesional</strong><br/>

          Un arquitecto especialista del estudio analiza tu caso y evalúa causas técnicas.

        </div>

        <div style={{...styles.step, border: THEME.border}}>

          <strong>Respuesta clara</strong><br/>

          Recibís orientación técnica profesional y próximos pasos recomendados.

        </div>

      </div>

      <button onClick={onNext} style={styles.btnPrimary}>Iniciar mi consulta</button>

    </div>

  );

}



function ScreenQuienesSomos({ onBack }: any) {

  return (

    <div style={styles.container}>

      <h2 style={styles.h2}>QUIÉNES SOMOS</h2>

      <p style={styles.subtitleBold}>Criterio técnico independiente al servicio de su vivienda.</p>

      <div style={{...styles.cardInfo, border: THEME.border}}>

        <p style={{lineHeight: '1.8', textAlign: 'justify', fontStyle: 'italic'}}>

          "Bienvenidos a este espacio de consulta y asesoramiento. Somos un estudio de arquitectura que ha desarrollado una metodología de trabajo específica que nos identifica en el sector, brindando asesoramiento y respaldo en el área de Rehabilitación Edilicia. Nuestra experiencia en el sector nos ha permitido desarrollar un sistema de trabajo único: dando el respaldo técnico especializado que toda propiedad necesita para tener un diagnóstico seguro y la solución acertada, con el apoyo de nuestros técnicos y con la seguridad de obtener el mejor resultado final."

        </p>

      </div>

      <button onClick={onBack} style={{...styles.btnLuxuryBack, marginTop: '30px'}}>Volver al inicio</button>

    </div>

  );

}



function ScreenCarga({ onNext }: any) {

  const photoRef = useRef<HTMLInputElement>(null);

  const [attached, setAttached] = useState({ photos: false });

  return (

    <div style={styles.container}>

      <h2 style={styles.h2}>CONTANOS QUÉ LE PASA A TU VIVIENDA</h2>

      <p style={styles.subtitleBold}>Esta consulta inicial es sin costo y analizada por expertos.</p>

      <div style={{...styles.cardInfo, border: THEME.border}}>

        <label style={styles.label}>DATOS PERSONALES Y CONTACTO</label>

        <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>

          <input placeholder="Nombre completo" style={styles.inputFieldBold} />

          <input placeholder="Email vinculante" style={styles.inputFieldBold} />

        </div>

        <input placeholder="Teléfono de contacto" style={{...styles.inputFieldBold, marginBottom: '25px'}} />

        <label style={styles.label}>REDACCIÓN DEL PROBLEMA</label>

        <textarea placeholder="Ej.: humedad en una pared del living..." style={styles.textareaBold} />

        <label style={styles.label}>EVIDENCIA Y ARCHIVOS ADJUNTOS</label>

        <div style={styles.uploadContainer}>

          <div onClick={() => photoRef.current?.click()} style={{...styles.fileUploadBold, border: THEME.border, backgroundColor: attached.photos ? '#F0FFF0' : 'transparent'}}>

            {attached.photos ? 'Evidencia visual lista' : 'Adjuntar Fotos o Videos'}

            <input type="file" ref={photoRef} style={{display: 'none'}} multiple accept="image/*,video/*" onChange={() => setAttached({...attached, photos: true})} />

          </div>

          <div style={{...styles.fileUploadBold, border: THEME.border, borderColor: THEME.primary, color: THEME.primary}}>Grabar Audio de Consulta</div>

        </div>

      </div>

      <button onClick={onNext} style={{...styles.btnPrimary, marginTop: '30px'}}>Enviar mi consulta profesional</button>

    </div>

  );

}



function ScreenAnalizando({ onExit }: any) {

  return (

    <div style={styles.container}>

      <h2 style={styles.h2}>TU CONSULTA ESTÁ EN ANÁLISIS</h2>

      <div style={{...styles.cardInfo, border: THEME.border}}>

        <label style={styles.label}>TIEMPO DE RESPUESTA PROFESIONAL</label>

        <p>Un arquitecto especialista está validando su expediente técnico. El tiempo estimado de respuesta es de 24 a 48 hs hábiles.</p>

      </div>

      <button onClick={onExit} style={{...styles.btnPrimary, marginTop: '30px'}}>Ver mis consultas</button>

    </div>

  );

}



function ScreenHistorial({ onSelect, onBack }: any) {

  const casos = [

    { id: 'EXP-7742', titulo: 'Humedad Living', estado: 'RESPONDIDA', color: '#E8F5E9', text: '#2E7D32' },

    { id: 'EXP-7760', titulo: 'Fisura Fachada', estado: 'EN ANÁLISIS', color: '#FFFDE7', text: '#F57F17' },

    { id: 'EXP-7810', titulo: 'Supervisión Obra', estado: 'EN CURSO', color: '#F5F5F7', text: '#B21F24' }

  ];

  return (

    <div style={styles.container}>

      <h2 style={styles.h2}>MIS CONSULTAS</h2>

      <p style={styles.subtitleBold}>Archivo personal para seguimiento, memoria y confianza técnica.</p>

      <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>

        {casos.map(c => (

          <div key={c.id} style={{...styles.itemCase, border: THEME.border, backgroundColor: c.color}} onClick={() => onSelect(c.id, c.estado)}>

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>

              <strong>{c.titulo}</strong>

              <span style={{fontSize: '10px', fontWeight: 900, color: c.text, border: `1px solid ${c.text}`, padding: '4px 8px', borderRadius: '4px'}}>{c.estado}</span>

            </div>

          </div>

        ))}

      </div>

      <button onClick={onBack} style={{...styles.btnLuxuryBack, marginTop: '40px'}}>Volver al inicio</button>

    </div>

  );

}



function ScreenDetalle({ caseId, onBack, onEscalate }: any) {

  return (

    <div style={styles.container}>

      <div style={styles.engineeringHeader}><button onClick={onBack} style={styles.btnBack}>← Volver</button><span>Expediente Técnico Profesional</span></div>

      <h2 style={styles.h2}>RESPUESTA DE LA CONSULTA</h2>

      <div style={{...styles.cardInfo, border: THEME.border}}>

        <label style={styles.label}>DIAGNÓSTICO PRELIMINAR ORIENTATIVO</label>

        <p><strong>Causa Probable:</strong> Filtración por capilaridad derivada de falla en barrera hidrófuga original.</p>

        <p style={{marginTop: '15px'}}><strong>Acción Recomendada:</strong> Tratamiento de inyección de resinas hidrofóbicas.</p>

      </div>

      <button onClick={onEscalate} style={{...styles.btnPrimary, marginTop: '20px'}}>Ver opciones de asesoramiento</button>

    </div>

  );

}



function ScreenOpciones({ onSelect, onBack }: any) {

  const options = [

    { id: 'video', level: 'ASESORAMIENTO NIVEL PROFESIONAL', title: 'Video Consulta Técnica', price: '$4.500', desc: 'Aclaración de dudas en tiempo real mediante videollamada.' },

    { id: 'informe', level: 'ASESORAMIENTO NIVEL PROFESIONAL', title: 'Informe Técnico Ampliado', price: '$8.500', desc: 'Documento robusto de alta ingeniería que detalla causas y riesgos.' },

    { id: 'visita', level: 'ASESORAMIENTO NIVEL PROFESIONAL', title: 'Visita Técnica Presencial', price: '$12.000', desc: 'Relevamiento in situ para un diagnóstico confirmado e inspección técnica.' }

  ];

  return (

    <div style={styles.container}>

      <button onClick={onBack} style={styles.btnBack}>← Volver</button>

      <h2 style={styles.h2}>OPCIONES DE ASESORAMIENTO</h2>

      <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>

        {options.map(opt => (

          <div key={opt.id} style={{...styles.cardEng, border: THEME.border}} onClick={() => onSelect(opt)}>

            <div style={{display: 'flex', justifyContent: 'space-between'}}>

              <label style={{...styles.label, color: THEME.primary}}>{opt.level}</label>

              <span style={styles.priceTag}>{opt.price}</span>

            </div>

            <strong>{opt.title}</strong>

            <p style={{fontSize: '13px', color: THEME.gray, marginTop: '8px'}}>{opt.desc}</p>

            <button style={{...styles.btnPrimary, height: '40px', marginTop: '15px', fontSize: '11px'}}>Seleccionar Servicio</button>

          </div>

        ))}

      </div>

    </div>

  );

}



function ScreenOpcionesActuacion({ onSelect, onBack }: any) {

  const actuaciones = [

    { id: 'pautas', title: 'Pautas Terapéuticas', price: '$6.500', desc: 'Guía técnica para reparaciones menores.' },

    { id: 'memoria', title: 'Memoria Descriptiva', price: '$15.000', desc: 'Documentación técnica para obras de mayor entidad.' },

    { id: 'precios', title: 'Pedido de Precios', price: '$5.000', desc: 'Gestión comparativa de presupuestos técnicos.' },

    { id: 'supervision', title: 'Supervisión de los Trabajos', price: '$18.000', desc: 'Acompañamiento profesional in situ durante la ejecución.' },

    { id: 'otras', title: 'Otras Actuaciones', price: '$3.500', desc: 'Gestión técnica personalizada y consultoría específica.' }

  ];

  return (

    <div style={styles.container}>

      <button onClick={onBack} style={styles.btnBack}>← Volver</button>

      <h2 style={styles.h2}>OPCIONES DE ACTUACIONES TÉCNICAS</h2>

      <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>

        {actuaciones.map(act => (

          <div key={act.id} style={{...styles.cardEng, border: THEME.border}} onClick={() => onSelect(act)}>

            <div style={{display: 'flex', justifyContent: 'space-between'}}>

              <strong>{act.title}</strong>

              <span style={styles.priceTag}>{act.price}</span>

            </div>

            <p style={{fontSize: '13px', color: THEME.gray, marginTop: '8px'}}>{act.desc}</p>

            <button style={{...styles.btnPrimary, height: '40px', marginTop: '15px', fontSize: '11px'}}>Solicitar Actuación</button>

          </div>

        ))}

      </div>

    </div>

  );

}



function ScreenPago({ service, onConfirm, onBack }: any) {

  if (!service) return null;

  return (

    <div style={styles.container}>

      <button onClick={onBack} style={styles.btnBack}>← Volver</button>

      <h2 style={styles.h2}>RESUMEN DE SOLICITUD</h2>

      <div style={{...styles.cardInfo, border: THEME.border}}>

        <strong>{service.title}</strong>

        <p style={{fontSize: '14px', marginTop: '10px', color: THEME.gray}}>{service.desc}</p>

        <div style={{padding: '20px', border: '1px solid #E5E5E7', textAlign: 'center', marginTop: '20px'}}>

          <p style={{fontSize: '14px', color: THEME.gray}}>Monto a abonar:</p>

          <p style={{fontSize: '24px', fontWeight: 900, color: THEME.primary}}>{service.price}</p>

          <p style={{fontSize: '10px', fontWeight: 700, marginTop: '10px', color: THEME.gray}}>ESTADO: PENDIENTE DE PAGO</p>

        </div>

      </div>

      <button onClick={onConfirm} style={{...styles.btnPrimary, marginTop: '20px'}}>Confirmar y proceder</button>

    </div>

  );

}



function ScreenMetodoPago({ onBack }: any) {

  return (

    <div style={styles.container}>

      <button onClick={onBack} style={styles.btnBack}>← Volver</button>

      <h2 style={styles.h2}>FORMA DE PAGO</h2>

      <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>

        <div style={{...styles.itemCase, border: THEME.border, padding: '25px', cursor: 'default'}}><strong>Tarjeta de Crédito / Débito</strong></div>

        <div style={{...styles.itemCase, border: THEME.border, padding: '25px', cursor: 'default'}}><strong>Transferencia Bancaria Directa</strong></div>

      </div>

      <div style={{marginTop: '40px', padding: '20px', backgroundColor: THEME.white, border: `1px solid ${THEME.softGray}`, borderRadius: '8px'}}>

        <p style={{fontSize: '14px', lineHeight: '1.6'}}>

          🔒 <strong>Seguridad Técnica:</strong> Las opciones de pago se habilitarán tras la validación administrativa de su expediente profesional.

        </p>

      </div>

    </div>

  );

}



function ScreenSeguimiento({ onBack, onActuaciones }: any) {

  return (

    <div style={styles.container}>

      <div style={styles.engineeringHeader}><button onClick={onBack} style={styles.btnBack}>← Volver</button><span>Dashboard de Supervisión</span></div>

      <h2 style={styles.h2}>ESTADO Y RESPUESTA DE LA ACTUACIÓN</h2>

      <p style={{...styles.subtitleProfessional, marginBottom: '25px'}}>Dashboard de Avance e Inspección Técnica</p>

      <div style={styles.trackerContainer}>

        <div style={{...styles.stepTracker, backgroundColor: 'green'}}>Fase: Coordinación</div>

        <div style={{...styles.stepTracker, backgroundColor: 'gold', color: 'black'}}>Fase: Ejecución</div>

        <div style={{...styles.stepTracker, backgroundColor: 'white', border: '1px solid #E5E5E7', color: THEME.gray}}>Fase: Cierre</div>

      </div>

      <div style={{...styles.cardInfo, border: THEME.border}}>

        <label style={styles.label}>BITÁCORA TÉCNICA DE OBRA</label>

        <div style={styles.bitacoraItem}><strong>Inspección:</strong> El informe de actuación profesional ha sido actualizado. Revise los hitos de obra.</div>

        <label style={{...styles.label, marginTop: '25px'}}>DOCUMENTACIÓN TÉCNICA DISPONIBLE</label>

        <p style={styles.docItem}>📂 Descargar Memoria Descriptiva / Pautas Terapéuticas</p>

      </div>

      <button onClick={onActuaciones} style={{...styles.btnPrimary, marginTop: '30px'}}>Ver Opciones de Actuación Técnica</button>

    </div>

  );

}



function ScreenPerfil({ onBack }: any) {

  return (

    <div style={styles.container}>

      <h2 style={styles.h2}>MI PERFIL</h2>

      <p style={styles.subtitleBold}>Datos de respaldo técnico vinculados a su identidad profesional.</p>

      <div style={{...styles.cardInfo, border: THEME.border}}>

        <label style={styles.label}>INFORMACIÓN PERSONAL Y DE RESPALDO</label>

        <div style={styles.infoRow}><span>Identidad:</span> <strong>Juan Pérez</strong></div>

        <div style={styles.infoRow}><span>Email vinculante:</span> <strong>juan.perez@estudio.com</strong></div>

        <div style={styles.infoRow}><span>Teléfono:</span> <strong>+598 99 123 456</strong></div>

        <div style={styles.infoRow}><span>Inmueble:</span> <strong>Av. Central 1234, Montevideo</strong></div>

      </div>

      <button onClick={onBack} style={{...styles.btnLuxuryBack, marginTop: '30px'}}>Volver al inicio</button>

    </div>

  );

}



// --- BLOQUE PROFESIONAL: PANELES A - G (LUJO TÉCNICO v94.0) ---



function PanelADashboard({ onCase, onLogout }: any) {

  return (

    <div style={styles.containerLarge}>

      <div style={styles.engineeringHeader}>

        <div>

          <h2 style={styles.h2}>TABLERO TÉCNICO · ARQUITECTO</h2>

          <p style={styles.subtitleProfessional}>Gestión operativa de consultas y diagnósticos asignados.</p>

        </div>

        <button onClick={onLogout} style={styles.btnExit}>Salir</button>

      </div>

      <div style={styles.kpiGridCompact}>

        <div style={{...styles.kpiCardSmall, border: THEME.borderNew, cursor: 'pointer'}} onClick={() => onCase('EXP-7760')}>

          <span style={styles.kpiValue}>3</span><span style={styles.kpiLabel}>NUEVOS</span>

        </div>

        <div style={{...styles.kpiCardSmall, border: THEME.borderActive, cursor: 'pointer'}} onClick={() => onCase('EXP-7810')}>

          <span style={styles.kpiValue}>12</span><span style={styles.kpiLabel}>ACTIVOS</span>

        </div>

        <div style={{...styles.kpiCardSmall, border: THEME.borderCritical, cursor: 'pointer'}} onClick={() => alert('Visualizando expedientes críticos...')}>

          <span style={styles.kpiValue}>1</span><span style={styles.kpiLabel}>CRÍTICO</span>

        </div>

      </div>

      <div style={{...styles.itemCase, border: THEME.border}} onClick={() => onCase('EXP-7810')}>

        <strong>Expediente Técnico Activo</strong> | Humedad Living | <span style={{color:THEME.primary}}>EN SEGUIMIENTO</span>

      </div>

    </div>

  );

}



function PanelBFicha({ caseId, onBack, onAdvanced, isDirectorView }: any) {

  return (

    <div style={styles.containerFull}>

      <div style={styles.engineeringHeader}>

        <div>

          <button onClick={onBack} style={styles.btnBack}>← Volver</button>

          <h2 style={styles.h2}>FICHA DE CONSULTA TÉCNICA</h2>

          <p style={styles.subtitleProfessional}>Análisis de evidencia técnica y validación profesional del diagnóstico.</p>

        </div>

        {!isDirectorView && <button onClick={onAdvanced} style={styles.btnPrimarySmall}>Bitácora de Supervisión</button>}

      </div>

      <div style={styles.canvasGridCompact}>

        <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>

          <div style={{...styles.cardEng, border: THEME.border, padding:'20px'}}>

            <h3 style={styles.label}>DATOS DEL CLIENTE</h3>

            <p><strong>Juan Pérez</strong></p>

            <p style={{fontSize:'12px', color:THEME.gray}}>juan.perez@estudio.com | +598 99 123 456</p>

          </div>

          <div style={{...styles.cardEng, border: THEME.border, padding:'20px'}}>

            <h3 style={styles.label}>EVIDENCIA TÉCNICA COMPLETA</h3>

            <label style={{...styles.label, fontSize:'9px'}}>PREGUNTA DEL USUARIO</label>

            <p style={{fontSize:'13px', marginBottom:'20px', fontStyle:'italic', color:THEME.text}}>

              "Tengo una mancha de humedad persistente en el muro del living que gotea cuando hay lluvias fuertes laterales desde hace 6 meses."

            </p>

            <div style={styles.photoGrid}>

              <div style={styles.photoPlaceholder}>FOTO</div>

              <div style={styles.photoPlaceholder}>VIDEO</div>

              <div style={styles.photoPlaceholder}>AUDIO</div>

            </div>

          </div>

        </div>

        <div style={{...styles.cardEng, border: THEME.border, padding:'25px'}}>

          <h3 style={styles.label}>DICTAMEN TÉCNICO PROFESIONAL</h3>

          <div style={styles.dictamenBox}>

            <label style={{...styles.label, color: THEME.primary}}>DIAGNÓSTICO TÉCNICO PROFESIONAL</label>

            <p style={{fontSize: '14px', lineHeight: '1.6'}}>El análisis indica una falla estructural en el sistema de impermeabilización vertical. Se requiere intervención técnica especializada.</p>

          </div>

          {isDirectorView ? (

            <div style={{...styles.statusMonitor, marginTop: '20px'}}>

              <label style={styles.label}>MONITOR DE ESTADO DE RESPUESTA</label>

              <div style={{padding:'20px', border: THEME.borderActive, borderRadius: '4px', textAlign: 'center'}}>

                <span style={{fontWeight: 900, color: '#1565C0'}}>ESTADO: RESPUESTA VALIDADA POR ARQUITECTO</span>

              </div>

            </div>

          ) : (

            <>

              <textarea style={{...styles.textareaExpandable, height:'80px', marginTop: '15px'}} placeholder="Notas internas profesionales (privadas)..." />

              <button style={{...styles.btnPrimary, marginTop: '20px'}}>Validar y Notificar al Usuario</button>

            </>

          )}

        </div>

      </div>

    </div>

  );

}



function PanelB1Tablero({ onBack, onUserView }: any) {

  return (

    <div style={styles.containerFull}>

      <div style={styles.engineeringHeader}>

        <div>

          <button onClick={onBack} style={styles.btnBack}>← Volver</button>

          <h2 style={styles.h2}>CONTROL TÉCNICO · SUPERVISIÓN</h2>

          <p style={styles.subtitleProfessional}>Registro inmutable de hitos de obra y comunicación estratégica.</p>

        </div>

      </div>

      <div style={styles.gridTwoColumns}>

        <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>

          <div style={{...styles.cardEng, border: THEME.border}}>

            <h3 style={styles.label}>EXPEDIENTE DEL CLIENTE</h3>

            <p><strong>Juan Pérez</strong> | Av. Central 1234, Montevideo</p>

          </div>

          <div style={{...styles.cardEng, border: THEME.border}}>

            <label style={styles.label}>NOTAS INTERNAS DEL ARQUITECTO</label>

            <textarea style={{...styles.textareaExpandable, height:'300px'}} placeholder="Bitácora privada de hitos técnicos de obra..." />

          </div>

        </div>

        <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>

          <div style={{...styles.cardEng, border: THEME.border}}>

            <label style={styles.label}>GESTIÓN DOCUMENTAL Y CIERRE</label>

            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>

              <button style={styles.btnPrimaryFull} onClick={onUserView}>Subir Documentación Técnica</button>

              <button style={styles.btnSecondaryOutlineFull} onClick={onUserView}>Finalizar Actuación Técnica</button>

            </div>

          </div>

          <div style={{...styles.cardEng, border: THEME.border}}>

            <label style={styles.label}>INFORME DE ACTUACIÓN PARA EL USUARIO</label>

            <textarea style={{...styles.textareaExpandable, height:'120px'}} placeholder="Este texto alimentará el Dashboard del usuario..." />

            <button style={{...styles.btnPrimaryFull, marginTop:'15px'}} onClick={onUserView}>Publicar Informe al Usuario</button>

          </div>

        </div>

      </div>

    </div>

  );

}



function PanelCDirector({ onCase, onConfig, onTeam, onLogout, onConsultas, onAssign }: any) {

  const casos = [

    { id: 'EXP-7810', cliente: 'Juan Pérez', arq: 'Alberto Canavesi', estado: 'EN CURSO' },

    { id: 'EXP-7760', cliente: 'María Rodríguez', arq: 'Sin Asignar', estado: 'NUEVA' }

  ];

  return (

    <div style={styles.containerLarge}>

      <div style={styles.engineeringHeader}>

        <div>

          <h2 style={styles.h2}>TORRE DE CONTROL · DIRECTOR</h2>

          <p style={styles.subtitleProfessional}>Supervisión global de operaciones y analítica de rendimiento.</p>

        </div>

        <div style={{display:'flex', gap:'15px'}}>

          <button onClick={onTeam} style={styles.btnSecondaryOutlineSmall}>Equipo Técnico</button>

          <button onClick={onConfig} style={styles.btnSecondaryOutlineSmall}>Negocio</button>

          <button onClick={onConsultas} style={styles.btnSecondaryOutlineSmall}>Historial Global</button>

          <button onClick={onLogout} style={styles.btnExit}>Salir</button>

        </div>

      </div>

      <div style={styles.kpiGridDirectorFive}>

        <div style={{...styles.kpiCardDirector, borderLeft: `5px solid #F57F17`}}><strong>5</strong><br/><span>NUEVOS</span></div>

        <div style={{...styles.kpiCardDirector, borderLeft: `5px solid #1565C0`}}><strong>12</strong><br/><span>ACTIVOS</span></div>

        <div style={{...styles.kpiCardDirector, borderLeft: `5px solid #6E6E73`}}><strong>7</strong><br/><span>TERMINADOS</span></div>

        <div style={{...styles.kpiCardDirector, borderLeft: `5px solid #1D1D1F`}}><strong>24</strong><br/><span>TOTALES</span></div>

        <div style={{...styles.kpiCardDirector, borderLeft: `5px solid #2E7D32`}}><strong>$145.000</strong><br/><span>FACTURACIÓN</span></div>

      </div>

      <div style={{marginTop:'40px'}}>

        <h3 style={styles.label}>EXPEDIENTES ACTIVOS · ACCESO TÉCNICO GLOBAL</h3>

        {casos.map(c => (

          <div key={c.id} style={{...styles.itemCase, border: THEME.border}} onClick={() => onCase(c.id)}>

            <div style={{display:'flex', justifyContent:'space-between', alignItems: 'center'}}>

              <span><strong>{c.id}</strong> | {c.cliente}</span>

              <div style={{display:'flex', gap: '20px', alignItems: 'center'}} onClick={(e) => e.stopPropagation()}>

                <span style={{fontSize: '13px', color: THEME.gray}}>Arq: {c.arq}</span>

                <button onClick={onAssign} style={styles.btnPrimaryAction}>Asignar Profesional</button>

                <strong style={{color:THEME.primary, minWidth: '80px', textAlign: 'right'}}>{c.estado}</strong>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}



function PanelEConfiguracion({ onBack, onTeam }: any) {

  return (

    <div style={styles.containerLarge}>

      <div style={styles.engineeringHeader}>

        <div>

          <button onClick={onBack} style={styles.btnBack}>← Volver</button>

          <h2 style={styles.h2}>PARÁMETROS DE NEGOCIO Y BALANCE GLOBAL</h2>

          <p style={styles.subtitleProfessional}>Gestión de tarifario SaaS y analítica de utilidades proyectadas.</p>

        </div>

      </div>

      <div style={styles.gridTwoColumns}>

        <div style={{...styles.cardEng, border: THEME.border}}>

          <label style={styles.label}>TARIFARIO DE SERVICIOS PROFESIONALES</label>

          <div style={styles.configRow}><span>Video Consulta Técnica</span> <input defaultValue="$4.500" style={styles.inputSmall} /></div>

          <div style={styles.configRow}><span>Informe Técnico Ampliado</span> <input defaultValue="$8.500" style={styles.inputSmall} /></div>

          <div style={styles.configRow}><span>Visita Técnica Presencial</span> <input defaultValue="$12.000" style={styles.inputSmall} /></div>

          <div style={styles.configRow}><span>Pautas Terapéuticas</span> <input defaultValue="$6.500" style={styles.inputSmall} /></div>

          <div style={styles.configRow}><span>Memoria Descriptiva</span> <input defaultValue="$15.000" style={styles.inputSmall} /></div>

          <div style={styles.configRow}><span>Pedido de Precios</span> <input defaultValue="$5.000" style={styles.inputSmall} /></div>

          <div style={styles.configRow}><span>Supervisión Técnica</span> <input defaultValue="$18.000" style={styles.inputSmall} /></div>

          <div style={styles.configRow}><span>Otras Actuaciones</span> <input defaultValue="$3.500" style={styles.inputSmall} /></div>

          <button style={{...styles.btnPrimaryFull, marginTop:'20px'}}>Actualizar Tarifario</button>

        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>

          <div style={{...styles.cardEng, border: THEME.border}}>

            <label style={styles.label}>INTELIGENCIA ECONÓMICA DETALLADA</label>

            <div style={styles.billingCard}>

              <div style={styles.infoRow}><span>Ingresos Netos:</span> <strong>$145.000</strong></div>

              <div style={styles.infoRow}><span>Utilidad Proyectada:</span> <strong style={{color:'green'}}>$100.000</strong></div>

              <div style={styles.economicGraphContainer}>

                <div style={{...styles.graphBar, height: '85%', backgroundColor: THEME.primary}} title="Obras"></div>

                <div style={{...styles.graphBar, height: '45%', backgroundColor: '#1565C0'}} title="Consultas"></div>

                <div style={{...styles.graphBar, height: '65%', backgroundColor: '#2E7D32'}} title="Informes"></div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}



function PanelFGestionEquipo({ onBack, onAssignAction }: any) {

  return (

    <div style={styles.containerLarge}>

      <div style={styles.engineeringHeader}>

        <div>

          <button onClick={onBack} style={styles.btnBack}>← Dashboard</button>

          <h2 style={styles.h2}>EQUIPO TÉCNICO · ADMINISTRACIÓN</h2>

          <p style={styles.subtitleProfessional}>Control de capital profesional, roles y carga operativa.</p>

        </div>

      </div>

      <div style={styles.gridTwoColumns}>

        <div style={{...styles.cardEng, border: THEME.border}}>

          <h3 style={styles.label}>GESTIÓN DE CARGA PROFESIONAL</h3>

          <div style={{...styles.infoRowSmall, padding:'15px 0'}}>

            <div><strong>Arq. Alberto Canavesi</strong><br/><span style={{fontSize:'10px', color:THEME.gray}}>Patologías (4 Casos)</span></div>

            <button style={styles.btnPrimaryAction} onClick={onAssignAction}>Asignar al caso</button>

          </div>

          <div style={{...styles.infoRowSmall, padding:'15px 0'}}>

            <div><strong>Arq. Lucía Mendez</strong><br/><span style={{fontSize:'10px', color:THEME.gray}}>Estructuras (2 Casos)</span></div>

            <button style={styles.btnPrimaryAction} onClick={onAssignAction}>Asignar al caso</button>

          </div>

        </div>

        <div style={{...styles.cardEng, border: THEME.border}}>

          <h3 style={styles.label}>INVITACIÓN AL ESTUDIO (WHITE LABEL)</h3>

          <p style={{fontSize:'12px', color:THEME.gray, marginBottom:'15px'}}>Suma profesionales externos bajo su propia identidad visual.</p>

          <input placeholder="Email del Arquitecto" style={{...styles.inputFieldBold, marginBottom:'10px'}} />

          <select style={{...styles.inputFieldBold, marginBottom:'20px'}}>

            <option>Rol: Arquitecto Consultor</option>

            <option>Rol: Director Técnico de Área</option>

          </select>

          <button style={styles.btnPrimaryFull} onClick={() => alert('Invitación blindada enviada.')}>Enviar Invitación</button>

        </div>

      </div>

    </div>

  );

}



function PanelGConsultas({ onCase, onBack }: any) {

  return (

    <div style={styles.containerLarge}>

      <div style={styles.engineeringHeader}><button onClick={onBack} style={styles.btnBack}>← Dashboard</button><h2 style={styles.h2}>HISTORIAL GLOBAL DE CASOS</h2></div>

      <div style={{...styles.cardEng, border: THEME.border}}>

        <table style={styles.tableLujo}>

          <thead><tr><th style={styles.thLujo}>ID CASO</th><th style={styles.thLujo}>CLIENTE</th><th style={styles.thLujo}>ESTADO</th><th style={styles.thLujo}>AUDITORÍA</th></tr></thead>

          <tbody>

            <tr style={styles.trLujo} onClick={() => onCase('EXP-7760')}><td style={styles.tdLujo}>EXP-7760</td><td style={styles.tdLujo}>Juan Pérez</td><td style={styles.tdLujo}>NUEVA</td><td style={styles.tdLujo}><button style={styles.btnPrimarySmall}>Auditar Caso</button></td></tr>

          </tbody>

        </table>

      </div>

    </div>

  );

}



function LoginProfessional({ onLogin, error }: any) {

  const [pass, setPass] = useState('');

  const [role, setRole] = useState('ARQUITECTO');

  return (

    <div style={styles.container}><h2 style={styles.h2}>ACCESO PROFESIONAL BLINDADO</h2><div style={{...styles.cardInfo, border: THEME.border}}><select value={role} onChange={(e) => setRole(e.target.value)} style={{...styles.inputFieldBold, marginBottom: '20px'}}><option value="ARQUITECTO">ARQUITECTO (arq123)</option><option value="DIRECTOR">DIRECTOR (dir123)</option></select><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} style={styles.inputFieldBold} placeholder="••••••" />{error && <p style={{color: THEME.primary}}>{error}</p>}</div><button onClick={() => onLogin(role, pass)} style={{...styles.btnPrimary, marginTop: '20px'}}>Ingresar al Sistema</button></div>

  );

}



// --- ESTILOS DE LUJO TÉCNICO (INGENIERÍA VISUAL v94.0) ---

const styles: { [key: string]: React.CSSProperties } = {

  header: { backgroundColor: THEME.white, padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${THEME.softGray}`, position: 'sticky', top: 0, zIndex: 100 },

  logo: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },

  isotipo: { width: '18px', height: '18px', backgroundColor: THEME.primary, borderRadius: '2px' },

  logoText: { fontWeight: 'bold', fontSize: '13px', letterSpacing: '2px' },

  btnMenu: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' },

  navMenu: { position: 'absolute', top: '65px', right: '40px', backgroundColor: THEME.white, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', borderRadius: '8px', minWidth: '220px', zIndex: 1000 },

  navItem: { padding: '15px 25px', cursor: 'pointer', fontSize: '14px', borderBottom: `1px solid ${THEME.background}` },

  container: { maxWidth: '750px', margin: '0 auto', padding: '60px 20px' },

  containerLarge: { maxWidth: '1000px', margin: '0 auto', padding: '60px 20px' },

  containerFull: { width: '100%', padding: '40px' },

  h1: { fontSize: '32px', fontWeight: 800, color: THEME.text, textTransform: 'uppercase', marginBottom: '25px' },

  h2: { fontSize: '20px', fontWeight: 800, color: THEME.primary, textTransform: 'uppercase', marginBottom: '5px' },

  p: { fontSize: '18px', color: THEME.gray, lineHeight: 1.5, marginBottom: '35px' },

  subtitleBold: { fontSize: '16px', fontWeight: 'bold', marginBottom: '25px', color: THEME.text },

  subtitleProfessional: { fontSize: '12px', color: THEME.gray, marginBottom: '0px' },

  cardInfo: { backgroundColor: THEME.white, padding: '30px', borderRadius: '8px', border: `1px solid ${THEME.softGray}` },

  inputFieldBold: { width: '100%', padding: '12px', border: THEME.border, borderRadius: '4px', fontSize: '14px', outline: 'none', backgroundColor: THEME.white },

  textareaBold: { width: '100%', height: '150px', padding: '15px', border: THEME.border, borderRadius: '4px', fontSize: '16px', outline: 'none', marginBottom: '10px' },

  textareaExpandable: { width: '100%', padding: '15px', border: THEME.border, borderRadius: '4px', fontSize: '14px', outline: 'none', backgroundColor: THEME.white, resize: 'vertical' },

  centeredBtnGroup: { display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px', margin: '0 auto' },

  btnPrimary: { backgroundColor: THEME.primary, color: THEME.white, padding: '18px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', width: '100%' },

  btnPrimaryFull: { backgroundColor: THEME.primary, color: THEME.white, padding: '18px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', width: '100%', textTransform: 'uppercase' },

  btnPrimaryAction: { backgroundColor: THEME.primary, color: THEME.white, padding: '10px 15px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px', minWidth: '150px' },

  btnPrimarySmall: { backgroundColor: THEME.primary, color: THEME.white, padding: '10px 20px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' },

  btnSecondaryOutline: { backgroundColor: 'transparent', color: THEME.text, padding: '18px', border: THEME.border, borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', fontSize: '12px', width: '100%' },

  btnSecondaryOutlineFull: { backgroundColor: 'transparent', color: THEME.text, padding: '18px', border: THEME.border, borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', width: '100%', textTransform: 'uppercase', fontSize: '12px' },

  btnSecondaryOutlineSmall: { backgroundColor: 'transparent', color: THEME.text, padding: '10px 15px', border: THEME.border, borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' },

  btnLuxuryBack: { backgroundColor: THEME.softGray, color: THEME.text, padding: '18px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', fontSize: '12px', width: '100%' },

  label: { fontSize: '10px', fontWeight: 800, color: THEME.gray, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '15px', display: 'block' },

  gridSteps: { display: 'grid', gap: '20px', marginBottom: '40px' },

  step: { backgroundColor: THEME.white, padding: '25px', borderRadius: '8px', border: `1px solid ${THEME.softGray}` },

  footer: { textAlign: 'center', padding: '40px', fontSize: '11px', color: THEME.gray, borderTop: `1px solid ${THEME.softGray}`, marginTop: '40px' },

  itemCase: { backgroundColor: THEME.white, padding: '20px', borderRadius: '8px', cursor: 'pointer', marginBottom: '10px', border: `1px solid ${THEME.softGray}` },

  kpiGridDirectorFive: { display: 'flex', gap: '10px' },

  kpiCardDirector: { flex: 1, backgroundColor: THEME.white, padding: '20px', borderRadius: '4px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' },

  kpiGridCompact: { display: 'flex', gap: '10px', marginBottom: '25px' },

  kpiCardSmall: { flex: 1, padding: '15px', borderRadius: '4px', textAlign: 'center' },

  kpiValue: { fontSize: '18px', fontWeight: 900, display: 'block' },

  kpiLabel: { fontSize: '8px', fontWeight: 800, letterSpacing: '0.5px' },

  btnExit: { background: 'none', border: 'none', color: THEME.gray, cursor: 'pointer', fontSize: '12px' },

  btnBack: { background: 'none', border: 'none', color: THEME.gray, cursor: 'pointer', fontSize: '12px', marginBottom: '10px', display: 'block' },

  engineeringHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', borderBottom: `1px solid ${THEME.softGray}`, paddingBottom: '20px' },

  canvasGridCompact: { display: 'grid', gridTemplateColumns: '350px 1fr', gap: '25px' },

  gridTwoColumns: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },

  cardEng: { backgroundColor: THEME.white, padding: '30px', borderRadius: '8px', border: `1px solid ${THEME.softGray}` },

  infoRow: { display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${THEME.background}`, padding: '12px 0', fontSize: '14px' },

  infoRowSmall: { display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${THEME.background}`, padding: '8px 0', fontSize: '13px', alignItems:'center' },

  bitacoraItem: { borderLeft: `4px solid ${THEME.primary}`, padding: '15px', backgroundColor: THEME.white, fontSize: '13px' },

  docItem: { fontSize: '13px', color: THEME.primary, fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' },

  uploadContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },

  fileUploadBold: { padding: '18px', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },

  tableLujo: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },

  thLujo: { textAlign: 'left', fontSize: '10px', color: THEME.gray, padding: '12px', borderBottom: `2px solid ${THEME.softGray}` },

  tdLujo: { padding: '15px 12px', fontSize: '13px', borderBottom: `1px solid ${THEME.background}` },

  trLujo: { cursor: 'pointer' },

  configRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${THEME.softGray}`, fontSize: '13px' },

  inputSmall: { padding: '8px', border: THEME.border, borderRadius: '4px', width: '100px', textAlign: 'right', fontWeight: 'bold' },

  billingCard: { backgroundColor: '#F9F9F9', padding: '20px', borderRadius: '4px' },

  economicGraphContainer: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '100px', marginTop: '20px', padding: '0 10px', borderBottom: `1px solid ${THEME.softGray}` },

  graphBar: { width: '30px', borderRadius: '2px 2px 0 0' },

  trustBoxCompact: { padding: '10px 0' },

  trustText: { fontSize: '14px', color: THEME.gray, letterSpacing: '0.5px' },

  trackerContainer: { display: 'flex', gap: '5px', marginBottom: '25px' },

  stepTracker: { flex: 1, padding: '12px', fontSize: '10px', textAlign: 'center', borderRadius: '4px', color: THEME.white, fontWeight: 'bold' },

  photoGrid: { display: 'flex', gap: '10px', marginTop: '15px' },

  photoPlaceholder: { width: '80px', height: '80px', backgroundColor: THEME.softGray, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold' },

  statusMonitor: { display: 'flex', flexDirection: 'column', gap: '10px' },

  dictamenBox: { backgroundColor: '#F9F9F9', padding: '20px', borderRadius: '4px', borderLeft: `4px solid #B21F24` },

  priceTag: { color: '#B21F24', fontWeight: 900, fontSize: '14px' }

};

