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
  addDoc, getDocs, query, where, serverTimestamp
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
      if (error.code === 'auth/email-already-in-use') setAuthError('Ese email ya está registrado. Iniciá sesión.');
      else if (error.code === 'auth/weak-password') setAuthError('La contraseña debe tener al menos 6 caracteres.');
      else setAuthError('Error al registrarse. Intentá de nuevo.');
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      setAuthError('');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') setAuthError('No existe una cuenta con ese email.');
      else if (error.code === 'auth/wrong-password') setAuthError('Contraseña incorrecta.');
      else setAuthError('Error al iniciar sesión. Verificá tus datos.');
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
        else if (status === 'EN ANÁLISIS') navigate('user_analizando', id);
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
        <button onClick={() => setMenuOpen(!menuOpen)} style={styles.btnMenu}>{menuOpen ? '✕' : '☰'}</button>
        {menuOpen && (
          <nav style={styles.navMenu}>
            <div style={styles.navItem} onClick={() => navigate('user_home')}>Inicio</div>
            <div style={styles.navItem} onClick={() => navigate('user_como_funciona')}>Cómo funciona</div>
            <div style={styles.navItem} onClick={() => navigate('user_quienes_somos')}>Quiénes somos</div>
            {currentUser ? (
              <>
                <div style={styles.navItem} onClick={() => navigate('user_historial')}>Mis consultas</div>
                <div style={styles.navItem} onClick={() => navigate('user_perfil')}>Mi perfil</div>
                <div style={{ ...styles.navItem, color: THEME.primary }} onClick={handleLogout}>Cerrar sesión</div>
              </>
            ) : (
              <>
                <div style={styles.navItem} onClick={() => navigate('login_usuario')}>Iniciar sesión</div>
                <div style={{ ...styles.navItem, color: THEME.primary }} onClick={() => navigate('user_registro')}>Registrarse</div>
              </>
            )}
            <div style={{ ...styles.navItem, color: THEME.primary, borderTop: `1px solid ${THEME.softGray}`, marginTop: '10px' }} onClick={() => navigate('login_tecnico')}>Acceso Profesional 🔐</div>
          </nav>
        )}
      </header>
      <main>{renderContent()}</main>
      <footer style={styles.footer}>© 2026 DE LA MATRIZ • Arquitectura & Asesoramiento Técnico</footer>
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
        <input placeholder="Contraseña * (mínimo 6 caracteres)" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ ...styles.inputFieldBold, marginBottom: '10px' }} />
        <input placeholder="Teléfono de contacto" value={telefono} onChange={e => setTelefono(e.target.value)} style={{ ...styles.inputFieldBold, marginBottom: '10px' }} />
        <input placeholder="Dirección del inmueble" value={direccion} onChange={e => setDireccion(e.target.value)} style={{ ...styles.inputFieldBold, marginBottom: '10px' }} />
      </div>
      {error && <p style={{ color: THEME.primary, marginTop: '10px', fontWeight: 700 }}>{error}</p>}
      <button onClick={handleSubmit} disabled={loading} style={{ ...styles.btnPrimary, marginTop: '20px', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Creando cuenta...' : 'Crear mi cuenta'}
      </button>
      <p style={{ textAlign: 'center', marginTop: '20px', color: THEME.gray }}>
        ¿Ya tenés cuenta? <span style={{ color: THEME.primary, cursor: 'pointer', fontWeight: 700 }} onClick={onLogin}>Iniciá sesión</span>
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
      <h2 style={styles.h2}>{esProfesional ? 'ACCESO PROFESIONAL' : 'INICIAR SESIÓN'}</h2>
      <p style={styles.subtitleBold}>{esProfesional ? 'Acceso exclusivo para arquitectos y dirección del estudio.' : 'Ingresá con tu cuenta para ver tus consultas.'}</p>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ ...styles.inputFieldBold, marginBottom: '10px' }} />
        <input placeholder="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ ...styles.inputFieldBold, marginBottom: '10px' }} />
        <p style={{ textAlign: 'right', color: THEME.primary, cursor: 'pointer', fontSize: '13px', fontWeight: 700 }} onClick={onForgot}>¿Olvidaste tu contraseña?</p>
      </div>
      {error && <p style={{ color: THEME.primary, marginTop: '10px', fontWeight: 700 }}>{error}</p>}
      <button onClick={handleSubmit} disabled={loading} style={{ ...styles.btnPrimary, marginTop: '20px', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
      {!esProfesional && (
        <p style={{ textAlign: 'center', marginTop: '20px', color: THEME.gray }}>
          ¿No tenés cuenta? <span style={{ color: THEME.primary, cursor: 'pointer', fontWeight: 700 }} onClick={onRegister}>Registrate gratis</span>
        </p>
      )}
    </div>
  );
}

