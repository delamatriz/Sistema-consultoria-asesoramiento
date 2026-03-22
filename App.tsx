import React, { useState, useRef, useEffect } from 'react';
import { auth, db } from './firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, collection,
  addDoc, getDocs, query, where, serverTimestamp, updateDoc
} from 'firebase/firestore';

const ESTUDIO_ID = 'DWo8vQwXQ1ScnLc015zU';

const THEME = {
  primary: '#B21F24',
  text: '#1D1D1F',
  background: '#F5F5F7',
  white: '#FFFFFF',
  gray: '#6E6E73',
  softGray: '#E5E5E7',
  border: '2px solid #1D1D1F',
  borderNew: '2px solid #2E7D32',
  borderActive: '2px solid #1565C0',
  borderCritical: '2px solid #B21F24',
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

export default function App() {
  const [view, setView] = useState('user_home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [authError, setAuthError] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userDoc = await getDoc(doc(db, 'Usuarios', user.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data();
          setUserProfile(profile);
          if (profile.rol === 'director') setView('director_dashboard');
          else if (profile.rol === 'arquitecto') setView('arquitecto_dashboard');
          else setView('user_home');
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const navigate = (to: string, caseId?: string) => {
    setView(to);
    setMenuOpen(false);
    setAuthError('');
    if (caseId) setSelectedCaseId(caseId);
    window.scrollTo(0, 0);
  };

  const handleRegister = async (nombre: string, email: string, password: string, telefono: string, direccion: string) => {
    try {
      setAuthError('');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, 'Usuarios', user.uid), {
        nombre,
        email,
        telefono,
        direccion,
        rol: 'usuario',
        estudio_id: ESTUDIO_ID,
        activo: true,
        fecha_registro: serverTimestamp()
      });
      setUserProfile({ nombre, email, telefono, direccion, rol: 'usuario', estudio_id: ESTUDIO_ID });
      navigate('user_home');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') setAuthError('Ese email ya estÃ¡ registrado. IniciÃ¡ sesiÃ³n.');
      else if (error.code === 'auth/weak-password') setAuthError('La contraseÃ±a debe tener al menos 6 caracteres.');
      else setAuthError('Error al registrarse. IntentÃ¡ de nuevo.');
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      setAuthError('');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') setAuthError('No existe una cuenta con ese email.');
      else if (error.code === 'auth/wrong-password') setAuthError('ContraseÃ±a incorrecta.');
      else setAuthError('Error al iniciar sesiÃ³n. VerificÃ¡ tus datos.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('user_home');
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: THEME.fontFamily }}>
      <p style={{ color: THEME.gray }}>Cargando sistema...</p>
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case 'user_home': return <ScreenHome onStart={() => navigate('user_carga')} onHow={() => navigate('user_como_funciona')} userProfile={userProfile} />;
      case 'user_como_funciona': return <ScreenComoFunciona onNext={() => navigate('user_carga')} />;
      case 'user_quienes_somos': return <ScreenQuienesSomos onBack={() => navigate('user_home')} />;
      case 'user_registro': return <ScreenRegistro onRegister={handleRegister} onLogin={() => navigate('login_usuario')} error={authError} />;
      case 'login_usuario': return <ScreenLogin onLogin={handleLogin} onRegister={() => navigate('user_registro')} onForgot={() => navigate('user_recuperar')} error={authError} />;
      case 'user_recuperar': return <ScreenRecuperar onBack={() => navigate('login_usuario')} />;
      case 'user_carga': return <ScreenCarga onNext={() => navigate('user_analizando')} currentUser={currentUser} userProfile={userProfile} onLoginRequired={() => navigate('login_usuario')} />;
      case 'user_analizando': return <ScreenAnalizando onExit={() => navigate('user_historial')} />;
      case 'user_historial': return <ScreenHistorial currentUser={currentUser} onSelect={(id: string, status: string) => {
        if (status === 'RESPONDIDA') navigate('user_detalle', id);
        else if (status === 'EN ANÃLISIS') navigate('user_analizando', id);
        else navigate('user_seguimiento', id);
      }} onBack={() => navigate('user_home')} />;
      case 'user_detalle': return <ScreenDetalle caseId={selectedCaseId} onBack={() => navigate('user_historial')} onEscalate={() => navigate('user_opciones')} />;
      case 'user_opciones': return <ScreenOpciones onSelect={(service) => { setSelectedService(service); navigate('user_pago'); }} onBack={() => navigate('user_detalle')} />;
      case 'user_pago': return <ScreenPago service={selectedService} onConfirm={() => navigate('user_metodo_pago')} onBack={() => navigate('user_opciones')} />;
      case 'user_metodo_pago': return <ScreenMetodoPago onBack={() => navigate('user_pago')} />;
      case 'user_seguimiento': return <ScreenSeguimiento caseId={selectedCaseId} onBack={() => navigate('user_historial')} onActuaciones={() => navigate('user_actuaciones')} />;
      case 'user_actuaciones': return <ScreenOpcionesActuacion onSelect={(service) => { setSelectedService(service); navigate('user_pago'); }} onBack={() => navigate('user_seguimiento')} />;
      case 'user_perfil': return <ScreenPerfil userProfile={userProfile} onBack={() => navigate('user_home')} onLogout={handleLogout} />;
      case 'login_tecnico': return <ScreenLogin onLogin={handleLogin} onRegister={() => navigate('user_registro')} onForgot={() => navigate('user_recuperar')} error={authError} esProfesional={true} />;
      case 'arquitecto_dashboard': return <PanelADashboard currentUser={currentUser} userProfile={userProfile} onCase={(id: string) => navigate('arquitecto_ficha', id)} onLogout={handleLogout} />;
      case 'arquitecto_ficha': return <PanelBFicha caseId={selectedCaseId} onBack={() => navigate('arquitecto_dashboard')} onAdvanced={() => navigate('arquitecto_tablero')} />;
      case 'director_dashboard': return <PanelCDirector currentUser={currentUser} userProfile={userProfile} onCase={(id) => navigate('director_auditoria', id)} onConfig={() => navigate('director_config')} onTeam={() => navigate('director_team')} onLogout={handleLogout} onConsultas={() => navigate('director_consultas')} onAssign={() => navigate('director_team')} />;
      case 'director_auditoria': return <PanelBFicha caseId={selectedCaseId} onBack={() => navigate('director_dashboard')} isDirectorView={true} />;
      case 'director_consultas': return <PanelGConsultas onCase={(id) => navigate('director_auditoria', id)} onBack={() => navigate('director_dashboard')} />;
      case 'arquitecto_tablero': return <PanelB1Tablero caseId={selectedCaseId} onBack={() => navigate('arquitecto_ficha')} onUserView={() => navigate('user_seguimiento')} />;
      case 'director_config': return <PanelEConfiguracion onBack={() => navigate('director_dashboard')} onTeam={() => navigate('director_team')} />;
      case 'director_team': return <PanelFGestionEquipo estudioId={ESTUDIO_ID} onBack={() => navigate('director_dashboard')} onAssignAction={() => navigate('director_dashboard')} />;
      default: return <ScreenHome onStart={() => navigate('user_carga')} onHow={() => navigate('user_como_funciona')} userProfile={userProfile} />;
    }
  };

  return (
    <div style={{ backgroundColor: THEME.background, minHeight: '100vh', fontFamily: THEME.fontFamily, color: THEME.text }}>
      <header style={styles.header}>
        <div style={styles.logo} onClick={() => navigate('user_home')}>
          <div style={styles.isotipo}></div>
          <span style={styles.logoText}>DE LA MATRIZ <span style={{ fontWeight: 300 }}>ARQUITECTOS</span></span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} style={styles.btnMenu}>{menuOpen ? 'âœ•' : 'â˜°'}</button>
        {menuOpen && (
          <nav style={styles.navMenu}>
            <div style={styles.navItem} onClick={() => navigate('user_home')}>Inicio</div>
            <div style={styles.navItem} onClick={() => navigate('user_como_funciona')}>CÃ³mo funciona</div>
            <div style={styles.navItem} onClick={() => navigate('user_quienes_somos')}>QuiÃ©nes somos</div>
            {currentUser ? (
              <>
                <div style={styles.navItem} onClick={() => navigate('user_historial')}>Mis consultas</div>
                <div style={styles.navItem} onClick={() => navigate('user_perfil')}>Mi perfil</div>
                <div style={{ ...styles.navItem, color: THEME.primary }} onClick={handleLogout}>Cerrar sesiÃ³n</div>
              </>
            ) : (
              <>
                <div style={styles.navItem} onClick={() => navigate('login_usuario')}>Iniciar sesiÃ³n</div>
                <div style={{ ...styles.navItem, color: THEME.primary }} onClick={() => navigate('user_registro')}>Registrarse</div>
              </>
            )}
            <div style={{ ...styles.navItem, color: THEME.primary, borderTop: `1px solid ${THEME.softGray}`, marginTop: '10px' }} onClick={() => navigate('login_tecnico')}>Acceso Profesional ðŸ”</div>
          </nav>
        )}
      </header>
      <main>{renderContent()}</main>
      <footer style={styles.footer}>Â© 2026 DE LA MATRIZ â€¢ Arquitectura & Asesoramiento TÃ©cnico</footer>
    </div>
  );
}

