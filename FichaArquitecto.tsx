
import React, { useState } from 'react';

// --- SISTEMA DE DISEÑO: IDENTIDAD VISUAL DE ALTA INGENIERÍA ---
const THEME = {
  primary: '#B21F24',      // Crimson Matrix (Acción Quirúrgica)
  text: '#1D1D1F',         // Obsidian Black (Autoridad)
  background: '#F5F5F7',    // Titanium White (Aire Premium)
  white: '#FFFFFF',
  gray: '#6E6E73',         // Gris técnico
  border: '#1D1D1F',       // Bordes Obsidian resaltados
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

export default function App() {
  const [view, setView] = useState('user_home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [passError, setPassError] = useState('');

  const navigate = (to: string) => {
    setView(to);
    setMenuOpen(false);
    setPassError('');
    window.scrollTo(0, 0);
  };

  const handleLogin = (role: string, pass: string) => {
    if (role === 'DIRECTOR' && pass === 'dir123') navigate('director_dashboard');
    else if (role === 'ARQUITECTO' && pass === 'arq123') navigate('arquitecto_dashboard');
    else setPassError('Contraseña incorrecta.');
  };

  const renderContent = () => {
    switch (view) {
      // --- BLOQUE USUARIO: BLINDADO (MVP_USER_FLOW_FINAL) ---
      case 'user_home': return <ScreenHome onStart={() => navigate('user_carga')} onHow={() => navigate('user_como_funciona')} />;
      case 'user_como_funciona': return <ScreenComoFunciona onNext={() => navigate('user_carga')} />;
      case 'user_quienes_somos': return <ScreenQuienesSomos onBack={() => navigate('user_home')} />;
      case 'user_carga': return <ScreenCarga onNext={() => navigate('user_analizando')} />;
      case 'user_analizando': return <ScreenAnalizando onExit={() => navigate('user_historial')} />;
      case 'user_historial': return <ScreenHistorial onSelect={() => navigate('user_detalle')} onBack={() => navigate('user_home')} />;
      case 'user_detalle': return <ScreenDetalle onBack={() => navigate('user_historial')} onEscalate={() => navigate('user_opciones')} />;
      case 'user_opciones': return <ScreenOpciones onSelect={() => navigate('user_seguimiento')} />;
      case 'user_seguimiento': return <ScreenSeguimiento onBack={() => navigate('user_historial')} />;
      case 'user_perfil': return <ScreenPerfil onBack={() => navigate('user_home')} />;
      
      // --- BLOQUE PROFESIONAL: PANELES A, B Y C ---
      case 'login_tecnico': return <LoginTecnico onLogin={handleLogin} error={passError} />;
      case 'arquitecto_dashboard': return <ArchitectDashboard onLogout={() => navigate('user_home')} onCase={() => navigate('arquitecto_ficha')} />;
      case 'arquitecto_ficha': return <FichaConsulta onBack={() => navigate('arquitecto_dashboard')} />;
      case 'director_dashboard': return <DirectorDashboard onLogout={() => navigate('user_home')} />;
      
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
            <div style={{...styles.navItem, color: THEME.primary, borderTop: `1px solid #E5E5E7`, marginTop: '10px'}} onClick={() => navigate('login_tecnico')}>Acceso Profesional 🔐</div>
          </nav>
        )}
      </header>
      <main>{renderContent()}</main>
      <footer style={styles.footer}>DE LA MATRIZ • Arquitectura & Asesoramiento Técnico</footer>
    </div>
  );
}

// --- PANTALLAS DE USUARIO ---

function ScreenHome({ onStart, onHow }: any) {
  return (
    <div style={{...styles.container, textAlign: 'center'}}>
      <h1 style={styles.h1}>ANTES DE GASTAR EN REPARACIONES, ENTENDÉ QUÉ PROBLEMA TIENE TU VIVIENDA.</h1>
      <p style={styles.p}>Asesoramiento online con arquitectos especialistas. Respuesta clara y sin complicaciones.</p>
      <div style={styles.centeredBtnGroup}>
        <button onClick={onStart} style={styles.btnPrimary}>Iniciar mi consulta</button>
        <button onClick={onHow} style={styles.btnSecondaryOutline}>Cómo funciona</button>
      </div>
      <div style={styles.trustBoxCompact}>
        <p style={styles.trustText}>Diagnóstico independiente · Sin compromiso de obra</p>
      </div>
    </div>
  );
}

function ScreenQuienesSomos({ onBack }: any) {
  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>QUIÉNES SOMOS</h2>
      <p style={styles.subtitleBold}>Criterio técnico independiente al servicio de su vivienda.</p>
      <div style={styles.cardInfo}>
        <p style={{lineHeight: '1.7', textAlign: 'justify'}}>
          "Bienvenidos a este espacio de consulta y asesoramiento. Somos un estudio de arquitectura que ha desarrollado una metodología de trabajo especifica que nos identifica en el sector, brindando asesoramiento y respaldo en el área de Rehabilitación Edilicia. Nuestra experiencia en el sector nos ha permitido desarrollar un sistema de trabajo único: dando el respaldo técnico especializado que toda propiedad necesita para tener un diagnostico seguro y la solución acertada, con el apoyo de nuestros técnicos y con la seguridad de obtener el mejor resultado final."
        </p>
      </div>
      <div style={styles.centeredBtnGroup}>
        <button onClick={onBack} style={{...styles.btnSecondaryOutline, marginTop: '30px'}}>Volver al inicio</button>
      </div>
    </div>
  );
}