// --- PANTALLA RECUPERAR CONTRASEÑA ---
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
      <h2 style={styles.h2}>RECUPERAR CONTRASEÑA</h2>
      {sent ? (
        <div style={{ ...styles.cardInfo, border: THEME.border }}>
          <p style={{ color: '#2E7D32', fontWeight: 700 }}>✅ Te enviamos un email con las instrucciones para restablecer tu contraseña.</p>
        </div>
      ) : (
        <div style={{ ...styles.cardInfo, border: THEME.border }}>
          <p style={{ marginBottom: '15px', color: THEME.gray }}>Ingresá tu email y te enviamos un enlace para restablecer tu contraseña.</p>
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
      <h1 style={styles.h1}>ANTES DE GASTAR EN REPARACIONES, ENTENDÉ QUÉ PROBLEMA TIENE TU VIVIENDA.</h1>
      {userProfile && <p style={{ color: THEME.primary, fontWeight: 700, marginBottom: '10px' }}>Bienvenido, {userProfile.nombre}</p>}
      <p style={styles.p}>Asesoramiento online con arquitectos especialistas. Respuesta clara y sin complicaciones.</p>
      <div style={styles.centeredBtnGroup}>
        <button onClick={onStart} style={styles.btnPrimary}>Iniciar mi consulta</button>
        <button onClick={onHow} style={styles.btnSecondaryOutline}>Cómo funciona</button>
      </div>
      <div style={{ ...styles.trustBoxCompact, marginTop: '45px' }}>
        <p style={styles.trustText}>✅ Primera consulta sin costo · Diagnóstico independiente · Sin compromiso de obra</p>
      </div>
    </div>
  );
}

// --- PANTALLA CÓMO FUNCIONA ---
function ScreenComoFunciona({ onNext }: any) {
  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>UN DIAGNÓSTICO PROFESIONAL EN POCOS PASOS</h2>
      <p style={styles.subtitleBold}>La primera consulta es completamente sin costo. Te explicamos cómo funciona.</p>
      <div style={styles.gridSteps}>
        <div style={{ ...styles.step, border: THEME.border }}>
          <strong>① Registrate y contanos el problema</strong><br /><br />
          Creá tu cuenta gratuita, describí lo que ves y adjuntá fotos o videos del problema. Es rápido y sin costo.
        </div>
        <div style={{ ...styles.step, border: THEME.border }}>
          <strong>② Análisis profesional en 24/48 hs</strong><br /><br />
          Un arquitecto especialista del estudio analiza tu caso, evalúa causas técnicas y prepara tu diagnóstico.
        </div>
        <div style={{ ...styles.step, border: THEME.border }}>
          <strong>③ Recibís tu diagnóstico y decidís</strong><br /><br />
          Recibís orientación técnica clara. Si necesitás profundizar, podés contratar un informe técnico o visita presencial.
        </div>
      </div>
      <div style={{ ...styles.cardInfo, border: `1px solid ${THEME.softGray}`, backgroundColor: '#F0FFF4', marginBottom: '20px' }}>
        <p style={{ color: '#2E7D32', fontWeight: 700, textAlign: 'center' }}>✅ La primera consulta es completamente GRATIS — sin tarjeta, sin compromiso.</p>
      </div>
      <button onClick={onNext} style={styles.btnPrimary}>Iniciar mi consulta gratis</button>
    </div>
  );
}