// --- PANTALLA REGISTRO ---
function ScreenRegistro({ onRegister, onLogin, error }: any) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!nombre || !email || !password) { return; }
    setLoading(true);
    await onRegister(nombre, email, password, telefono, direccion);
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>CREAR CUENTA</h2>
      <p style={styles.subtitleBold}>Registrate para iniciar tu consulta y acceder a tu historial.</p>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <label style={styles.label}>DATOS PERSONALES</label>
        <input placeholder="Nombre completo *" value={nombre} onChange={e => setNombre(e.target.value)} style={{ ...styles.inputFieldBold, marginBottom: '10px' }} />
        <input placeholder="Email *" type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ ...styles.inputFieldBold, marginBottom: '10px' }} />
        <input placeholder="ContraseÃ±a * (mÃ­nimo 6 caracteres)" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ ...styles.inputFieldBold, marginBottom: '10px' }} />
        <input placeholder="TelÃ©fono de contacto" value={telefono} onChange={e => setTelefono(e.target.value)} style={{ ...styles.inputFieldBold, marginBottom: '10px' }} />
        <input placeholder="DirecciÃ³n del inmueble" value={direccion} onChange={e => setDireccion(e.target.value)} style={{ ...styles.inputFieldBold, marginBottom: '10px' }} />
      </div>
      {error && <p style={{ color: THEME.primary, marginTop: '10px', fontWeight: 700 }}>{error}</p>}
      <button onClick={handleSubmit} disabled={loading} style={{ ...styles.btnPrimary, marginTop: '20px', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Creando cuenta...' : 'Crear mi cuenta'}
      </button>
      <p style={{ textAlign: 'center', marginTop: '20px', color: THEME.gray }}>
        Â¿Ya tenÃ©s cuenta? <span style={{ color: THEME.primary, cursor: 'pointer', fontWeight: 700 }} onClick={onLogin}>IniciÃ¡ sesiÃ³n</span>
      </p>
    </div>
  );
}

// --- PANTALLA LOGIN ---
function ScreenLogin({ onLogin, onRegister, onForgot, error, esProfesional }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    await onLogin(email, password);
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>{esProfesional ? 'ACCESO PROFESIONAL' : 'INICIAR SESIÃ“N'}</h2>
      <p style={styles.subtitleBold}>{esProfesional ? 'Acceso exclusivo para arquitectos y direcciÃ³n del estudio.' : 'IngresÃ¡ con tu cuenta para ver tus consultas.'}</p>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ ...styles.inputFieldBold, marginBottom: '10px' }} />
        <input placeholder="ContraseÃ±a" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ ...styles.inputFieldBold, marginBottom: '10px' }} />
        <p style={{ textAlign: 'right', color: THEME.primary, cursor: 'pointer', fontSize: '13px', fontWeight: 700 }} onClick={onForgot}>Â¿Olvidaste tu contraseÃ±a?</p>
      </div>
      {error && <p style={{ color: THEME.primary, marginTop: '10px', fontWeight: 700 }}>{error}</p>}
      <button onClick={handleSubmit} disabled={loading} style={{ ...styles.btnPrimary, marginTop: '20px', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
      {!esProfesional && (
        <p style={{ textAlign: 'center', marginTop: '20px', color: THEME.gray }}>
          Â¿No tenÃ©s cuenta? <span style={{ color: THEME.primary, cursor: 'pointer', fontWeight: 700 }} onClick={onRegister}>Registrate gratis</span>
        </p>
      )}
    </div>
  );
}

// --- PANTALLA RECUPERAR CONTRASEÃ‘A ---
function ScreenRecuperar({ onBack }: any) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email) return;
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
    setSent(true);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>RECUPERAR CONTRASEÃ‘A</h2>
      {sent ? (
        <div style={{ ...styles.cardInfo, border: THEME.border }}>
          <p style={{ color: '#2E7D32', fontWeight: 700 }}>âœ… Te enviamos un email con las instrucciones para restablecer tu contraseÃ±a.</p>
        </div>
      ) : (
        <div style={{ ...styles.cardInfo, border: THEME.border }}>
          <p style={{ marginBottom: '15px', color: THEME.gray }}>IngresÃ¡ tu email y te enviamos un enlace para restablecer tu contraseÃ±a.</p>
          <input placeholder="Tu email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ ...styles.inputFieldBold }} />
        </div>
      )}
      {!sent && <button onClick={handleSend} style={{ ...styles.btnPrimary, marginTop: '20px' }}>Enviar instrucciones</button>}
      <button onClick={onBack} style={{ ...styles.btnLuxuryBack, marginTop: '15px' }}>Volver al login</button>
    </div>
  );
}

// --- PANTALLA HOME ---
function ScreenHome({ onStart, onHow, userProfile }: any) {
  return (
    <div style={{ ...styles.container, textAlign: 'center' }}>
      <h1 style={styles.h1}>ANTES DE GASTAR EN REPARACIONES, ENTENDÃ‰ QUÃ‰ PROBLEMA TIENE TU VIVIENDA.</h1>
      {userProfile && <p style={{ color: THEME.primary, fontWeight: 700, marginBottom: '10px' }}>Bienvenido, {userProfile.nombre}</p>}
      <p style={styles.p}>Asesoramiento online con arquitectos especialistas. Respuesta clara y sin complicaciones.</p>
      <div style={styles.centeredBtnGroup}>
        <button onClick={onStart} style={styles.btnPrimary}>Iniciar mi consulta</button>
        <button onClick={onHow} style={styles.btnSecondaryOutline}>CÃ³mo funciona</button>
      </div>
      <div style={{ ...styles.trustBoxCompact, marginTop: '45px' }}>
        <p style={styles.trustText}>âœ… Primera consulta sin costo Â· DiagnÃ³stico independiente Â· Sin compromiso de obra</p>
      </div>
    </div>
  );
}