// --- PANEL DEL ARQUITECTO ---

function ArchitectDashboard({ onCase, onLogout }: any) {
  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>TABLERO TÉCNICO (PANEL A)</h2>
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}><strong>02</strong><br/>Nuevas</div>
        <div style={styles.kpiCard}><strong>05</strong><br/>En análisis</div>
        <div style={{...styles.kpiCard, border: `2px solid ${THEME.primary}`}}><strong style={{color: THEME.primary}}>01</strong><br/>SLA Crítico</div>
      </div>
      <div style={styles.itemCase} onClick={onCase}>
        <strong>CASO #7742 - Humedad Living</strong>
        <p style={{fontSize: '12px', color: THEME.gray}}>Estado: Pendiente de validación</p>
      </div>
      <div style={styles.centeredBtnGroup}>
        <button onClick={onLogout} style={{...styles.btnSecondaryOutline, marginTop: '40px'}}>Cerrar Sesión</button>
      </div>
    </div>
  );
}

function FichaConsulta({ onBack }: any) {
  const [iaDraft, setIaDraft] = useState("Se detecta una posible filtración por capilaridad en el sector inferior de la pared. Se recomienda no realizar reparaciones superficiales sin resolver el origen.");
  
  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.btnBack}>← Volver al Tablero</button>
      <h2 style={styles.h2}>FICHA TÉCNICA (PANEL B)</h2>
      
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px'}}>
        <div style={styles.cardInfoTechnical}>
          <label style={styles.label}>EVIDENCIA DEL USUARIO</label>
          <p style={{fontSize: '13px'}}>"Tengo una mancha de humedad en el living cada vez que llueve..."</p>
          <div style={styles.fileBox}>FOTO_EVIDENCIA.JPG</div>
        </div>
        <div style={styles.cardInfoTechnical}>
          <label style={styles.label}>NOTAS INTERNAS (PRIVADAS)</label>
          <textarea style={styles.textareaInternal} placeholder="Observaciones exclusivas del profesional..." />
        </div>
      </div>

      <div style={styles.cardInfoTechnical}>
        <label style={{...styles.label, color: THEME.primary}}>BORRADOR DE IA (PARA VALIDAR)</label>
        <textarea 
          style={styles.textareaBold} 
          value={iaDraft} 
          onChange={(e) => setIaDraft(e.target.value)} 
        />
        <div style={styles.centeredBtnGroup}>
          <button style={{...styles.btnPrimary, marginTop: '20px'}}>Validar y Enviar al Usuario</button>
        </div>
      </div>
    </div>
  );
}

function DirectorDashboard({ onLogout }: any) {
  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>TORRE DE CONTROL (PANEL C)</h2>
      <div style={styles.centeredBtnGroup}>
        <button onClick={onLogout} style={styles.btnSecondaryOutline}>Cerrar Sesión</button>
      </div>
    </div>
  );
}