// --- PANTALLA QUIÉNES SOMOS ---
function ScreenQuienesSomos({ onBack }: any) {
  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>QUIÉNES SOMOS</h2>
      <p style={styles.subtitleBold}>Criterio técnico independiente al servicio de su vivienda.</p>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <p style={{ lineHeight: '1.8', textAlign: 'justify', fontStyle: 'italic' }}>
          "Bienvenidos a este espacio de consulta y asesoramiento. Somos un estudio de arquitectura que ha desarrollado una metodología de trabajo específica que nos identifica en el sector, brindando asesoramiento y respaldo en el área de Rehabilitación Edilicia. Nuestra experiencia en el sector nos ha permitido desarrollar un sistema de trabajo único: dando el respaldo técnico especializado que toda propiedad necesita para tener un diagnóstico seguro y la solución acertada, con el apoyo de nuestros técnicos y con la seguridad de obtener el mejor resultado final."
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
    if (!descripcion.trim()) { setError('Por favor describí el problema.'); return; }
    if (!direccionInmueble.trim()) { setError('Por favor ingresá la dirección del inmueble.'); return; }
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
      setError('Error al enviar la consulta. Intentá de nuevo.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>CONTANOS QUÉ LE PASA A TU VIVIENDA</h2>
      <p style={styles.subtitleBold}>Esta consulta inicial es sin costo y analizada por expertos.</p>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <label style={styles.label}>DATOS DEL INMUEBLE</label>
        <input placeholder="Dirección del inmueble afectado *" value={direccionInmueble} onChange={e => setDireccionInmueble(e.target.value)} style={{ ...styles.inputFieldBold, marginBottom: '15px' }} />
        <label style={styles.label}>DESCRIPCIÓN DEL PROBLEMA</label>
        <textarea placeholder="Ej.: humedad en una pared del living, aparece en invierno..." value={descripcion} onChange={e => setDescripcion(e.target.value)} style={styles.textareaBold} />
        <label style={styles.label}>EVIDENCIA FOTOGRÁFICA</label>
        <div style={styles.uploadContainer}>
          <div onClick={() => photoRef.current?.click()} style={{ ...styles.fileUploadBold, border: THEME.border, backgroundColor: attached.photos ? '#F0FFF0' : 'transparent' }}>
            {attached.photos ? '✅ Evidencia visual adjunta' : 'Adjuntar Fotos o Videos'}
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
      <h2 style={styles.h2}>TU CONSULTA ESTÁ EN ANÁLISIS</h2>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <label style={styles.label}>TIEMPO DE RESPUESTA PROFESIONAL</label>
        <p>Un arquitecto especialista está validando su expediente técnico. El tiempo estimado de respuesta es de <strong>24 a 48 hs hábiles.</strong></p>
        <p style={{ marginTop: '15px', color: THEME.gray, fontSize: '13px' }}>Te avisaremos por email cuando tu diagnóstico esté listo.</p>
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
    if (estado === 'EN ANÁLISIS') return { bg: '#FFFDE7', text: '#F57F17' };
    return { bg: '#F5F5F7', text: '#B21F24' };
  };

  if (loading) return <div style={styles.container}><p style={{ color: THEME.gray }}>Cargando consultas...</p></div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>MIS CONSULTAS</h2>
      <p style={styles.subtitleBold}>Archivo personal para seguimiento, memoria y confianza técnica.</p>
      {casos.length === 0 ? (
        <div style={{ ...styles.cardInfo, border: THEME.border, textAlign: 'center' }}>
          <p style={{ color: THEME.gray }}>Todavía no tenés consultas registradas.</p>
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
      <div style={styles.engineeringHeader}><button onClick={onBack} style={styles.btnBack}>← Volver</button><span>Expediente Técnico Profesional</span></div>
      <h2 style={styles.h2}>RESPUESTA DE LA CONSULTA</h2>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <label style={styles.label}>DESCRIPCIÓN ORIGINAL</label>
        <p>{caso?.descripcion}</p>
        <label style={{ ...styles.label, marginTop: '20px' }}>DIAGNÓSTICO PRELIMINAR</label>
        <p>{caso?.diagnostico || 'El diagnóstico está siendo preparado por el arquitecto asignado.'}</p>
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
        <p><strong>Teléfono:</strong> {userProfile?.telefono || '-'}</p>
        <p><strong>Dirección:</strong> {userProfile?.direccion || '-'}</p>
      </div>
      <button onClick={onLogout} style={{ ...styles.btnPrimary, marginTop: '20px', backgroundColor: THEME.gray }}>Cerrar sesión</button>
      <button onClick={onBack} style={{ ...styles.btnLuxuryBack, marginTop: '15px' }}>Volver al inicio</button>
    </div>
  );
}

// --- PANEL DIRECTOR ---
function PanelCDirector({ currentUser, userProfile, onCase, onConfig, onTeam, onLogout, onConsultas, onAssign }: any) {
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
              <div key={c.id} style={{ ...styles.itemCase, border: THEME.border, backgroundColor: colors.bg }} onClick={() => onCase(c.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{c.usuario_nombre || 'Usuario'}</strong>
                    <p style={{ fontSize: '12px', color: THEME.gray, marginTop: '3px' }}>{c.descripcion?.substring(0, 60)}...</p>
                    <p style={{ fontSize: '11px', color: THEME.gray }}>{c.direccion_inmueble}</p>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 900, color: colors.text, border: `1px solid ${colors.text}`, padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>{c.estado}</span>
                </div>
              </div>
            );
          })}
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
        <button onClick={onLogout} style={styles.btnBack}>Cerrar sesión</button>
      </div>
      <h2 style={styles.h2}>Bienvenido, {userProfile?.nombre || 'Arquitecto'}</h2>
      <label style={styles.label}>CASOS ASIGNADOS</label>
      {loading ? <p style={{ color: THEME.gray }}>Cargando casos...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {casos.length === 0 ? (
            <div style={{ ...styles.cardInfo, border: THEME.border, textAlign: 'center' }}>
              <p style={{ color: THEME.gray }}>No tenés casos asignados actualmente.</p>
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
    { id: 'video', title: 'Video Consulta Técnica', price: '$4.500', desc: 'Aclaración de dudas en tiempo real mediante videollamada.' },
    { id: 'informe', title: 'Informe Técnico Ampliado', price: '$8.500', desc: 'Documento robusto de alta ingeniería que detalla causas y riesgos.' },
    { id: 'visita', title: 'Visita Técnica Presencial', price: '$12.000', desc: 'Relevamiento in situ para un diagnóstico confirmado e inspección técnica.' }
  ];
  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.btnBack}>← Volver</button>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {actuaciones.map(act => (
          <div key={act.id} style={{ ...styles.cardEng, border: THEME.border }} onClick={() => onSelect(act)}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{act.title}</strong>
              <span style={styles.priceTag}>{act.price}</span>
            </div>
            <p style={{ fontSize: '13px', color: THEME.gray, marginTop: '8px' }}>{act.desc}</p>
            <button style={{ ...styles.btnPrimary, height: '40px', marginTop: '15px', fontSize: '11px' }}>Solicitar Actuación</button>
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
      <button onClick={onBack} style={styles.btnBack}>← Volver</button>
      <h2 style={styles.h2}>FORMA DE PAGO</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ ...styles.itemCase, border: THEME.border, padding: '25px', cursor: 'default' }}><strong>💳 Tarjeta de Crédito / Débito</strong></div>
        <div style={{ ...styles.itemCase, border: THEME.border, padding: '25px', cursor: 'default' }}><strong>🏦 Transferencia Bancaria Directa</strong></div>
        <div style={{ ...styles.itemCase, border: THEME.border, padding: '25px', cursor: 'default' }}><strong>📱 Mercado Pago</strong></div>
        <div style={{ ...styles.itemCase, border: THEME.border, padding: '25px', cursor: 'default' }}><strong>🏪 ABITAB / RedPagos</strong></div>
      </div>
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: THEME.white, border: `1px solid ${THEME.softGray}`, borderRadius: '8px' }}>
        <p style={{ fontSize: '13px', color: THEME.gray, textAlign: 'center' }}>El estudio se pondrá en contacto para coordinar el pago y confirmar el servicio.</p>
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
      <button onClick={onBack} style={styles.btnBack}>← Volver</button>
      <h2 style={styles.h2}>SEGUIMIENTO DE CONSULTA</h2>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <label style={styles.label}>ESTADO ACTUAL</label>
        <p><strong>{caso?.estado || 'EN CURSO'}</strong></p>
        <label style={{ ...styles.label, marginTop: '15px' }}>DESCRIPCIÓN</label>
        <p>{caso?.descripcion || '-'}</p>
      </div>
      <button onClick={onActuaciones} style={{ ...styles.btnPrimary, marginTop: '20px' }}>Ver actuaciones técnicas</button>
    </div>
  );
}