// --- PANTALLA CÃ“MO FUNCIONA ---
function ScreenComoFunciona({ onNext }: any) {
  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>UN DIAGNÃ“STICO PROFESIONAL EN POCOS PASOS</h2>
      <p style={styles.subtitleBold}>La primera consulta es completamente sin costo. Te explicamos cÃ³mo funciona.</p>
      <div style={styles.gridSteps}>
        <div style={{ ...styles.step, border: THEME.border }}>
          <strong>â‘  Registrate y contanos el problema</strong><br /><br />
          CreÃ¡ tu cuenta gratuita, describÃ­ lo que ves y adjuntÃ¡ fotos o videos del problema. Es rÃ¡pido y sin costo.
        </div>
        <div style={{ ...styles.step, border: THEME.border }}>
          <strong>â‘¡ AnÃ¡lisis profesional en 24/48 hs</strong><br /><br />
          Un arquitecto especialista del estudio analiza tu caso, evalÃºa causas tÃ©cnicas y prepara tu diagnÃ³stico.
        </div>
        <div style={{ ...styles.step, border: THEME.border }}>
          <strong>â‘¢ RecibÃ­s tu diagnÃ³stico y decidÃ­s</strong><br /><br />
          RecibÃ­s orientaciÃ³n tÃ©cnica clara. Si necesitÃ¡s profundizar, podÃ©s contratar un informe tÃ©cnico o visita presencial.
        </div>
      </div>
      <div style={{ ...styles.cardInfo, border: `1px solid ${THEME.softGray}`, backgroundColor: '#F0FFF4', marginBottom: '20px' }}>
        <p style={{ color: '#2E7D32', fontWeight: 700, textAlign: 'center' }}>âœ… La primera consulta es completamente GRATIS â€” sin tarjeta, sin compromiso.</p>
      </div>
      <button onClick={onNext} style={styles.btnPrimary}>Iniciar mi consulta gratis</button>
    </div>
  );
}

// --- PANTALLA QUIÃ‰NES SOMOS ---
function ScreenQuienesSomos({ onBack }: any) {
  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>QUIÃ‰NES SOMOS</h2>
      <p style={styles.subtitleBold}>Criterio tÃ©cnico independiente al servicio de su vivienda.</p>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <p style={{ lineHeight: '1.8', textAlign: 'justify', fontStyle: 'italic' }}>
          "Bienvenidos a este espacio de consulta y asesoramiento. Somos un estudio de arquitectura que ha desarrollado una metodologÃ­a de trabajo especÃ­fica que nos identifica en el sector, brindando asesoramiento y respaldo en el Ã¡rea de RehabilitaciÃ³n Edilicia. Nuestra experiencia en el sector nos ha permitido desarrollar un sistema de trabajo Ãºnico: dando el respaldo tÃ©cnico especializado que toda propiedad necesita para tener un diagnÃ³stico seguro y la soluciÃ³n acertada, con el apoyo de nuestros tÃ©cnicos y con la seguridad de obtener el mejor resultado final."
        </p>
      </div>
      <button onClick={onBack} style={{ ...styles.btnLuxuryBack, marginTop: '30px' }}>Volver al inicio</button>
    </div>
  );
}