// --- LOGIN TECNICO ---
function LoginTecnico({ onLogin, error }: any) {
  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>ACCESO PROFESIONAL</h2>
      <p style={{...styles.subtitleBold, textAlign: 'center'}}>Ingrese al portal de gestión técnica.</p>
      <div style={{...styles.centeredBtnGroup, border: `2px solid ${THEME.text}`, padding: '40px', borderRadius: '4px', backgroundColor: 'transparent'}}>
        <label style={styles.label}>Credencial de Profesional</label>
        <select style={styles.inputFieldBold}>
           <option>ARQUITECTO MATRICULADO</option>
           <option>DIRECTOR DE ESTUDIO</option>
        </select>
        <label style={styles.label}>Contraseña</label>
        <input type="password" placeholder="••••••••" style={styles.inputFieldBold} />
        {error && <p style={{color: THEME.primary, fontWeight: 'bold'}}>{error}</p>}
        <button onClick={() => onLogin('ARQUITECTO', 'arq123')} style={{...styles.btnPrimary, marginTop: '10px'}}>INGRESAR AL PORTAL</button>
      </div>
    </div>
  );
}

// --- ESTILOS ---
const styles: { [key: string]: React.CSSProperties } = {
  header: { backgroundColor: THEME.white, padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid #E5E5E7`, position: 'sticky', top: 0, zIndex: 100 },
  logoText: { fontWeight: 'bold', fontSize: '13px', letterSpacing: '2px' },
  isotipo: { width: '18px', height: '18px', backgroundColor: THEME.primary, borderRadius: '2px' },
  btnMenu: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' },
  navMenu: { position: 'absolute', top: '65px', right: '40px', backgroundColor: THEME.white, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', borderRadius: '8px', minWidth: '220px', zIndex: 1000 },
  navItem: { padding: '15px 25px', cursor: 'pointer', fontSize: '14px', borderBottom: `1px solid #F5F5F7` },
  container: { maxWidth: '850px', margin: '0 auto', padding: '60px 20px' },
  h1: { fontSize: '32px', fontWeight: 800, color: THEME.text, textTransform: 'uppercase', marginBottom: '25px' },
  h2: { fontSize: '24px', fontWeight: 800, color: THEME.primary, textTransform: 'uppercase', marginBottom: '15px', textAlign: 'center' },
  p: { fontSize: '18px', color: THEME.gray, lineHeight: 1.5, marginBottom: '35px' },
  subtitleBold: { fontSize: '16px', fontWeight: 'bold', marginBottom: '25px', color: THEME.text },
  cardInfo: { backgroundColor: THEME.white, padding: '30px', borderRadius: '8px', border: `1px solid #E5E5E7` },
  cardInfoTechnical: { backgroundColor: 'transparent', padding: '25px', borderRadius: '4px', border: `2px solid ${THEME.text}` },
  textareaBold: { width: '100%', height: '120px', padding: '15px', border: `2px solid ${THEME.text}`, borderRadius: '4px', fontSize: '14px', outline: 'none', backgroundColor: 'transparent' },
  textareaInternal: { width: '100%', height: '100px', padding: '10px', border: `1px dashed #D1D1D6`, borderRadius: '4px', fontSize: '12px', outline: 'none', backgroundColor: 'transparent' },
  centeredBtnGroup: { display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px', margin: '0 auto', width: '100%' },
  btnPrimary: { backgroundColor: THEME.primary, color: THEME.white, padding: '18px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', width: '100%' },
  btnSecondaryOutline: { backgroundColor: 'transparent', color: THEME.text, padding: '18px', border: `2px solid #1D1D1F`, borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', fontSize: '12px', width: '100%' },
  footer: { textAlign: 'center', padding: '40px', fontSize: '11px', color: THEME.gray, borderTop: `1px solid #E5E5E7`, marginTop: '40px' },
  label: { fontSize: '10px', fontWeight: 800, color: THEME.gray, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px', display: 'block' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' },
  kpiCard: { backgroundColor: THEME.white, padding: '15px', borderRadius: '8px', border: `1px solid #E5E5E7`, textAlign: 'center', fontSize: '11px' },
  itemCase: { backgroundColor: THEME.white, padding: '20px', borderRadius: '8px', border: `1px solid #E5E5E7`, cursor: 'pointer', marginBottom: '10px' },
  btnBack: { background: 'none', border: 'none', color: THEME.gray, marginBottom: '10px', cursor: 'pointer', fontSize: '12px' },
  fileBox: { marginTop: '15px', padding: '10px', border: `1px solid #E5E5E7`, textAlign: 'center', fontSize: '10px', color: THEME.gray },
  gridSteps: { display: 'grid', gap: '20px', marginBottom: '40px', textAlign: 'left' },
  step: { backgroundColor: THEME.white, padding: '25px', borderRadius: '8px', border: `1px solid #E5E5E7` },
  trustBoxCompact: { marginTop: '30px', padding: '10px 0' },
  trustText: { fontSize: '14px', color: THEME.gray, letterSpacing: '0.5px' },
  captionCenter: { fontSize: '11px', color: THEME.gray, textAlign: 'center', marginTop: '15px' },
  uploadContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
  fileUploadBold: { padding: '15px', border: `2px solid ${THEME.text}`, borderRadius: '4px', textAlign: 'center', color: THEME.text, fontWeight: 'bold', fontSize: '13px' },
  inputFieldBold: { width: '100%', padding: '12px', border: `2px solid ${THEME.text}`, borderRadius: '4px', fontSize: '14px', outline: 'none', backgroundColor: 'transparent', marginBottom: '20px' }
};

// COMPONENTES AUXILIARES
function ScreenComoFunciona({ onNext }: any) { return <div style={styles.container}><h2 style={styles.h2}>UN DIAGNÓSTICO PROFESIONAL EN POCOS PASOS</h2><div style={styles.gridSteps}><div style={styles.step}><strong>1. Contanos el problema</strong><br/>Describí lo que ves y subí fotos.</div></div><div style={styles.centeredBtnGroup}><button onClick={onNext} style={styles.btnPrimary}>Iniciar mi consulta</button></div></div>; }
function ScreenCarga({ onNext }: any) { return <div style={styles.container}><h2 style={styles.h2}>CONTANOS QUÉ LE PASA A TU VIVIENDA</h2><div style={styles.cardInfo}><input placeholder="Nombre completo" style={styles.inputFieldBold} /><textarea placeholder="Descripción..." style={styles.textareaBold} /></div><div style={styles.centeredBtnGroup}><button onClick={onNext} style={{...styles.btnPrimary, marginTop: '30px'}}>Enviar mi consulta</button></div></div>; }
function ScreenAnalizando({ onExit }: any) { return <div style={styles.container}><h2 style={styles.h2}>EN ANÁLISIS</h2><p style={styles.subtitleBold}>SLA 24-48 hs hábiles.</p><div style={styles.centeredBtnGroup}><button onClick={onExit} style={styles.btnPrimary}>Ver mis consultas</button></div></div>; }
function ScreenHistorial({ onSelect, onBack }: any) { return <div style={styles.container}><h2 style={styles.h2}>MIS CONSULTAS</h2><div style={styles.itemCase} onClick={onSelect}><strong>CASO #7742 - Humedad Living</strong></div><div style={styles.centeredBtnGroup}><button onClick={onBack} style={{...styles.btnSecondaryOutline, marginTop: '30px'}}>Volver</button></div></div>; }
function ScreenDetalle({ onBack, onEscalate }: any) { return <div style={styles.container}><h2 style={styles.h2}>DETALLE</h2><div style={styles.centeredBtnGroup}><button onClick={onEscalate} style={styles.btnPrimary}>Opciones de asesoramiento</button></div></div>; }
function ScreenOpciones({ onSelect }: any) { return <div style={styles.container}><h2 style={styles.h2}>OPCIONES</h2><div style={styles.centeredBtnGroup}><button onClick={onSelect} style={styles.btnPrimary}>Visita Técnica</button></div></div>; }
function ScreenSeguimiento({ onBack }: any) { return <div style={styles.container}><h2 style={styles.h2}>SEGUIMIENTO</h2><button onClick={onBack} style={styles.btnSecondaryOutline}>Volver</button></div>; }
function ScreenPerfil({ onBack }: any) { return <div style={styles.container}><h2 style={styles.h2}>MI PERFIL</h2><button onClick={onBack} style={styles.btnSecondaryOutline}>Volver</button></div>; }