function PanelBFicha({ caseId, onBack, onAdvanced, isDirectorView }: any) {
  const [caso, setCaso] = useState<any>(null);
  useEffect(() => {
    if (!caseId) return;
    getDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId)).then(d => {
      if (d.exists()) setCaso({ id: d.id, ...d.data() });
    });
  }, [caseId]);
  return (
    <div style={styles.container}>
      <div style={styles.engineeringHeader}><button onClick={onBack} style={styles.btnBack}>← Volver</button><span>{isDirectorView ? 'Vista Director' : 'Ficha Técnica'}</span></div>
      <h2 style={styles.h2}>FICHA DE CONSULTA</h2>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <label style={styles.label}>USUARIO</label>
        <p>{caso?.usuario_nombre} — {caso?.usuario_email}</p>
        <label style={{ ...styles.label, marginTop: '15px' }}>INMUEBLE</label>
        <p>{caso?.direccion_inmueble || '-'}</p>
        <label style={{ ...styles.label, marginTop: '15px' }}>DESCRIPCIÓN</label>
        <p>{caso?.descripcion || '-'}</p>
        <label style={{ ...styles.label, marginTop: '15px' }}>ESTADO</label>
        <p><strong>{caso?.estado || '-'}</strong></p>
      </div>
      {!isDirectorView && onAdvanced && <button onClick={onAdvanced} style={{ ...styles.btnPrimary, marginTop: '20px' }}>Abrir Tablero Técnico</button>}
    </div>
  );
}