// --- PANTALLA CARGA ---
function ScreenCarga({ onNext, currentUser, userProfile, onLoginRequired }: any) {
  const photoRef = useRef<HTMLInputElement>(null);
  const [attached, setAttached] = useState({ photos: false });
  const [descripcion, setDescripcion] = useState('');
  const [direccionInmueble, setDireccionInmueble] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!currentUser) { onLoginRequired(); return; }
    if (!descripcion.trim()) { setError('Por favor describÃ­ el problema.'); return; }
    if (!direccionInmueble.trim()) { setError('Por favor ingresÃ¡ la direcciÃ³n del inmueble.'); return; }
    setLoading(true);
    try {
      const casosRef = collection(db, 'Estudios', ESTUDIO_ID, 'Casos');
      await addDoc(casosRef, {
        usuario_id: currentUser.uid,
        usuario_nombre: userProfile?.nombre || '',
        usuario_email: currentUser.email,
        usuario_telefono: userProfile?.telefono || '',
        direccion_inmueble: direccionInmueble,
        descripcion,
        estado: 'NUEVO',
        fecha_creacion: serverTimestamp(),
        arquitecto_asignado: null,
      });
      onNext();
    } catch (e) {
      setError('Error al enviar la consulta. IntentÃ¡ de nuevo.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>CONTANOS QUÃ‰ LE PASA A TU VIVIENDA</h2>
      <p style={styles.subtitleBold}>Esta consulta inicial es sin costo y analizada por expertos.</p>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <label style={styles.label}>DATOS DEL INMUEBLE</label>
        <input placeholder="DirecciÃ³n del inmueble afectado *" value={direccionInmueble} onChange={e => setDireccionInmueble(e.target.value)} style={{ ...styles.inputFieldBold, marginBottom: '15px' }} />
        <label style={styles.label}>DESCRIPCIÃ“N DEL PROBLEMA</label>
        <textarea placeholder="Ej.: humedad en una pared del living, aparece en invierno..." value={descripcion} onChange={e => setDescripcion(e.target.value)} style={styles.textareaBold} />
        <label style={styles.label}>EVIDENCIA FOTOGRÃFICA</label>
        <div style={styles.uploadContainer}>
          <div onClick={() => photoRef.current?.click()} style={{ ...styles.fileUploadBold, border: THEME.border, backgroundColor: attached.photos ? '#F0FFF0' : 'transparent' }}>
            {attached.photos ? 'âœ… Evidencia visual adjunta' : 'Adjuntar Fotos o Videos'}
            <input type="file" ref={photoRef} style={{ display: 'none' }} multiple accept="image/*,video/*" onChange={() => setAttached({ ...attached, photos: true })} />
          </div>
        </div>
      </div>
      {error && <p style={{ color: THEME.primary, marginTop: '10px', fontWeight: 700 }}>{error}</p>}
      <button onClick={handleSubmit} disabled={loading} style={{ ...styles.btnPrimary, marginTop: '30px', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Enviando consulta...' : 'Enviar mi consulta profesional'}
      </button>
    </div>
  );
}

// --- PANTALLA ANALIZANDO ---
function ScreenAnalizando({ onExit }: any) {
  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>TU CONSULTA ESTÃ EN ANÃLISIS</h2>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <label style={styles.label}>TIEMPO DE RESPUESTA PROFESIONAL</label>
        <p>Un arquitecto especialista estÃ¡ validando su expediente tÃ©cnico. El tiempo estimado de respuesta es de <strong>24 a 48 hs hÃ¡biles.</strong></p>
        <p style={{ marginTop: '15px', color: THEME.gray, fontSize: '13px' }}>Te avisaremos por email cuando tu diagnÃ³stico estÃ© listo.</p>
      </div>
      <button onClick={onExit} style={{ ...styles.btnPrimary, marginTop: '30px' }}>Ver mis consultas</button>
    </div>
  );
}

// --- PANTALLA HISTORIAL ---
function ScreenHistorial({ currentUser, onSelect, onBack }: any) {
  const [casos, setCasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    const fetchCasos = async () => {
      const casosRef = collection(db, 'Estudios', ESTUDIO_ID, 'Casos');
      const q = query(casosRef, where('usuario_id', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCasos(data);
      setLoading(false);
    };
    fetchCasos();
  }, [currentUser]);

  const getColor = (estado: string) => {
    if (estado === 'RESPONDIDA') return { bg: '#E8F5E9', text: '#2E7D32' };
    if (estado === 'EN ANÃLISIS') return { bg: '#FFFDE7', text: '#F57F17' };
    return { bg: '#F5F5F7', text: '#B21F24' };
  };

  if (loading) return <div style={styles.container}><p style={{ color: THEME.gray }}>Cargando consultas...</p></div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>MIS CONSULTAS</h2>
      <p style={styles.subtitleBold}>Archivo personal para seguimiento, memoria y confianza tÃ©cnica.</p>
      {casos.length === 0 ? (
        <div style={{ ...styles.cardInfo, border: THEME.border, textAlign: 'center' }}>
          <p style={{ color: THEME.gray }}>TodavÃ­a no tenÃ©s consultas registradas.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {casos.map(c => {
            const colors = getColor(c.estado);
            return (
              <div key={c.id} style={{ ...styles.itemCase, border: THEME.border, backgroundColor: colors.bg }} onClick={() => onSelect(c.id, c.estado)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{c.descripcion?.substring(0, 50)}...</strong>
                  <span style={{ fontSize: '10px', fontWeight: 900, color: colors.text, border: `1px solid ${colors.text}`, padding: '4px 8px', borderRadius: '4px' }}>{c.estado}</span>
                </div>
                <p style={{ fontSize: '12px', color: THEME.gray, marginTop: '5px' }}>{c.direccion_inmueble}</p>
              </div>
            );
          })}
        </div>
      )}
      <button onClick={onBack} style={{ ...styles.btnLuxuryBack, marginTop: '40px' }}>Volver al inicio</button>
    </div>
  );
}

// --- PANTALLA DETALLE ---
function ScreenDetalle({ caseId, onBack, onEscalate }: any) {
  const [caso, setCaso] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId) { setLoading(false); return; }
    const fetchCaso = async () => {
      const caseDoc = await getDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId));
      if (caseDoc.exists()) setCaso({ id: caseDoc.id, ...caseDoc.data() });
      setLoading(false);
    };
    fetchCaso();
  }, [caseId]);

  if (loading) return <div style={styles.container}><p style={{ color: THEME.gray }}>Cargando...</p></div>;

  return (
    <div style={styles.container}>
      <div style={styles.engineeringHeader}><button onClick={onBack} style={styles.btnBack}>â† Volver</button><span>Expediente TÃ©cnico Profesional</span></div>
      <h2 style={styles.h2}>RESPUESTA DE LA CONSULTA</h2>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <label style={styles.label}>DESCRIPCIÃ“N ORIGINAL</label>
        <p>{caso?.descripcion}</p>
        <label style={{ ...styles.label, marginTop: '20px' }}>DIAGNÃ“STICO PRELIMINAR</label>
        <p>{caso?.diagnostico || 'El diagnÃ³stico estÃ¡ siendo preparado por el arquitecto asignado.'}</p>
      </div>
      <button onClick={onEscalate} style={{ ...styles.btnPrimary, marginTop: '20px' }}>Ver opciones de asesoramiento</button>
    </div>
  );
}

// --- PANTALLA PERFIL ---
function ScreenPerfil({ userProfile, onBack, onLogout }: any) {
  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>MI PERFIL</h2>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <label style={styles.label}>DATOS PERSONALES</label>
        <p><strong>Nombre:</strong> {userProfile?.nombre || '-'}</p>
        <p><strong>Email:</strong> {userProfile?.email || '-'}</p>
        <p><strong>TelÃ©fono:</strong> {userProfile?.telefono || '-'}</p>
        <p><strong>DirecciÃ³n:</strong> {userProfile?.direccion || '-'}</p>
      </div>
      <button onClick={onLogout} style={{ ...styles.btnPrimary, marginTop: '20px', backgroundColor: THEME.gray }}>Cerrar sesiÃ³n</button>
      <button onClick={onBack} style={{ ...styles.btnLuxuryBack, marginTop: '15px' }}>Volver al inicio</button>
    </div>
  );
}

// --- PANEL DIRECTOR ---
function PanelCDirector({ currentUser, userProfile, onCase, onConfig, onTeam, onLogout, onConsultas, onAssign }: any) {
  const [casos, setCasos] = useState<any[]>([]);
  const [arquitectos, setArquitectos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [asignando, setAsignando] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const casosRef = collection(db, 'Estudios', ESTUDIO_ID, 'Casos');
      const snapshot = await getDocs(casosRef);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCasos(data);
      const arqQuery = query(collection(db, 'Usuarios'), where('rol', '==', 'arquitecto'), where('estudio_id', '==', ESTUDIO_ID));
      const arqSnap = await getDocs(arqQuery);
      setArquitectos(arqSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error('Error:', e); }
    setLoading(false);
  };

  const asignarArquitecto = async (arquitectoId: string, arquitectoNombre: string) => {
    if (!seleccionado) return;
    setAsignando(true);
    try {
      await updateDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', seleccionado), {
        arquitecto_asignado: arquitectoId, arquitecto_nombre: arquitectoNombre, estado: 'EN ANÁLISIS'
      });
      setCasos(prev => prev.map(c => c.id === seleccionado ? { ...c, arquitecto_asignado: arquitectoId, arquitecto_nombre: arquitectoNombre, estado: 'EN ANÁLISIS' } : c));
      setSeleccionado(null);
    } catch (e) { console.error('Error:', e); }
    setAsignando(false);
  };

  const getColor = (estado: string) => {
    if (estado === 'RESPONDIDA') return { bg: '#E8F5E9', text: '#2E7D32' };
    if (estado === 'EN ANÁLISIS') return { bg: '#FFFDE7', text: '#F57F17' };
    if (estado === 'NUEVO') return { bg: '#E3F2FD', text: '#1565C0' };
    return { bg: '#F5F5F7', text: '#B21F24' };
  };

  return (
    <div style={styles.container}>
      <div style={styles.engineeringHeader}>
        <span>TORRE DE CONTROL — DIRECTOR</span>
        <button onClick={onLogout} style={styles.btnBack}>Cerrar sesión</button>
      </div>
      <h2 style={styles.h2}>Bienvenido, {userProfile?.nombre || 'Director'}</h2>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '30px' }}>
        <button onClick={onConsultas} style={styles.btnPrimary}>Ver todas las consultas</button>
        <button onClick={onTeam} style={{ ...styles.btnSecondaryOutline }}>Gestión de equipo</button>
        <button onClick={onConfig} style={{ ...styles.btnSecondaryOutline }}>Configuración</button>
      </div>
      <label style={styles.label}>CASOS RECIENTES</label>
      {loading ? <p style={{ color: THEME.gray }}>Cargando casos...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {casos.length === 0 ? (
            <div style={{ ...styles.cardInfo, border: THEME.border, textAlign: 'center' }}>
              <p style={{ color: THEME.gray }}>No hay casos registrados aún.</p>
            </div>
          ) : casos.map(c => {
            const colors = getColor(c.estado);
            return (
              <div key={c.id} style={{ ...styles.itemCase, border: THEME.border, backgroundColor: colors.bg }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div onClick={() => onCase(c.id)} style={{ cursor: 'pointer', flex: 1 }}>
                    <strong>{c.usuario_nombre || 'Usuario'}</strong>
                    <p style={{ fontSize: '12px', color: THEME.gray, marginTop: '3px' }}>{c.descripcion?.substring(0, 60)}...</p>
                    <p style={{ fontSize: '11px', color: THEME.gray }}>{c.direccion_inmueble}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 900, color: colors.text, border: `1px solid ${colors.text}`, padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>{c.estado}</span>
                    <button onClick={() => setSeleccionado(c.id)} style={{ fontSize: '10px', fontWeight: 900, backgroundColor: THEME.primary, color: THEME.white, border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                      {c.arquitecto_asignado ? 'REASIGNAR' : 'ASIGNAR'}
                    </button>
                    {c.arquitecto_nombre && <span style={{ fontSize: '10px', color: THEME.gray }}>{c.arquitecto_nombre}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {seleccionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: THEME.white, padding: '35px', borderRadius: '12px', width: '90%', maxWidth: '420px', border: THEME.border }}>
            <h3 style={{ margin: '0 0 8px 0', fontWeight: 900 }}>ASIGNAR ARQUITECTO</h3>
            <p style={{ color: THEME.gray, fontSize: '13px', marginBottom: '25px' }}>Seleccioná el profesional responsable para este caso.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {arquitectos.length === 0 ? <p style={{ color: THEME.gray }}>No hay arquitectos registrados.</p> :
                arquitectos.map(arq => (
                  <button key={arq.id} onClick={() => asignarArquitecto(arq.id, arq.nombre)} disabled={asignando}
                    style={{ padding: '15px 20px', textAlign: 'left', border: THEME.border, borderRadius: '8px', cursor: 'pointer', background: THEME.white, fontSize: '14px', fontWeight: 700, opacity: asignando ? 0.7 : 1 }}>
                    {arq.nombre}
                    <span style={{ display: 'block', fontSize: '11px', color: THEME.gray, fontWeight: 400, marginTop: '3px' }}>{arq.email}</span>
                  </button>
                ))}
              <button onClick={() => setSeleccionado(null)} style={{ marginTop: '10px', border: 'none', background: 'none', color: THEME.gray, cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// --- PANEL ARQUITECTO DASHBOARD ---
function PanelADashboard({ currentUser, userProfile, onCase, onLogout }: any) {
  const [casos, setCasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const fetchCasos = async () => {
      const casosRef = collection(db, 'Estudios', ESTUDIO_ID, 'Casos');
      const q = query(casosRef, where('arquitecto_asignado', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCasos(data);
      setLoading(false);
    };
    fetchCasos();
  }, [currentUser]);

  return (
    <div style={styles.container}>
      <div style={styles.engineeringHeader}>
        <span>PANEL ARQUITECTO</span>
        <button onClick={onLogout} style={styles.btnBack}>Cerrar sesiÃ³n</button>
      </div>
      <h2 style={styles.h2}>Bienvenido, {userProfile?.nombre || 'Arquitecto'}</h2>
      <label style={styles.label}>CASOS ASIGNADOS</label>
      {loading ? <p style={{ color: THEME.gray }}>Cargando casos...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {casos.length === 0 ? (
            <div style={{ ...styles.cardInfo, border: THEME.border, textAlign: 'center' }}>
              <p style={{ color: THEME.gray }}>No tenÃ©s casos asignados actualmente.</p>
            </div>
          ) : casos.map(c => (
            <div key={c.id} style={{ ...styles.itemCase, border: THEME.border }} onClick={() => onCase(c.id)}>
              <strong>{c.usuario_nombre || 'Usuario'}</strong>
              <p style={{ fontSize: '12px', color: THEME.gray, marginTop: '3px' }}>{c.descripcion?.substring(0, 60)}...</p>
              <span style={{ fontSize: '10px', fontWeight: 900, color: THEME.primary }}>{c.estado}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- PANTALLAS RESTANTES SIN CAMBIOS ---
function ScreenOpciones({ onSelect, onBack }: any) {
  const options = [
    { id: 'video', title: 'Video Consulta TÃ©cnica', price: '$4.500', desc: 'AclaraciÃ³n de dudas en tiempo real mediante videollamada.' },
    { id: 'informe', title: 'Informe TÃ©cnico Ampliado', price: '$8.500', desc: 'Documento robusto de alta ingenierÃ­a que detalla causas y riesgos.' },
    { id: 'visita', title: 'Visita TÃ©cnica Presencial', price: '$12.000', desc: 'Relevamiento in situ para un diagnÃ³stico confirmado e inspecciÃ³n tÃ©cnica.' }
  ];
  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.btnBack}>â† Volver</button>
      <h2 style={styles.h2}>OPCIONES DE ASESORAMIENTO</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {options.map(opt => (
          <div key={opt.id} style={{ ...styles.cardEng, border: THEME.border }} onClick={() => onSelect(opt)}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{opt.title}</strong>
              <span style={styles.priceTag}>{opt.price}</span>
            </div>
            <p style={{ fontSize: '13px', color: THEME.gray, marginTop: '8px' }}>{opt.desc}</p>
            <button style={{ ...styles.btnPrimary, height: '40px', marginTop: '15px', fontSize: '11px' }}>Seleccionar Servicio</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenOpcionesActuacion({ onSelect, onBack }: any) {
  const actuaciones = [
    { id: 'pautas', title: 'Pautas TerapÃ©uticas', price: '$6.500', desc: 'GuÃ­a tÃ©cnica para reparaciones menores.' },
    { id: 'memoria', title: 'Memoria Descriptiva', price: '$15.000', desc: 'DocumentaciÃ³n tÃ©cnica para obras de mayor entidad.' },
    { id: 'precios', title: 'Pedido de Precios', price: '$5.000', desc: 'GestiÃ³n comparativa de presupuestos tÃ©cnicos.' },
    { id: 'supervision', title: 'SupervisiÃ³n de los Trabajos', price: '$18.000', desc: 'AcompaÃ±amiento profesional in situ durante la ejecuciÃ³n.' },
    { id: 'otras', title: 'Otras Actuaciones', price: '$3.500', desc: 'GestiÃ³n tÃ©cnica personalizada y consultorÃ­a especÃ­fica.' }
  ];
  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.btnBack}>â† Volver</button>
      <h2 style={styles.h2}>OPCIONES DE ACTUACIONES TÃ‰CNICAS</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {actuaciones.map(act => (
          <div key={act.id} style={{ ...styles.cardEng, border: THEME.border }} onClick={() => onSelect(act)}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{act.title}</strong>
              <span style={styles.priceTag}>{act.price}</span>
            </div>
            <p style={{ fontSize: '13px', color: THEME.gray, marginTop: '8px' }}>{act.desc}</p>
            <button style={{ ...styles.btnPrimary, height: '40px', marginTop: '15px', fontSize: '11px' }}>Solicitar ActuaciÃ³n</button>
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
      <button onClick={onBack} style={styles.btnBack}>â† Volver</button>
      <h2 style={styles.h2}>RESUMEN DE SOLICITUD</h2>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <strong>{service.title}</strong>
        <p style={{ fontSize: '14px', marginTop: '10px', color: THEME.gray }}>{service.desc}</p>
        <div style={{ padding: '20px', border: '1px solid #E5E5E7', textAlign: 'center', marginTop: '20px' }}>
          <p style={{ fontSize: '14px', color: THEME.gray }}>Monto a abonar:</p>
          <p style={{ fontSize: '24px', fontWeight: 900, color: THEME.primary }}>{service.price}</p>
          <p style={{ fontSize: '10px', fontWeight: 700, marginTop: '10px', color: THEME.gray }}>ESTADO: PENDIENTE DE PAGO</p>
        </div>
      </div>
      <button onClick={onConfirm} style={{ ...styles.btnPrimary, marginTop: '20px' }}>Confirmar y proceder al pago</button>
    </div>
  );
}

function ScreenMetodoPago({ onBack }: any) {
  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.btnBack}>â† Volver</button>
      <h2 style={styles.h2}>FORMA DE PAGO</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ ...styles.itemCase, border: THEME.border, padding: '25px', cursor: 'default' }}><strong>ðŸ’³ Tarjeta de CrÃ©dito / DÃ©bito</strong></div>
        <div style={{ ...styles.itemCase, border: THEME.border, padding: '25px', cursor: 'default' }}><strong>ðŸ¦ Transferencia Bancaria Directa</strong></div>
        <div style={{ ...styles.itemCase, border: THEME.border, padding: '25px', cursor: 'default' }}><strong>ðŸ“± Mercado Pago</strong></div>
        <div style={{ ...styles.itemCase, border: THEME.border, padding: '25px', cursor: 'default' }}><strong>ðŸª ABITAB / RedPagos</strong></div>
      </div>
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: THEME.white, border: `1px solid ${THEME.softGray}`, borderRadius: '8px' }}>
        <p style={{ fontSize: '13px', color: THEME.gray, textAlign: 'center' }}>El estudio se pondrÃ¡ en contacto para coordinar el pago y confirmar el servicio.</p>
      </div>
    </div>
  );
}

function ScreenSeguimiento({ caseId, onBack, onActuaciones }: any) {
  const [caso, setCaso] = useState<any>(null);
  useEffect(() => {
    if (!caseId) return;
    getDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId)).then(d => {
      if (d.exists()) setCaso({ id: d.id, ...d.data() });
    });
  }, [caseId]);
  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.btnBack}>â† Volver</button>
      <h2 style={styles.h2}>SEGUIMIENTO DE CONSULTA</h2>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <label style={styles.label}>ESTADO ACTUAL</label>
        <p><strong>{caso?.estado || 'EN CURSO'}</strong></p>
        <label style={{ ...styles.label, marginTop: '15px' }}>DESCRIPCIÃ“N</label>
        <p>{caso?.descripcion || '-'}</p>
      </div>
      <button onClick={onActuaciones} style={{ ...styles.btnPrimary, marginTop: '20px' }}>Ver actuaciones tÃ©cnicas</button>
    </div>
  );
}

function PanelBFicha({ caseId, onBack, onAdvanced, isDirectorView }: any) {
  const [caso, setCaso] = useState<any>(null);
  const [notaInterna, setNotaInterna] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (!caseId) return;
    getDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId)).then(d => {
      if (d.exists()) {
        const data = { id: d.id, ...d.data() } as any;
        setCaso(data);
        setNotaInterna(data.nota_interna || '');
        setDiagnostico(data.diagnostico || '');
      }
    });
  }, [caseId]);

  const handleValidarYNotificar = async () => {
    if (!diagnostico.trim()) return;
    setGuardando(true);
    try {
      await updateDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId), {
        diagnostico,
        nota_interna: notaInterna,
        estado: 'RESPONDIDA',
        fecha_respuesta: serverTimestamp()
      });
      setEnviado(true);
      setCaso((prev: any) => ({ ...prev, estado: 'RESPONDIDA' }));
    } catch (e) { console.error('Error:', e); }
    setGuardando(false);
  };

  const handleGuardarNota = async () => {
    setGuardando(true);
    try {
      await updateDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId), {
        nota_interna: notaInterna,
        diagnostico
      });
    } catch (e) { console.error('Error:', e); }
    setGuardando(false);
  };

  if (!caso) return <div style={styles.container}><p style={{ color: THEME.gray }}>Cargando ficha...</p></div>;

  return (
    <div style={{ ...styles.container, backgroundColor: THEME.background }}>
      <div style={styles.engineeringHeader}>
        <button onClick={onBack} style={styles.btnBack}>Volver</button>
        <span>{isDirectorView ? 'Vista Director' : 'Ficha Técnica'}</span>
        {!isDirectorView && onAdvanced && (
          <button onClick={onAdvanced} style={{ ...styles.btnPrimary, width: 'auto', padding: '8px 16px', fontSize: '11px' }}>
            Bitácora de Supervisión
          </button>
        )}
      </div>

      <h2 style={styles.h2}>FICHA DE CONSULTA TÉCNICA</h2>
      <p style={styles.subtitleBold}>Análisis de evidencia técnica y validación profesional del diagnóstico.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>

        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

          <div style={{ ...styles.cardInfo, border: THEME.border }}>
            <label style={styles.label}>DATOS DEL EXPEDIENTE</label>
            <p style={{ fontWeight: 700, fontSize: '15px', margin: '0 0 4px 0' }}>{caso.usuario_nombre}</p>
            <p style={{ fontSize: '13px', color: THEME.gray, margin: '0 0 2px 0' }}>{caso.usuario_email}</p>
            {caso.usuario_telefono && <p style={{ fontSize: '13px', color: THEME.gray, margin: '0 0 10px 0' }}>{caso.usuario_telefono}</p>}
            <div style={{ borderTop: `1px solid ${THEME.softGray}`, paddingTop: '10px', marginTop: '5px' }}>
              <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: THEME.gray, margin: '0 0 4px 0' }}>INMUEBLE</p>
              <p style={{ fontSize: '13px', margin: '0 0 10px 0' }}>{caso.direccion_inmueble || '-'}</p>
            </div>
            <div style={{ borderTop: `1px solid ${THEME.softGray}`, paddingTop: '10px' }}>
              <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: THEME.gray, margin: '0 0 8px 0' }}>DESCRIPCIÓN DEL PROBLEMA</p>
              <p style={{ fontSize: '14px', lineHeight: '1.6', fontStyle: 'italic', margin: 0 }}>"{caso.descripcion}"</p>
            </div>
            <div style={{ borderTop: `1px solid ${THEME.softGray}`, paddingTop: '10px', marginTop: '10px' }}>
              <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: THEME.gray, margin: '0 0 6px 0' }}>ESTADO</p>
              <span style={{ fontSize: '11px', fontWeight: 900, padding: '4px 10px', borderRadius: '4px', backgroundColor: caso.estado === 'RESPONDIDA' ? '#E8F5E9' : caso.estado === 'EN ANÁLISIS' ? '#FFFDE7' : '#E3F2FD', color: caso.estado === 'RESPONDIDA' ? '#2E7D32' : caso.estado === 'EN ANÁLISIS' ? '#F57F17' : '#1565C0' }}>
                {caso.estado}
              </span>
            </div>
          </div>

          {caso.diagnostico_ia && (
            <div style={{ ...styles.cardInfo, border: '2px solid #1565C0', backgroundColor: '#F0F4FF' }}>
              <label style={{ ...styles.label, color: '#1565C0' }}>PRE-DIAGNÓSTICO IA</label>
              <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0, color: THEME.text }}>{caso.diagnostico_ia}</p>
            </div>
          )}

        </div>

        {/* Columna derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

          <div style={{ ...styles.cardInfo, border: `2px solid ${THEME.primary}` }}>
            <label style={{ ...styles.label, color: THEME.primary }}>DIAGNÓSTICO TÉCNICO PROFESIONAL</label>
            {isDirectorView ? (
              <p style={{ fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{caso.diagnostico || 'Pendiente de diagnóstico.'}</p>
            ) : (
              <textarea
                placeholder="Redacta el DIAGNÓSTICO TÉCNICO PROFESIONAL para el usuario..."
                value={diagnostico}
                onChange={e => setDiagnostico(e.target.value)}
                style={{ ...styles.textareaBold, minHeight: '160px', borderColor: THEME.primary }}
                disabled={caso.estado === 'RESPONDIDA'}
              />
            )}
          </div>

          <div style={{ ...styles.cardInfo, border: THEME.border }}>
            <label style={styles.label}>NOTAS INTERNAS PRIVADAS</label>
            <p style={{ fontSize: '11px', color: THEME.gray, margin: '0 0 8px 0' }}>Estas notas NO son visibles para el usuario.</p>
            {isDirectorView ? (
              <p style={{ fontSize: '13px', color: THEME.gray, fontStyle: 'italic', margin: 0 }}>{caso.nota_interna || 'Sin notas internas.'}</p>
            ) : (
              <textarea
                placeholder="Notas internas profesionales (privadas)..."
                value={notaInterna}
                onChange={e => setNotaInterna(e.target.value)}
                style={{ ...styles.textareaBold, minHeight: '100px' }}
              />
            )}
          </div>

          {!isDirectorView && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {enviado || caso.estado === 'RESPONDIDA' ? (
                <div style={{ padding: '15px', backgroundColor: '#E8F5E9', border: '2px solid #2E7D32', borderRadius: '8px', textAlign: 'center' }}>
                  <p style={{ color: '#2E7D32', fontWeight: 900, margin: 0 }}>Diagnóstico validado y enviado al usuario</p>
                </div>
              ) : (
                <>
                  <button onClick={handleGuardarNota} disabled={guardando} style={{ ...styles.btnSecondaryOutline, opacity: guardando ? 0.7 : 1 }}>
                    {guardando ? 'Guardando...' : 'Guardar borrador'}
                  </button>
                  <button onClick={handleValidarYNotificar} disabled={guardando || !diagnostico.trim()} style={{ ...styles.btnPrimary, opacity: (guardando || !diagnostico.trim()) ? 0.7 : 1 }}>
                    {guardando ? 'Enviando...' : 'VALIDAR Y NOTIFICAR AL USUARIO'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function PanelB1Tablero({ caseId, onBack, onUserView }: any) {
  return (
    <div style={styles.container}>
      <div style={styles.engineeringHeader}><button onClick={onBack} style={styles.btnBack}>â† Volver</button><span>Tablero TÃ©cnico</span></div>
      <h2 style={styles.h2}>TABLERO DE SUPERVISIÃ“N</h2>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <p style={{ color: THEME.gray }}>MÃ³dulo de supervisiÃ³n tÃ©cnica â€” en desarrollo.</p>
      </div>
    </div>
  );
}

function PanelGConsultas({ onCase, onBack }: any) {
  const [casos, setCasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCasos = async () => {
      const casosRef = collection(db, 'Estudios', ESTUDIO_ID, 'Casos');
      const snapshot = await getDocs(casosRef);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCasos(data);
      setLoading(false);
    };
    fetchCasos();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.engineeringHeader}><button onClick={onBack} style={styles.btnBack}>â† Volver</button><span>Historial Global</span></div>
      <h2 style={styles.h2}>TODAS LAS CONSULTAS</h2>
      {loading ? <p style={{ color: THEME.gray }}>Cargando...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {casos.length === 0 ? (
            <p style={{ color: THEME.gray }}>No hay consultas registradas aÃºn.</p>
          ) : casos.map(c => (
            <div key={c.id} style={{ ...styles.itemCase, border: THEME.border }} onClick={() => onCase(c.id)}>
              <strong>{c.usuario_nombre || 'Usuario'}</strong>
              <p style={{ fontSize: '12px', color: THEME.gray }}>{c.descripcion?.substring(0, 60)}...</p>
              <span style={{ fontSize: '10px', fontWeight: 900, color: THEME.primary }}>{c.estado}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PanelEConfiguracion({ onBack, onTeam }: any) {
  return (
    <div style={styles.container}>
      <div style={styles.engineeringHeader}><button onClick={onBack} style={styles.btnBack}>â† Volver</button><span>ConfiguraciÃ³n</span></div>
      <h2 style={styles.h2}>CONFIGURACIÃ“N DEL ESTUDIO</h2>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <p style={{ color: THEME.gray }}>ConfiguraciÃ³n de precios y parÃ¡metros del estudio â€” prÃ³ximamente.</p>
      </div>
      <button onClick={onTeam} style={{ ...styles.btnPrimary, marginTop: '20px' }}>GestiÃ³n de Equipo</button>
    </div>
  );
}

function PanelFGestionEquipo({ estudioId, onBack, onAssignAction }: any) {
  const [arquitectos, setArquitectos] = useState<any[]>([]);
  const [casos, setCasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInvitacion, setEmailInvitacion] = useState('');
  const [nombreInvitacion, setNombreInvitacion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const arqQuery = query(
        collection(db, 'Usuarios'),
        where('rol', '==', 'arquitecto'),
        where('estudio_id', '==', estudioId)
      );
      const arqSnap = await getDocs(arqQuery);
      const arqData = arqSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setArquitectos(arqData);

      const casosRef = collection(db, 'Estudios', estudioId, 'Casos');
      const casosSnap = await getDocs(casosRef);
      const casosData = casosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCasos(casosData);
    } catch (e) {
      console.error('Error:', e);
    }
    setLoading(false);
  };

  const getCasosCount = (arquitectoId: string) => {
    return casos.filter(c => c.arquitecto_asignado === arquitectoId && c.estado !== 'RESPONDIDA').length;
  };

  const handleInvitar = async () => {
    if (!emailInvitacion || !nombreInvitacion) {
      setMensaje('Por favor completÃ¡ nombre y email.');
      return;
    }
    setEnviando(true);
    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const tempPassword = 'Temp' + Math.random().toString(36).slice(2, 8) + '!';
      const userCredential = await createUserWithEmailAndPassword(auth, emailInvitacion, tempPassword);
      await setDoc(doc(db, 'Usuarios', userCredential.user.uid), {
        nombre: nombreInvitacion,
        email: emailInvitacion,
        rol: 'arquitecto',
        estudio_id: estudioId,
        activo: true,
        fecha_registro: serverTimestamp()
      });
      setMensaje(`âœ… Arquitecto agregado. ContraseÃ±a temporal: ${tempPassword}`);
      setEmailInvitacion('');
      setNombreInvitacion('');
      fetchData();
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        setMensaje('âŒ Ese email ya estÃ¡ registrado en el sistema.');
      } else {
        setMensaje('âŒ Error al agregar el arquitecto. IntentÃ¡ de nuevo.');
      }
    }
    setEnviando(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.engineeringHeader}>
        <button onClick={onBack} style={styles.btnBack}>â† Dashboard</button>
        <span>Equipo TÃ©cnico</span>
      </div>
      <h2 style={styles.h2}>EQUIPO TÃ‰CNICO Â· ADMINISTRACIÃ“N</h2>
      <p style={styles.subtitleBold}>Control de capital profesional, roles y carga operativa.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>

        <div style={{ ...styles.cardInfo, border: THEME.border }}>
          <label style={styles.label}>GESTIÃ“N DE CARGA PROFESIONAL</label>
          {loading ? (
            <p style={{ color: THEME.gray }}>Cargando equipo...</p>
          ) : arquitectos.length === 0 ? (
            <p style={{ color: THEME.gray, fontSize: '13px' }}>No hay arquitectos registrados aÃºn.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              {arquitectos.map(arq => (
                <div key={arq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: `1px solid ${THEME.softGray}`, borderRadius: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '14px' }}>{arq.nombre}</strong>
                    <p style={{ fontSize: '12px', color: THEME.gray, margin: '3px 0 0 0' }}>
                      {getCasosCount(arq.id)} caso{getCasosCount(arq.id) !== 1 ? 's' : ''} activo{getCasosCount(arq.id) !== 1 ? 's' : ''}
                    </p>
                    <p style={{ fontSize: '11px', color: THEME.gray, margin: '2px 0 0 0' }}>{arq.email}</p>
                  </div>
                  <button
                    onClick={onAssignAction}
                    style={{ ...styles.btnPrimary, width: 'auto', padding: '10px 16px', fontSize: '11px' }}
                  >
                    Asignar al caso
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ ...styles.cardInfo, border: THEME.border }}>
          <label style={styles.label}>AGREGAR ARQUITECTO AL ESTUDIO</label>
          <p style={{ fontSize: '13px', color: THEME.gray, marginBottom: '20px' }}>
            SumÃ¡ profesionales al equipo del estudio.
          </p>
          <input
            placeholder="Nombre completo del Arquitecto"
            value={nombreInvitacion}
            onChange={e => setNombreInvitacion(e.target.value)}
            style={{ ...styles.inputFieldBold, marginBottom: '10px' }}
          />
          <input
            placeholder="Email del Arquitecto"
            type="email"
            value={emailInvitacion}
            onChange={e => setEmailInvitacion(e.target.value)}
            style={{ ...styles.inputFieldBold, marginBottom: '20px' }}
          />
          {mensaje && (
            <div style={{ padding: '12px', backgroundColor: mensaje.startsWith('âœ…') ? '#E8F5E9' : '#FFEBEE', borderRadius: '6px', marginBottom: '15px', fontSize: '13px', color: mensaje.startsWith('âœ…') ? '#2E7D32' : THEME.primary }}>
              {mensaje}
            </div>
          )}
          <button
            onClick={handleInvitar}
            disabled={enviando}
            style={{ ...styles.btnPrimary, opacity: enviando ? 0.7 : 1 }}
          >
            {enviando ? 'Agregando...' : 'AGREGAR AL ESTUDIO'}
          </button>
        </div>

      </div>
    </div>
  );
}
// --- ESTILOS ---
const styles: { [key: string]: React.CSSProperties } = {
  header: { position: 'sticky', top: 0, zIndex: 100, backgroundColor: '#FFFFFF', borderBottom: '2px solid #1D1D1F', padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  isotipo: { width: '28px', height: '28px', backgroundColor: '#B21F24', clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' },
  logoText: { fontSize: '14px', fontWeight: 900, letterSpacing: '0.05em', color: '#1D1D1F' },
  btnMenu: { background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#1D1D1F' },
  navMenu: { position: 'absolute', top: '60px', right: 0, backgroundColor: '#FFFFFF', border: '2px solid #1D1D1F', width: '260px', zIndex: 200, padding: '10px 0' },
  navItem: { padding: '14px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 },
  container: { maxWidth: '680px', margin: '0 auto', padding: '40px 20px' },
  h1: { fontSize: 'clamp(22px, 5vw, 36px)', fontWeight: 900, lineHeight: 1.2, marginBottom: '20px', letterSpacing: '-0.02em' },
  h2: { fontSize: 'clamp(18px, 4vw, 26px)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '10px' },
  p: { fontSize: '16px', lineHeight: '1.6', color: '#6E6E73', marginBottom: '30px' },
  subtitleBold: { fontSize: '15px', fontWeight: 600, color: '#6E6E73', marginBottom: '25px' },
  cardInfo: { backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '25px', marginBottom: '20px' },
  cardEng: { backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', cursor: 'pointer' },
  label: { fontSize: '10px', fontWeight: 900, letterSpacing: '0.12em', color: '#6E6E73', display: 'block', marginBottom: '8px', textTransform: 'uppercase' },
  inputFieldBold: { width: '100%', padding: '12px', border: '2px solid #1D1D1F', borderRadius: '6px', fontSize: '14px', fontWeight: 600, boxSizing: 'border-box' },
  textareaBold: { width: '100%', padding: '12px', border: '2px solid #1D1D1F', borderRadius: '6px', fontSize: '14px', minHeight: '120px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '20px' },
  uploadContainer: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  fileUploadBold: { padding: '15px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 },
  btnPrimary: { backgroundColor: '#B21F24', color: '#FFFFFF', border: 'none', padding: '16px 32px', fontSize: '13px', fontWeight: 900, letterSpacing: '0.08em', cursor: 'pointer', borderRadius: '6px', width: '100%' },
  btnSecondaryOutline: { backgroundColor: 'transparent', color: '#1D1D1F', border: '2px solid #1D1D1F', padding: '14px 28px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', borderRadius: '6px' },
  btnBack: { background: 'none', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#6E6E73' },
  btnLuxuryBack: { backgroundColor: 'transparent', color: '#1D1D1F', border: '2px solid #1D1D1F', padding: '14px 28px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', borderRadius: '6px', width: '100%' },
  gridSteps: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' },
  step: { padding: '20px', borderRadius: '8px', lineHeight: '1.6', fontSize: '14px' },
  itemCase: { padding: '18px', borderRadius: '8px', cursor: 'pointer' },
  trustBoxCompact: { padding: '15px', borderRadius: '8px', backgroundColor: '#FFFFFF' },
  trustText: { fontSize: '13px', color: '#6E6E73', fontWeight: 600 },
  centeredBtnGroup: { display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px', margin: '0 auto' },
  priceTag: { fontSize: '18px', fontWeight: 900, color: '#B21F24' },
  engineeringHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #1D1D1F' },
  footer: { textAlign: 'center', padding: '30px 20px', fontSize: '12px', color: '#6E6E73', borderTop: '1px solid #E5E5E7', marginTop: '60px' },
};