function PanelB1Tablero({ caseId, onBack, onUserView }: any) {
  return (
    <div style={styles.container}>
      <div style={styles.engineeringHeader}><button onClick={onBack} style={styles.btnBack}>← Volver</button><span>Tablero Técnico</span></div>
      <h2 style={styles.h2}>TABLERO DE SUPERVISIÓN</h2>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <p style={{ color: THEME.gray }}>Módulo de supervisión técnica — en desarrollo.</p>
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
      <div style={styles.engineeringHeader}><button onClick={onBack} style={styles.btnBack}>← Volver</button><span>Historial Global</span></div>
      <h2 style={styles.h2}>TODAS LAS CONSULTAS</h2>
      {loading ? <p style={{ color: THEME.gray }}>Cargando...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {casos.length === 0 ? (
            <p style={{ color: THEME.gray }}>No hay consultas registradas aún.</p>
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
      <div style={styles.engineeringHeader}><button onClick={onBack} style={styles.btnBack}>← Volver</button><span>Configuración</span></div>
      <h2 style={styles.h2}>CONFIGURACIÓN DEL ESTUDIO</h2>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <p style={{ color: THEME.gray }}>Configuración de precios y parámetros del estudio — próximamente.</p>
      </div>
      <button onClick={onTeam} style={{ ...styles.btnPrimary, marginTop: '20px' }}>Gestión de Equipo</button>
    </div>
  );
}

function PanelFGestionEquipo({ estudioId, onBack, onAssignAction }: any) {
  const [arquitectos, setArquitectos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArquitectos = async () => {
      const q = query(collection(db, 'Usuarios'), where('rol', '==', 'arquitecto'), where('estudio_id', '==', estudioId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setArquitectos(data);
      setLoading(false);
    };
    fetchArquitectos();
  }, [estudioId]);

  return (
    <div style={styles.container}>
      <div style={styles.engineeringHeader}><button onClick={onBack} style={styles.btnBack}>← Volver</button><span>Gestión de Equipo</span></div>
      <h2 style={styles.h2}>EQUIPO TÉCNICO</h2>
      {loading ? <p style={{ color: THEME.gray }}>Cargando equipo...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {arquitectos.length === 0 ? (
            <div style={{ ...styles.cardInfo, border: THEME.border, textAlign: 'center' }}>
              <p style={{ color: THEME.gray }}>No hay arquitectos registrados aún.</p>
            </div>
          ) : arquitectos.map(a => (
            <div key={a.id} style={{ ...styles.itemCase, border: THEME.border }}>
              <strong>{a.nombre}</strong>
              <p style={{ fontSize: '12px', color: THEME.gray }}>{a.email}</p>
            </div>
          ))}
        </div>
      )}
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