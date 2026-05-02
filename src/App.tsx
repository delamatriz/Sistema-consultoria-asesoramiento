import React, { useState, useRef, useEffect } from 'react';
import { auth, db, storage } from './firebase/config';
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
import PanelPagos from './PanelPagos';

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
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      if (status === 'approved') setView('pago_exitoso');
      else if (status === 'pending') setView('pago_pendiente');
      else if (status === 'rejected' || status === 'failure') setView('pago_fallido');
      if (status) window.history.replaceState({}, '', '/');
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
      case 'user_opciones': return <ScreenOpciones caseId={selectedCaseId} onSelect={(service) => { setSelectedService(service); navigate('user_metodo_pago'); }} onBack={() => navigate('user_detalle')} />;
      case 'user_pago': return <ScreenPago service={selectedService} onConfirm={() => navigate('user_metodo_pago')} onBack={() => navigate('user_opciones')} />;
      case 'user_metodo_pago': return <ScreenMetodoPago caseId={selectedCaseId} currentUser={currentUser} selectedService={selectedService} onBack={() => navigate('user_opciones')} onDone={() => navigate('user_historial')} />;
      case 'user_seguimiento': return <ScreenSeguimiento caseId={selectedCaseId} onBack={() => navigate('user_historial')} onActuaciones={() => navigate('user_opciones')} />;
      case 'user_actuaciones': return <ScreenOpcionesActuacion onSelect={(service) => { setSelectedService(service); navigate('user_pago'); }} onBack={() => navigate('user_seguimiento')} />;
      case 'pago_exitoso': return <ScreenPagoResultado tipo="exitoso" onVolver={() => navigate('user_historial')} />;
      case 'pago_pendiente': return <ScreenPagoResultado tipo="pendiente" onVolver={() => navigate('user_historial')} />;
      case 'pago_fallido': return <ScreenPagoResultado tipo="fallido" onVolver={() => navigate('user_historial')} />;  
      case 'user_perfil': return <ScreenPerfil userProfile={userProfile} onBack={() => navigate('user_home')} onLogout={handleLogout} />;
      case 'login_tecnico': return <ScreenLogin onLogin={handleLogin} onRegister={() => navigate('user_registro')} onForgot={() => navigate('user_recuperar')} error={authError} esProfesional={true} />;
      case 'arquitecto_biblioteca': return <PanelBiblioteca estudioId={ESTUDIO_ID} onBack={() => navigate('arquitecto_dashboard')} isDirector={false} />;
      case 'arquitecto_miscasos': return <PanelAMisCasos currentUser={currentUser} onBack={() => navigate('arquitecto_dashboard')} onCase={(id: string) => navigate('arquitecto_ficha', id)} />;
      case 'arquitecto_micuenta': return <PanelAMiCuenta currentUser={currentUser} onBack={() => navigate('arquitecto_dashboard')} />;
      case 'arquitecto_miperfil': return <PanelAMiPerfil currentUser={currentUser} userProfile={userProfile} onBack={() => navigate('arquitecto_dashboard')} />;
      case 'arquitecto_dashboard': return <PanelADashboard currentUser={currentUser} userProfile={userProfile} onCase={(id: string) => navigate('arquitecto_ficha', id)} onLogout={handleLogout} onBiblioteca={() => navigate('arquitecto_biblioteca')} onMisCasos={() => navigate('arquitecto_miscasos')} onMiCuenta={() => navigate('arquitecto_micuenta')} onMiPerfil={() => navigate('arquitecto_miperfil')} />;
      case 'arquitecto_ficha': return <PanelBFicha caseId={selectedCaseId} onBack={() => navigate('arquitecto_dashboard')} />;
      case 'director_dashboard': return <PanelCDirector currentUser={currentUser} userProfile={userProfile} onCase={(id) => navigate('director_auditoria', id)} onConfig={() => navigate('director_config')} onTeam={() => navigate('director_team')} onLogout={handleLogout} onConsultas={() => navigate('director_consultas')} onAssign={() => navigate('director_team')} onBiblioteca={() => navigate('director_biblioteca')}onPagos={() => navigate('director_pagos')} />;
      case 'director_biblioteca': return <PanelBiblioteca estudioId={ESTUDIO_ID} onBack={() => navigate('director_dashboard')} isDirector={true} />;
      case 'director_auditoria': return <PanelBFicha caseId={selectedCaseId} onBack={() => navigate('director_dashboard')} isDirectorView={true} />;
      case 'director_consultas': return <PanelGConsultas onCase={(id) => navigate('director_auditoria', id)} onBack={() => navigate('director_dashboard')} />;
      case 'director_pagos': return <PanelPagos estudioId={ESTUDIO_ID} onBack={() => navigate('director_dashboard')} />;  
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
<img src="/Logo_fondo_transparente.png" alt="De La Matriz" style={{ height: '60px', width: 'auto', mixBlendMode: 'multiply' }} />

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
      <button onClick={onBack} style={{ ...styles.btnLuxuryBack, marginTop: '30px' }}>Volver a mi consulta</button>
    </div>
  );
}

// --- PANTALLA CARGA ---
function ScreenCarga({ onNext, currentUser, userProfile, onLoginRequired }: any) {
  const photoRef = useRef<HTMLInputElement>(null);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [direccionInmueble, setDireccionInmueble] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progreso, setProgreso] = useState('');

  const handleSubmit = async () => {
    if (!currentUser) { onLoginRequired(); return; }
    if (!descripcion.trim()) { setError('Por favor describe el problema.'); return; }
    if (!direccionInmueble.trim()) { setError('Por favor ingresa la direccion del inmueble.'); return; }
    setLoading(true);
    setProgreso('Guardando consulta...');
    try {
      const fotosUrls: string[] = [];
      if (archivos.length > 0) {
        const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
        for (let i = 0; i < archivos.length; i++) {
          setProgreso('Subiendo foto ' + (i + 1) + ' de ' + archivos.length + '...');
          const archivo = archivos[i];
          
          const storageRef = ref(storage, 'casos/' + currentUser.uid + '/' + Date.now() + '_' + archivo.name);
          await uploadBytes(storageRef, archivo);
          const url = await getDownloadURL(storageRef);
          fotosUrls.push(url);
        }
      }
      setProgreso('Registrando caso...');
      const casosRef = collection(db, 'Estudios', ESTUDIO_ID, 'Casos');
      await addDoc(casosRef, {
        usuario_id: currentUser.uid,
        usuario_nombre: userProfile?.nombre || '',
        usuario_email: currentUser.email,
        usuario_telefono: userProfile?.telefono || '',
        direccion_inmueble: direccionInmueble,
        descripcion,
        fotos_urls: fotosUrls,
        estado: 'NUEVO',
        fecha_creacion: serverTimestamp(),
        arquitecto_asignado: null,
      });
      try {
        const emailjs = await import('@emailjs/browser');
        await emailjs.send('delamatriz', 'template_no31o7y', {
          usuario_nombre: userProfile?.nombre || '',
          usuario_email: currentUser.email,
          direccion_inmueble: direccionInmueble,
          descripcion
        }, 'd1aTzq_ytY2X8Mrdn');
      } catch(emailErr) {
        console.error('Email error:', emailErr);
      }
      onNext();
    } catch (e) {
      console.error(e);
      setError('Error al enviar la consulta. Intenta de nuevo.');
    }
    setLoading(false);
    setProgreso('');
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>CONTANOS QUE LE PASA A TU VIVIENDA</h2>
      <p style={styles.subtitleBold}>Esta consulta inicial es sin costo y analizada por expertos.</p>
      <div style={{ ...styles.cardInfo, border: '2px solid #1D1D1F' }}>
        <label style={styles.label}>DATOS DEL INMUEBLE</label>
        <input placeholder="Direccion del inmueble afectado *" value={direccionInmueble} onChange={e => setDireccionInmueble(e.target.value)} style={{ ...styles.inputFieldBold, marginBottom: '15px' }} />
        <label style={styles.label}>DESCRIPCION DEL PROBLEMA</label>
        <textarea placeholder="Ej.: humedad en una pared del living, aparece en invierno..." value={descripcion} onChange={e => setDescripcion(e.target.value)} style={styles.textareaBold} />
        <label style={styles.label}>EVIDENCIA FOTOGRAFICA</label>
        <div style={styles.uploadContainer}>
          <div onClick={() => photoRef.current?.click()} style={{ ...styles.fileUploadBold, border: '2px solid #1D1D1F', backgroundColor: archivos.length > 0 ? '#F0FFF0' : 'transparent', cursor: 'pointer', padding: '15px 20px', borderRadius: '6px' }}>
            {archivos.length > 0 ? archivos.length + ' archivo(s) adjunto(s)' : 'Adjuntar Fotos o Videos'}
            <input type="file" ref={photoRef} style={{ display: 'none' }} multiple accept="image/*,video/*" onChange={e => setArchivos(Array.from(e.target.files || []))} />
          </div>
        </div>
        <p style={{ fontSize: '12px', color: '#6E6E73', marginTop: '8px' }}>Podes seleccionar varias fotos a la vez manteniendo Ctrl apretado</p>
        {archivos.length > 0 && (
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {archivos.map((f, i) => (
              <span key={i} style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: '#E8F5E9', borderRadius: '4px', color: '#2E7D32' }}>{f.name}</span>
            ))}
          </div>
        )}
      </div>
      {error && <p style={{ color: '#B21F24', marginTop: '10px', fontWeight: 700 }}>{error}</p>}
      {progreso && <p style={{ color: '#1565C0', marginTop: '10px', fontWeight: 600 }}>{progreso}</p>}
      <button onClick={handleSubmit} disabled={loading} style={{ ...styles.btnPrimary, marginTop: '30px', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Enviando...' : 'Enviar mi consulta profesional'}
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
      <button onClick={onBack} style={{ ...styles.btnLuxuryBack, marginTop: '40px' }}>Volver a mi consulta</button>
    </div>
  );
}

// --- PANTALLA DETALLE ---
function ScreenDetalle({ caseId, onBack, onEscalate }: any) {
  const [caso, setCaso] = useState<any>(null);
  const [loading, setLoading] = useState(true); const [actuaciones, setActuaciones] = useState<any[]>([]);
  useEffect(() => {
    if (!caseId) { setLoading(false); return; }
    getDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId)).then(d => {
      if (d.exists()) setCaso({ id: d.id, ...d.data() });
      setLoading(false);
    });
  }, [caseId]); useEffect(() => { if (!caseId) return; getDocs(collection(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId, 'Actuaciones')).then(snap => { setActuaciones(snap.docs.map(d => ({ id: d.id, ...d.data() }))); }); }, [caseId]);
  if (loading) return <div style={styles.container}><p style={{ color: '#6E6E73' }}>Cargando...</p></div>;

  return (
    <div style={styles.container}>
      <div style={styles.engineeringHeader}>
        <button onClick={onBack} style={styles.btnBack}>Volver</button>
        <span>Expediente Tecnico Profesional</span>
      </div>
      <h2 style={styles.h2}>RESPUESTA DE LA CONSULTA</h2>
      <div style={{ ...styles.cardInfo, border: '2px solid #1D1D1F', marginBottom: '15px' }}>
        <label style={{ ...styles.label, color: '#B21F24' }}>TU CONSULTA</label>
        <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: '#6E6E73', margin: '0 0 4px 0' }}>INMUEBLE</p>
        <p style={{ fontSize: '14px', margin: '0 0 15px 0' }}>{caso?.direccion_inmueble || '-'}</p>
        <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: '#6E6E73', margin: '0 0 4px 0' }}>DESCRIPCION DEL PROBLEMA</p>
        <p style={{ fontSize: '14px', lineHeight: '1.6', fontStyle: 'italic', margin: '0 0 15px 0' }}>"{caso?.descripcion}"</p>
        {caso?.fotos_urls && caso.fotos_urls.length > 0 && (
          <div>
            <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: '#6E6E73', margin: '0 0 8px 0' }}>EVIDENCIA FOTOGRAFICA</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {caso.fotos_urls.map((url, i) => (
                <img key={i} src={url} alt={'Foto ' + (i+1)} style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E5E5E7', cursor: 'pointer' }} onClick={() => window.open(url, '_blank')} />
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ ...styles.cardInfo, border: '2px solid #B21F24', marginBottom: '20px' }}>
        <label style={{ ...styles.label, color: '#B21F24' }}>DIAGNOSTICO PROFESIONAL</label>
        {caso?.diagnostico ? (
          <>
            <p style={{ fontSize: '15px', lineHeight: '1.7', margin: '0 0 15px 0' }}>{caso.diagnostico}</p>
            <div style={{ padding: '12px', backgroundColor: '#E8F5E9', borderRadius: '6px' }}>
              <p style={{ color: '#2E7D32', fontWeight: 700, fontSize: '13px', margin: 0 }}>Diagnostico validado por arquitecto especialista</p>
            </div>
          </>
        ) : (
          <p style={{ color: '#6E6E73', fontStyle: 'italic', margin: 0 }}>El diagnostico esta siendo preparado por el arquitecto asignado.</p>
        )}
      </div>
      <button onClick={onEscalate} style={{ ...styles.btnPrimary }}>Ver opciones de asesoramiento</button> {actuaciones.length > 0 && <div style={{ marginTop: '20px' }}>{actuaciones.map(a => <div key={a.id} style={{ ...styles.cardInfo, border: '2px solid #E5E5E7', marginBottom: '12px' }}><label style={{ ...styles.label, color: '#B21F24' }}>HISTORIAL DE ACTUACIONES</label><p style={{ fontSize: '11px', fontWeight: 900, color: '#6E6E73', margin: '0 0 4px 0' }}>{a.nivel_servicio}{' — '}{({'Nivel 0':'Consulta Inicial','Nivel 1':'Informe Tecnico','Nivel 1+':'Informe Ampliado','Nivel 2':'Videollamada Tecnica','Nivel 3':'Visita Presencial con Informe','Nivel 4a':'Pautas Terapeuticas','Nivel 4b':'Memoria Descriptiva','Nivel 5':'Costos de Obra','Nivel 6':'Supervision de Obra','Nivel 7':'Otras Actuaciones'})[a.nivel_servicio] || ''}</p><p style={{ fontSize: '14px', lineHeight: '1.6', margin: '0 0 10px 0' }}>{a.respuesta_texto}</p>{a.estado === 'solicitada' && <p style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 900, margin: '0 0 8px 0' }}>PAGO PENDIENTE — {a.metodo_pago}</p>}{a.recomendacion && <p style={{ fontSize: '12px', color: '#B21F24', fontWeight: 700, margin: 0 }}>Proxima recomendacion: {a.recomendacion}{' — '}{({'Nivel 0':'Consulta Inicial','Nivel 1':'Informe Tecnico','Nivel 1+':'Informe Ampliado','Nivel 2':'Videollamada Tecnica','Nivel 3':'Visita Presencial con Informe','Nivel 4a':'Pautas Terapeuticas','Nivel 4b':'Memoria Descriptiva','Nivel 5':'Costos de Obra','Nivel 6':'Supervision de Obra','Nivel 7':'Otras Actuaciones'})[a.recomendacion] || ''}</p>}</div>)}</div>}
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
      <button onClick={onBack} style={{ ...styles.btnLuxuryBack, marginTop: '15px' }}>Volver a mi consulta</button>
    </div>
  );
}

// --- PANEL DIRECTOR ---
function PanelCDirector({ currentUser, userProfile, onCase, onConfig, onTeam, onLogout, onConsultas, onAssign, onBiblioteca, onPagos }: any) {
  const [casos, setCasos] = useState<any[]>([]);
  const [arquitectos, setArquitectos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [asignando, setAsignando] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const casosRef = collection(db, 'Estudios', ESTUDIO_ID, 'Casos');
      const snapshot = await getDocs(casosRef);
      const ORDEN = { 'NUEVO': 0, 'PAGO PENDIENTE': 1, 'EN ANALISIS': 2, 'RESPONDIDA': 3 };
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (ORDEN[a.estado] ?? 2) - (ORDEN[b.estado] ?? 2) || (b.fecha_creacion?.toMillis?.() ?? 0) - (a.fecha_creacion?.toMillis?.() ?? 0));
      setCasos(data);

      const arqQuery = query(
        collection(db, 'Usuarios'),
        where('rol', '==', 'arquitecto'),
        where('estudio_id', '==', ESTUDIO_ID)
      );
      const arqSnap = await getDocs(arqQuery);
      const arqData = arqSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setArquitectos(arqData);
    } catch (e) {
      console.error('Error cargando datos:', e);
    }
    setLoading(false);
  };

  const asignarArquitecto = async (arquitectoId: string, arquitectoNombre: string) => {
    if (!seleccionado) return;
    setAsignando(true);
    try {
      const casoRef = doc(db, 'Estudios', ESTUDIO_ID, 'Casos', seleccionado);
      await updateDoc(casoRef, {
        arquitecto_asignado: arquitectoId,
        arquitecto_nombre: arquitectoNombre,
        estado: 'EN ANÁLISIS'
      });
      setCasos(prev => prev.map(c =>
        c.id === seleccionado
          ? { ...c, arquitecto_asignado: arquitectoId, arquitecto_nombre: arquitectoNombre, estado: 'EN ANÁLISIS' }
          : c
      ));
     const casoActual = casos.find(c => c.id === seleccionado);
      setSeleccionado(null);
      try {
        const arqSnap = await getDoc(doc(db, 'Usuarios', arquitectoId));
        if (arqSnap.exists()) {
          const arqData = arqSnap.data();
          const emailjs = await import('@emailjs/browser');
          await emailjs.send('delamatriz', 'template_no31o7y', {
            asunto: 'Nuevo caso asignado - De La Matriz',
            mensaje: 'Hola ' + arquitectoNombre + ', se te asigno un nuevo caso.\n\nInmueble: ' + (casoActual?.direccion_inmueble || '') + '\nDescripcion: ' + (casoActual?.descripcion || ''),
            destinatario: arqData.email
          }, 'd1aTzq_ytY2X8Mrdn');
        }
      } catch(emailErr) {
        console.error('Email arquitecto:', emailErr);
      }
    } catch (e) {
      console.error('Error asignando:', e);
    }
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
    <button onClick={onConsultas} style={{ ...styles.btnPrimary, marginBottom: '9px' }}>Ver todas las consultas</button>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '30px', width: '100%', flexWrap: 'wrap' }}>
        <button onClick={onTeam} style={{ ...styles.btnSecondaryOutline, flex: 1, fontSize: '10px' }}>Gestión de equipo</button>
        <button onClick={onConfig} style={{ ...styles.btnSecondaryOutline, flex: 1, fontSize: '10px' }}>Configuración</button> 
        <button onClick={onBiblioteca} style={{ ...styles.btnSecondaryOutline, flex: 1, fontSize: '10px' }}>Biblioteca</button>
        <button onClick={onPagos} style={{ ...styles.btnSecondaryOutline, flex: 1, fontSize: '10px' }}>Tesorería</button>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{c.usuario_nombre || 'Usuario'}</strong>
                      {c.fecha_creacion && c.estado !== 'RESPONDIDA' && (() => { const horas = Math.floor((new Date().getTime() - (c.fecha_creacion.toDate ? c.fecha_creacion.toDate() : new Date(c.fecha_creacion)).getTime()) / (1000 * 60 * 60)); return <span style={{ fontSize: '10px', fontWeight: 900, padding: '3px 8px', borderRadius: '4px', backgroundColor: horas < 24 ? '#E8F5E9' : horas < 48 ? '#FFFDE7' : '#FFEBEE', color: horas < 24 ? '#2E7D32' : horas < 48 ? '#F57F17' : '#B21F24' }}>{horas < 24 ? 'En plazo' : horas < 48 ? horas + 'hs' : 'VENCIDO'}</span>; })()}
                    </div>
                    <p style={{ fontSize: '12px', color: THEME.gray, marginTop: '3px' }}>{c.descripcion?.substring(0, 60)}...</p>
                    <p style={{ fontSize: '11px', color: THEME.gray }}>{c.direccion_inmueble}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 900, color: colors.text, border: `1px solid ${colors.text}`, padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>{c.estado}</span>
                    <button
                      onClick={() => setSeleccionado(c.id)}
                      style={{ fontSize: '10px', fontWeight: 900, backgroundColor: THEME.primary, color: THEME.white, border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                    >
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

      {/* Modal de Asignación */}
      {seleccionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: THEME.white, padding: '35px', borderRadius: '12px', width: '90%', maxWidth: '420px', border: THEME.border }}>
            <h3 style={{ margin: '0 0 8px 0', fontWeight: 900 }}>ASIGNAR ARQUITECTO</h3>
            <p style={{ color: THEME.gray, fontSize: '13px', marginBottom: '25px' }}>Seleccioná el profesional responsable para este caso.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {arquitectos.length === 0 ? (
                <p style={{ color: THEME.gray, textAlign: 'center' }}>No hay arquitectos registrados.</p>
              ) : arquitectos.map(arq => (
                <button
                  key={arq.id}
                  onClick={() => asignarArquitecto(arq.id, arq.nombre)}
                  disabled={asignando}
                  style={{ padding: '15px 20px', textAlign: 'left', border: THEME.border, borderRadius: '8px', cursor: 'pointer', background: THEME.white, fontSize: '14px', fontWeight: 700, opacity: asignando ? 0.7 : 1 }}
                >
                  {arq.nombre}
                  <span style={{ display: 'block', fontSize: '11px', color: THEME.gray, fontWeight: 400, marginTop: '3px' }}>{arq.email}</span>
                </button>
              ))}
              <button onClick={() => setSeleccionado(null)} style={{ marginTop: '10px', border: 'none', background: 'none', color: THEME.gray, cursor: 'pointer', fontSize: '13px' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- PANEL ARQUITECTO DASHBOARD ---
function PanelADashboard({ currentUser, userProfile, onCase, onLogout, onBiblioteca, onMisCasos, onMiCuenta, onMiPerfil }: any) {
  const [casos, setCasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!currentUser) return;
    const fetchCasos = async () => {
      const casosRef = collection(db, 'Estudios', ESTUDIO_ID, 'Casos');
      const q = query(casosRef, where('arquitecto_asignado', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      const ORDEN_DASH: Record<string, number> = { 'NUEVO': 0, 'PAGO PENDIENTE': 1, 'EN ANALISIS': 2, 'RESPONDIDA': 3 };
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (ORDEN_DASH[a.estado] ?? 2) - (ORDEN_DASH[b.estado] ?? 2) || (b.fecha_creacion?.toMillis?.() ?? 0) - (a.fecha_creacion?.toMillis?.() ?? 0));
      setCasos(data);
      setLoading(false);
    };
    fetchCasos();
  }, [currentUser]);

  const casosActivos = casos.filter(c => !['RESPONDIDA', 'CERRADA'].includes(c.estado)).length;
  const casosRespondidos = casos.filter(c => c.estado === 'RESPONDIDA').length;
  const honorariosPendientes = casos.filter(c => c.pago_estado === 'pendiente' && c.honorario_arquitecto).reduce((acc, c) => acc + (c.honorario_arquitecto || 0), 0);
  const honorariosCobrados = casos.filter(c => c.pago_estado === 'pagado' && c.honorario_arquitecto).reduce((acc, c) => acc + (c.honorario_arquitecto || 0), 0);

  return (
    <div style={styles.container}>
      <div style={styles.engineeringHeader}>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: THEME.gray }}>PANEL ARQUITECTO</span>
        <button onClick={onLogout} style={styles.btnBack}>Cerrar sesión</button>
      </div>
      <h2 style={styles.h2}>Bienvenido, {userProfile?.nombre || 'Arquitecto'}</h2>

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: THEME.border }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: THEME.gray, marginBottom: '8px' }}>CASOS ACTIVOS</p>
          <p style={{ fontSize: '20px', fontWeight: 900, color: THEME.primary }}>{loading ? '—' : casosActivos}</p>
        </div>
        <div style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: THEME.border }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: THEME.gray, marginBottom: '8px' }}>RESPONDIDOS</p>
          <p style={{ fontSize: '20px', fontWeight: 900, color: '#2E7D32' }}>{loading ? '—' : casosRespondidos}</p>
        </div>
        <div style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: THEME.border }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: THEME.gray, marginBottom: '8px' }}>HONORARIOS PENDIENTES</p>
          <p style={{ fontSize: '20px', fontWeight: 900, color: THEME.primary }}>{loading ? '—' : `$${honorariosPendientes.toLocaleString('es-UY')}`}</p>
        </div>
        <div style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: THEME.border }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: THEME.gray, marginBottom: '8px' }}>HONORARIOS COBRADOS</p>
          <p style={{ fontSize: '20px', fontWeight: 900, color: '#2E7D32' }}>{loading ? '—' : `$${honorariosCobrados.toLocaleString('es-UY')}`}</p>
        </div>
      </div>

      {/* Navegación */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '30px' }}>
        <button onClick={onMisCasos} style={styles.btnSecondaryOutline}>Mis Casos</button>
        <button onClick={onMiCuenta} style={styles.btnSecondaryOutline}>Mi Cuenta</button>
        <button onClick={onBiblioteca} style={styles.btnSecondaryOutline}>Biblioteca</button>
        <button onClick={onMiPerfil} style={styles.btnSecondaryOutline}>Mi Perfil</button>
      </div>

      {/* Casos recientes */}
      <label style={styles.label}>CASOS RECIENTES</label>
      {loading ? <p style={{ color: THEME.gray }}>Cargando...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {casos.length === 0 ? (
            <div style={{ ...styles.cardInfo, border: THEME.border, textAlign: 'center' }}>
              <p style={{ color: THEME.gray }}>No tenés casos asignados actualmente.</p>
            </div>
          ) : casos.slice(0, 3).map(c => (
            <div key={c.id} style={{ ...styles.itemCase, border: THEME.border, backgroundColor: c.estado === 'RESPONDIDA' ? '#E8F5E9' : c.estado === 'EN ANÁLISIS' || c.estado === 'EN ANALISIS' ? '#FFFDE7' : c.estado === 'NUEVO' ? '#E3F2FD' : c.estado === 'FINALIZADA SIN PAGO' ? '#FFEBEE' : '#F5F5F7' }} onClick={() => onCase(c.id)}>
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
function ScreenOpciones({ caseId, onSelect, onBack }: any) { const SERVICIOS: any = {'Nivel 0':{title:'Consulta Inicial',price:'Gratis',desc:'Primera consulta tecnica sin costo.',plazo:''},'Nivel 1':{title:'Informe Tecnico',price:'$3.800',desc:'Documento tecnico con causas y recomendaciones.',plazo:'Entrega estimada en 72 hs habiles'},'Nivel 1+':{title:'Informe Ampliado',price:'$5.600',desc:'Informe tecnico detallado con analisis profundo.',plazo:'Entrega estimada en 72 hs habiles'},'Nivel 2':{title:'Videollamada Tecnica',price:'$3.500',desc:'Visita teledirigida en tiempo real.',plazo:'Se coordina en 24 hs'},'Nivel 3':{title:'Visita Presencial con Informe',price:'$6.800',desc:'Relevamiento in situ y diagnostico confirmado.',plazo:'Se coordina en 48 hs habiles'},'Nivel 4a':{title:'Pautas Terapeuticas',price:'$4.500',desc:'Guia tecnica para reparaciones.',plazo:'Fecha de entrega coordinada en 48 hs'},'Nivel 4b':{title:'Memoria Descriptiva',price:'$12.600',desc:'Documentacion tecnica para obras de mayor entidad.',plazo:'Fecha de entrega coordinada en 48 hs'},'Nivel 5':{title:'Costos de Obra',price:'$15.000',desc:'Solicitud y gestion de presupuestos.',plazo:'A coordinar con el arquitecto'},'Nivel 6':{title:'Supervision de Obra',price:'10%',desc:'Acompanamiento profesional durante la ejecucion.',plazo:'A coordinar con el arquitecto'},'Nivel 7':{title:'Otras Actuaciones',price:'$3.500',desc:'Gestion tecnica personalizada.',plazo:'A coordinar con el arquitecto'}}; const [rec, setRec] = React.useState(''); const [pendiente, setPendiente] = React.useState<any>(null); const [casoEstado, setCasoEstado] = React.useState(''); const [precioPropuesto, setPrecioPropuesto] = React.useState(''); const [precioValidado, setPrecioValidado] = React.useState(false); const [modalFinalizar, setModalFinalizar] = React.useState(false); const [motivoFinalizar, setMotivoFinalizar] = React.useState(''); const [detalleFinalizar, setDetalleFinalizar] = React.useState(''); const [finalizado, setFinalizado] = React.useState(false); const [enviando, setEnviando] = React.useState(false);React.useEffect(() => { if (!caseId) return; getDoc(doc(db,'Estudios',ESTUDIO_ID,'Casos',caseId)).then(d => { if (d.exists()) { const data = d.data(); setCasoEstado(data.estado || ''); setPrecioPropuesto(data.precio_propuesto || ''); setPrecioValidado(data.precio_validado === true); } }); getDocs(collection(db,'Estudios',ESTUDIO_ID,'Casos',caseId,'Actuaciones')).then(snap => { const docs = snap.docs.map(d => d.data()); if (docs.length > 0) { const ultima = docs[docs.length-1]; if (ultima.estado === 'solicitada') { setPendiente(ultima); } else { setRec(ultima.recomendacion || ''); } } }); }, [caseId]); const s = SERVICIOS[rec]; const handleFinalizarConsulta = async () => { if (!motivoFinalizar || enviando) return; setEnviando(true); try { await updateDoc(doc(db,'Estudios',ESTUDIO_ID,'Casos',caseId),{estado:'FINALIZADA SIN PAGO',motivo_finalizacion:motivoFinalizar,detalle_finalizacion:detalleFinalizar,fecha_finalizacion:new Date()}); const casoSnap = await getDoc(doc(db,'Estudios',ESTUDIO_ID,'Casos',caseId)); const casoData: any = casoSnap.data() || {}; const lineas = ['El usuario ' + (casoData.usuario_nombre||'') + ' decidio finalizar la consulta sin proceder al pago.','','Motivo: ' + motivoFinalizar]; if (detalleFinalizar) lineas.push('Detalle: ' + detalleFinalizar); lineas.push(''); lineas.push('Caso: ' + (casoData.direccion_inmueble||'-')); lineas.push('Descripcion: ' + (casoData.descripcion||'').substring(0,200)); const mensajeBase = lineas.join('\n'); const emailjs = await import('@emailjs/browser'); try { await emailjs.send('delamatriz','template_no31o7y',{asunto:'Consulta finalizada sin pago - De La Matriz',mensaje:mensajeBase,destinatario:'delamatriz@gmail.com'},'d1aTzq_ytY2X8Mrdn'); } catch(e) { console.error('Email director:',e); } if (casoData.arquitecto_asignado) { try { const arqSnap = await getDoc(doc(db,'Usuarios',casoData.arquitecto_asignado)); if (arqSnap.exists()) { await emailjs.send('delamatriz','template_no31o7y',{asunto:'Consulta finalizada sin pago - De La Matriz',mensaje:mensajeBase,destinatario:arqSnap.data().email},'d1aTzq_ytY2X8Mrdn'); } } catch(e) { console.error('Email arquitecto:',e); } } setFinalizado(true); } catch(e) { console.error('Error finalizando:',e); alert('Error al finalizar la consulta. Intentalo nuevamente.'); setEnviando(false); } }; return (<div style={styles.container}><button onClick={onBack} style={styles.btnBack}>Volver</button><h2 style={styles.h2}>OPCIONES DE ASESORAMIENTO</h2>{modalFinalizar && (<div style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',backgroundColor:'rgba(0,0,0,0.6)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000}}><div style={{backgroundColor:'#FFFFFF',padding:'28px',borderRadius:'12px',width:'90%',maxWidth:'420px',border:'1px solid #E5E5E7'}}>{finalizado ? (<><p style={{fontSize:'32px',margin:'0 0 12px 0'}}>✅</p><h3 style={{fontSize:'15px',fontWeight:900,color:'#2E7D32',margin:'0 0 12px 0'}}>CONSULTA FINALIZADA</h3><p style={{fontSize:'13px',color:'#1D1D1F',margin:'0 0 8px 0',lineHeight:'1.5'}}>Gracias por usar nuestro servicio.</p><p style={{fontSize:'12px',color:'#6E6E73',margin:'0 0 24px 0',lineHeight:'1.5'}}>Si mas adelante queres volver a consultarnos, podes crear una nueva consulta cuando lo necesites.</p><button onClick={onBack} style={{width:'100%',padding:'14px',backgroundColor:'transparent',color:'#1D1D1F',border:'2px solid #1D1D1F',borderRadius:'6px',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Volver a mi consulta</button></>) : (<><h3 style={{fontSize:'15px',fontWeight:900,color:'#1D1D1F',margin:'0 0 6px 0'}}>FINALIZAR CONSULTA</h3><p style={{fontSize:'12px',color:'#6E6E73',margin:'0 0 20px 0'}}>Contanos por que decides no continuar. Tu opinion nos ayuda a mejorar.</p><div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'16px'}}>{['No puedo pagarlo en este momento','No estoy de acuerdo con el diagnostico','Voy a resolverlo por mi cuenta','Otro motivo'].map(motivo => (<button key={motivo} onClick={() => setMotivoFinalizar(motivo)} style={{padding:'12px 16px',textAlign:'left',border:motivoFinalizar===motivo?'2px solid #B21F24':'2px solid #1D1D1F',borderRadius:'8px',cursor:'pointer',backgroundColor:motivoFinalizar===motivo?'#FFF0F0':'#FFFFFF',fontSize:'13px',fontWeight:motivoFinalizar===motivo?700:400,color:motivoFinalizar===motivo?'#B21F24':'#1D1D1F'}}>{motivo}</button>))}</div><textarea placeholder="Podés agregar mas detalles si queres (opcional)" value={detalleFinalizar} onChange={e => setDetalleFinalizar(e.target.value)} style={{width:'100%',padding:'10px',border:'1px solid #E5E5E7',borderRadius:'8px',fontSize:'13px',minHeight:'80px',boxSizing:'border-box',marginBottom:'16px',fontFamily:'inherit',resize:'none'}} /><div style={{display:'flex',gap:'10px'}}><button onClick={() => {setModalFinalizar(false);setMotivoFinalizar('');setDetalleFinalizar('');}} style={{flex:1,padding:'12px',backgroundColor:'transparent',border:'2px solid #1D1D1F',borderRadius:'6px',fontSize:'13px',cursor:'pointer',color:'#1D1D1F'}}>Cancelar</button><button onClick={handleFinalizarConsulta} disabled={!motivoFinalizar || enviando} style={{flex:1,padding:'12px',backgroundColor:motivoFinalizar?'#B21F24':'#6E6E73',color:'#FFFFFF',border:'2px solid #1D1D1F',borderRadius:'6px',fontSize:'13px',fontWeight:700,cursor:motivoFinalizar?'pointer':'not-allowed'}}>{enviando ? 'Enviando...' : 'Confirmar finalizacion'}</button></div></>)}</div></div>)}<p style={styles.subtitleBold}>Actuacion recomendada por el arquitecto especialista.</p>{pendiente ? (<div style={{...styles.cardEng,border:'2px solid #F59E0B'}}><p style={{fontSize:'11px',fontWeight:900,color:'#F59E0B',margin:'0 0 8px 0'}}>PAGO PENDIENTE</p><strong>{pendiente.nombre_servicio}</strong><p style={{fontSize:'13px',color:THEME.gray,marginTop:'8px'}}>{pendiente.precio}</p><p style={{fontSize:'12px',color:THEME.gray,marginTop:'8px'}}>Metodo de pago: {pendiente.metodo_pago}</p><p style={{fontSize:'12px',color:'#B21F24',fontWeight:700,marginTop:'12px'}}>El estudio se pondra en contacto para coordinar el pago y confirmar el servicio.</p></div>) : s ? (<div style={{...styles.cardEng,border:THEME.border}}><div style={{display:'flex',justifyContent:'space-between'}}><strong>{s.title}</strong><span style={styles.priceTag}>{precioValidado && precioPropuesto ? '$' + Number(precioPropuesto).toLocaleString('es-UY') : s.price}</span></div><p style={{fontSize:'13px',color:THEME.gray,marginTop:'8px'}}>{s.desc}</p>{s.plazo && <p style={{fontSize:'11px',fontWeight:900,color:'#2E7D32',marginTop:'8px',letterSpacing:'0.05em'}}>⏱ {s.plazo}</p>}<button onClick={() => onSelect({id:rec,...s,price:(precioValidado && precioPropuesto ? '$' + Number(precioPropuesto).toLocaleString('es-UY') : s.price)})} style={{...styles.btnPrimary,height:'40px',marginTop:'15px',fontSize:'13px'}}>Contratar este servicio</button><button onClick={() => setModalFinalizar(true)} style={{backgroundColor:'transparent',color:'#B21F24',border:'2px solid #B21F24',padding:'12px',fontSize:'13px',fontWeight:700,cursor:'pointer',borderRadius:'6px',marginTop:'10px',width:'100%'}}>Finalizar la consulta</button></div>) : (<div style={{...styles.cardInfo,border:'2px solid #E5E5E7',textAlign:'center'}}><p style={{color:'#6E6E73',fontSize:'13px',fontWeight:700,margin:'0 0 8px 0'}}>{casoEstado === 'RESPONDIDA' ? 'Tu consulta fue respondida.' : 'El arquitecto esta trabajando en tu consulta.'}</p><p style={{color:THEME.gray,fontSize:'12px',margin:0}}>{casoEstado === 'RESPONDIDA' ? 'Por el momento no hay nuevas actuaciones recomendadas.' : 'Te avisaremos cuando este lista la recomendacion a seguir.'}</p></div>)}</div>); }
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

function ScreenMetodoPago({ caseId, currentUser, selectedService, onBack, onDone }: any) { const [guardando, setGuardando] = React.useState(false); const [modoInternacional, setModoInternacional] = React.useState(false); const [paisResidencia, setPaisResidencia] = React.useState(''); const [emailContacto, setEmailContacto] = React.useState(''); const [confirmadoInternacional, setConfirmadoInternacional] = React.useState(false); const parsePrecio = (p: string) => { const num = parseInt((p||'').replace(/[^0-9]/g,'')); return isNaN(num) ? 0 : num; }; const handlePagarMP = async () => { if (!caseId || !currentUser) return; setGuardando(true); try { const actuacionRef = await addDoc(collection(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId, 'Actuaciones'), { nivel_servicio: selectedService?.id || '', nombre_servicio: selectedService?.title || '', precio: selectedService?.price || '', metodo_pago: 'MercadoPago', pago_usuario: 'pendiente', pago_arquitecto: 'pendiente', estado: 'iniciando_pago', fecha: new Date(), usuario_id: currentUser.uid, respuesta_texto: '', recomendacion: '', documento_url: '', honorario_arquitecto: 0 }); await updateDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId), { estado: 'PAGO PENDIENTE' }); const res = await fetch('https://southamerica-east1-de-la-matriz---online.cloudfunctions.net/crearPreferenciaPago', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo: selectedService?.title || 'Actuacion tecnica', precio: parsePrecio(selectedService?.price || '0'), caseId: caseId, actuacionId: actuacionRef.id }) }); const data = await res.json(); if (data.sandboxInitPoint) { await updateDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId, 'Actuaciones', actuacionRef.id), { preferenceId: data.preferenceId }); window.location.href = data.sandboxInitPoint; } else { alert('Error al generar el pago. Por favor intentá nuevamente.'); setGuardando(false); } } catch(e) { console.error('Error pago:', e); alert('Error al procesar el pago.'); setGuardando(false); } }; const handleCoordinarInternacional = async () => { if (!caseId || !currentUser || !paisResidencia || !emailContacto) return; setGuardando(true); await addDoc(collection(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId, 'Actuaciones'), { nivel_servicio: selectedService?.id || '', nombre_servicio: selectedService?.title || '', precio: selectedService?.price || '', metodo_pago: 'Internacional', pago_usuario: 'pendiente', pago_arquitecto: 'pendiente', estado: 'coordinando_pago', pais_residencia: paisResidencia, email_contacto: emailContacto, fecha: new Date(), usuario_id: currentUser.uid, respuesta_texto: '', recomendacion: '', documento_url: '', honorario_arquitecto: 0 }); await updateDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId), { estado: 'PAGO COORDINANDO' }); try { const emailjs = await import('@emailjs/browser'); await emailjs.send('delamatriz', 'template_no31o7y', { asunto: 'Solicitud de coordinacion de pago internacional — De La Matriz', mensaje: 'Un usuario solicita coordinar pago desde el exterior.\n\nPais: ' + paisResidencia + '\nEmail de contacto: ' + emailContacto + '\nServicio: ' + (selectedService?.title||'') + '\nPrecio: ' + (selectedService?.price||'') + '\nCaso ID: ' + caseId, destinatario: 'delamatriz@gmail.com' }, 'd1aTzq_ytY2X8Mrdn'); } catch(e) { console.error('Error email:', e); } setGuardando(false); setConfirmadoInternacional(true); }; if (confirmadoInternacional) return (<div style={styles.container}><h2 style={styles.h2}>SOLICITUD RECIBIDA</h2><div style={{...styles.cardInfo, border: '2px solid #2E7D32', marginTop: '20px'}}><p style={{color:'#2E7D32', fontWeight:700, fontSize:'15px', margin:'0 0 8px 0'}}>Tu solicitud fue registrada correctamente.</p><p style={{color:THEME.gray, fontSize:'13px', margin:0}}>Te contactaremos en las proximas 24 horas al email que nos proporcionaste para coordinar la forma de pago mas conveniente segun tu pais.</p></div><button onClick={onDone} style={{...styles.btnPrimary, marginTop:'20px'}}>Volver a mi consulta</button></div>); return (<div style={styles.container}><button onClick={onBack} style={styles.btnBack}>Volver</button><h2 style={styles.h2}>CONFIRMAR Y PAGAR</h2><div style={{...styles.cardInfo, border: '2px solid #1D1D1F', marginBottom: '20px'}}><p style={{fontSize:'11px', fontWeight:900, letterSpacing:'0.1em', color:'#6E6E73', margin:'0 0 8px 0'}}>RESUMEN DEL SERVICIO</p><p style={{fontSize:'16px', fontWeight:700, margin:'0 0 4px 0'}}>{selectedService?.title}</p><p style={{fontSize:'22px', fontWeight:900, color:'#B21F24', margin:0}}>{selectedService?.price}</p></div>{!modoInternacional && (<><div style={{padding:'16px',border:'1px solid #E5E5E7',borderRadius:'8px',marginBottom:'16px',backgroundColor:'#F9F9F9'}}><p style={{fontSize:'11px',fontWeight:900,letterSpacing:'0.1em',color:'#1D1D1F',margin:'0 0 12px 0'}}>CÓMO FUNCIONA</p><div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'12px'}}><p style={{fontSize:'12px',color:'#1D1D1F',margin:0}}>1. Realizás el pago de forma segura</p><p style={{fontSize:'12px',color:'#1D1D1F',margin:0}}>2. En las próximas 24 hs el arquitecto asignado te contacta para confirmar los plazos</p><p style={{fontSize:'12px',color:'#1D1D1F',margin:0}}>3. Recibís tu informe o actuación en el plazo acordado</p></div><div style={{display:'flex',flexDirection:'column',gap:'6px',paddingTop:'12px',borderTop:'1px solid #E5E5E7'}}><p style={{fontSize:'11px',color:'#2E7D32',fontWeight:700,margin:0}}>✅ Pago 100% seguro via MercadoPago</p><p style={{fontSize:'11px',color:'#2E7D32',fontWeight:700,margin:0}}>✅ Respaldado por De La Matriz Arquitectos</p><p style={{fontSize:'11px',color:'#2E7D32',fontWeight:700,margin:0}}>✅ Si no recibís respuesta en 48 hs hábiles, te devolvemos el pago</p></div><div style={{paddingTop:'12px',borderTop:'1px solid #E5E5E7',marginTop:'8px'}}><p style={{fontSize:'11px',color:'#6E6E73',margin:'0 0 4px 0'}}>Consultas: delamatriz@gmail.com</p><p style={{fontSize:'11px',color:'#6E6E73',margin:0}}>Tel: +598 2902 9272</p></div></div><button onClick={handlePagarMP} disabled={guardando} style={{...styles.btnPrimary, width:'100%', fontSize:'14px', padding:'18px'}}>{guardando ? 'Redirigiendo al pago...' : 'PAGAR AHORA'}</button><p style={{fontSize:'11px', color:THEME.gray, marginTop:'10px', textAlign:'center'}}>Aceptamos tarjetas de credito y debito, transferencias bancarias, ABITAB y RedPagos. El pago se realiza a traves de una pasarela segura.</p><div style={{marginTop:'30px', padding:'16px', border:'1px solid #E5E5E7', borderRadius:'8px'}}><p style={{fontSize:'13px', fontWeight:700, margin:'0 0 6px 0'}}>¿Pagas desde fuera de Uruguay?</p><p style={{fontSize:'12px', color:THEME.gray, margin:'0 0 12px 0'}}>Si residis en Argentina, Espana, Estados Unidos u otro pais, coordinamos una forma de pago adecuada. Dejanos tu contacto y te respondemos en menos de 24 horas.</p><button onClick={() => setModoInternacional(true)} style={{backgroundColor:'transparent', color:'#B21F24', border:'2px solid #B21F24', padding:'10px 16px', fontSize:'12px', fontWeight:900, cursor:'pointer', borderRadius:'6px', width:'100%'}}>SOLICITAR COORDINACION DE PAGO</button></div></>)}{modoInternacional && (<div style={{...styles.cardInfo, border: '2px solid #1D1D1F'}}><p style={{fontSize:'11px', fontWeight:900, letterSpacing:'0.1em', color:'#B21F24', margin:'0 0 12px 0'}}>COORDINACION DE PAGO INTERNACIONAL</p><label style={{fontSize:'11px', fontWeight:700, color:'#6E6E73', display:'block', marginBottom:'4px'}}>PAIS DE RESIDENCIA</label><input type="text" placeholder="Ej: Argentina, Espana, EE.UU." value={paisResidencia} onChange={e => setPaisResidencia(e.target.value)} style={{width:'100%', padding:'10px', border:'2px solid #1D1D1F', borderRadius:'6px', fontSize:'14px', boxSizing:'border-box', marginBottom:'12px'}} /><label style={{fontSize:'11px', fontWeight:700, color:'#6E6E73', display:'block', marginBottom:'4px'}}>EMAIL DE CONTACTO</label><input type="email" placeholder="tu@email.com" value={emailContacto} onChange={e => setEmailContacto(e.target.value)} style={{width:'100%', padding:'10px', border:'2px solid #1D1D1F', borderRadius:'6px', fontSize:'14px', boxSizing:'border-box', marginBottom:'16px'}} /><button onClick={handleCoordinarInternacional} disabled={guardando || !paisResidencia || !emailContacto} style={{...styles.btnPrimary, width:'100%', fontSize:'13px', padding:'14px', opacity: (!paisResidencia || !emailContacto) ? 0.5 : 1}}>{guardando ? 'Enviando...' : 'ENVIAR SOLICITUD'}</button><button onClick={() => setModoInternacional(false)} style={{backgroundColor:'transparent', color:'#6E6E73', border:'none', padding:'10px', fontSize:'12px', cursor:'pointer', marginTop:'8px', width:'100%'}}>Volver al pago con MercadoPago</button></div>)}</div>); }
function ScreenPagoResultado({ tipo, onVolver }: any) { const config = tipo === 'exitoso' ? { color: '#2E7D32', titulo: 'PAGO CONFIRMADO', mensaje: 'Tu pago fue procesado exitosamente. El arquitecto recibio tu solicitud y comenzara a trabajar en tu caso a la brevedad.' } : tipo === 'pendiente' ? { color: '#E65100', titulo: 'PAGO PENDIENTE', mensaje: 'Tu pago esta siendo procesado. Cuando se confirme, te notificaremos por email y el arquitecto comenzara a trabajar en tu caso.' } : { color: '#B21F24', titulo: 'PAGO NO COMPLETADO', mensaje: 'El pago no pudo ser procesado. Podes intentar nuevamente desde tu panel de consultas o elegir otro metodo de pago.' }; return (<div style={styles.container}><h2 style={styles.h2}>{config.titulo}</h2><div style={{...styles.cardInfo, border: '2px solid ' + config.color, marginTop: '20px'}}><p style={{color: config.color, fontWeight: 700, fontSize: '15px', margin: '0 0 8px 0'}}>{config.mensaje}</p></div><button onClick={onVolver} style={{...styles.btnPrimary, marginTop: '20px'}}>Volver a mi consulta</button></div>); }
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
      <button onClick={onBack} style={styles.btnBack}>Volver</button>
      <h2 style={styles.h2}>SEGUIMIENTO DE CONSULTA</h2>
      <div style={{ ...styles.cardInfo, border: '2px solid #1D1D1F', marginBottom: '15px' }}>
        <label style={styles.label}>TU CONSULTA</label>
        <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: '#6E6E73', margin: '0 0 4px 0' }}>INMUEBLE</p>
        <p style={{ fontSize: '14px', margin: '0 0 15px 0' }}>{caso?.direccion_inmueble || '-'}</p>
        <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: '#6E6E73', margin: '0 0 4px 0' }}>DESCRIPCION</p>
        <p style={{ fontSize: '14px', lineHeight: '1.6', fontStyle: 'italic', margin: '0 0 15px 0' }}>"{caso?.descripcion}"</p>
        {caso?.fotos_urls && caso.fotos_urls.length > 0 && (
          <div>
            <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: '#6E6E73', margin: '0 0 8px 0' }}>EVIDENCIA FOTOGRAFICA</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {caso.fotos_urls.map((url, i) => (
                <img key={i} src={url} alt={'Foto ' + (i+1)} style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E5E5E7', cursor: 'pointer' }} onClick={() => window.open(url, '_blank')} />
              ))}
            </div>
          </div>
        )}
        <div style={{ borderTop: '1px solid #E5E5E7', paddingTop: '10px', marginTop: '15px' }}>
          <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: '#6E6E73', margin: '0 0 6px 0' }}>ESTADO</p>
          <span style={{ fontSize: '11px', fontWeight: 900, padding: '4px 10px', borderRadius: '4px', backgroundColor: '#FFFDE7', color: '#F57F17' }}>
            {caso?.estado || 'EN ANALISIS'}
          </span>
        </div>
      </div>
      <div style={{ ...styles.cardInfo, border: '1px solid #E5E5E7', backgroundColor: '#F0F4FF' }}>
        <p style={{ fontSize: '14px', color: '#1565C0', fontWeight: 600, margin: 0 }}>Un arquitecto especialista esta analizando tu caso. Te avisaremos cuando el diagnostico este listo.</p>
      </div>
      <button onClick={onActuaciones} style={{ ...styles.btnPrimary, marginTop: '20px' }}>Ver actuaciones tecnica a seguir</button>
    </div>
  );
}
function PanelBFicha({ caseId, onBack, onAdvanced, isDirectorView }: any) {
  const [caso, setCaso] = useState<any>(null);
  const [notaInterna, setNotaInterna] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [generandoIA, setGenerandoIA] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [verTabla, setVerTabla] = useState(false);
  const [precioPropuesto, setPrecioPropuesto] = useState(''); const [actuaciones, setActuaciones] = useState<any[]>([]); const [mensajeContacto, setMensajeContacto] = useState(''); const [enviandoContacto, setEnviandoContacto] = useState(false); const [contactoEnviado, setContactoEnviado] = useState(false);
  useEffect(() => {
    if (!caseId) return;
    getDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId)).then(d => {
      if (d.exists()) {
        const data = { id: d.id, ...d.data() } as any;
        setCaso(data);
        setNotaInterna(data.nota_interna || '');
        setPrecioPropuesto(data.precio_propuesto || '');
        setDiagnostico(data.diagnostico || '');
      }
    });
  }, [caseId]); useEffect(() => { if (!caseId) return; getDocs(collection(db,'Estudios',ESTUDIO_ID,'Casos',caseId,'Actuaciones')).then(snap => { setActuaciones(snap.docs.map(d => ({id:d.id,...d.data()}))); }); }, [caseId]);
  const handleValidarYNotificar = async () => {
    if (!diagnostico.trim()) return;
    setGuardando(true);
    try {
      await updateDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId), {
        diagnostico, nota_interna: notaInterna,
        estado: 'RESPONDIDA', fecha_respuesta: serverTimestamp()
      }); await addDoc(collection(db,'Estudios',ESTUDIO_ID,'Casos',caseId,'Actuaciones'),{nivel_servicio:'Nivel 0',nombre_servicio:'Consulta Inicial',respuesta_texto:'Consulta inicial respondida',recomendacion:caso?.recomendacion||'',documento_url:'',honorario_arquitecto:0,pago_usuario:'pagado',pago_arquitecto:'pagado',estado:'completada',fecha:new Date(),arquitecto_id:caso?.arquitecto_asignado||''});
   setEnviado(true);
      setCaso((prev: any) => ({ ...prev, estado: 'RESPONDIDA' }));
      try {
        const emailjs = await import('@emailjs/browser');
        await emailjs.send('delamatriz', 'template_no31o7y', {
          asunto: 'Tu diagnostico esta listo - De La Matriz',
          mensaje: 'Hola ' + (caso?.usuario_nombre || '') + ', tu consulta fue analizada.\n\nInmueble: ' + (caso?.direccion_inmueble || '') + '\n\nDiagnostico: ' + diagnostico + '\n\nIngresa al sistema para ver tu respuesta completa.',
          destinatario: caso?.usuario_email || ''
        }, 'd1aTzq_ytY2X8Mrdn');
      } catch(emailErr) {
        console.error('Email usuario:', emailErr);
      }
    } catch (e) { console.error('Error:', e); }
    setGuardando(false);
  };

  const handleContactoInicial = async () => { if (enviandoContacto || contactoEnviado) return; setEnviandoContacto(true); try { const emailjs = await import('@emailjs/browser'); await emailjs.send('delamatriz','template_no31o7y',{asunto:'Tu consulta esta siendo analizada - De La Matriz',mensaje:mensajeContacto,destinatario:caso?.usuario_email||''},'d1aTzq_ytY2X8Mrdn'); await updateDoc(doc(db,'Estudios',ESTUDIO_ID,'Casos',caseId),{contacto_inicial_enviado:true}); setContactoEnviado(true); } catch(e) { console.error('Error enviando contacto:',e); alert('Error al enviar el mensaje. Intentalo nuevamente.'); } setEnviandoContacto(false); }; const handleGuardarNota = async () => {
    setGuardando(true);
    try {
      await updateDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId), {
        nota_interna: notaInterna, diagnostico, precio_propuesto: precioPropuesto
      });
    } catch (e) { console.error('Error:', e); }
    setGuardando(false);
  };

  if (!caso) return <div style={styles.container}><p style={{ color: THEME.gray }}>Cargando ficha...</p></div>;

  const tiempoTranscurrido = () => {
    if (!caso.fecha_creacion) return '-';
    const ahora = new Date();
    const creacion = caso.fecha_creacion.toDate ? caso.fecha_creacion.toDate() : new Date(caso.fecha_creacion);
    const horas = Math.floor((ahora.getTime() - creacion.getTime()) / (1000 * 60 * 60));
    if (horas < 24) return horas + ' hs';
    return Math.floor(horas / 24) + ' dias';
  };

  return (
    <div style={{ ...styles.container, backgroundColor: THEME.background }}>
      <div style={styles.engineeringHeader}>
        <button onClick={onBack} style={styles.btnBack}>Volver</button>
        <span>{isDirectorView ? 'Vista Director' : 'Ficha Tecnica'}</span>
        
      </div>
      <h2 style={styles.h2}>FICHA DE CONSULTA TECNICA</h2>
      <p style={styles.subtitleBold}>Analisis de evidencia tecnica y validacion del diagnostico.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '15px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ ...styles.cardInfo, border: THEME.border }}>
            <label style={styles.label}>DATOS DEL EXPEDIENTE</label>
            <p style={{ fontWeight: 700, fontSize: '15px', margin: '0 0 4px 0' }}>{caso.usuario_nombre}</p>
            <p style={{ fontSize: '13px', color: THEME.gray, margin: '0 0 2px 0' }}>{caso.usuario_email}</p>
            {caso.usuario_telefono && <p style={{ fontSize: '13px', color: THEME.gray, margin: '0 0 10px 0' }}>{caso.usuario_telefono}</p>}
            <div style={{ borderTop: '1px solid #E5E5E7', paddingTop: '10px', marginTop: '5px' }}>
              <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: THEME.gray, margin: '0 0 4px 0' }}>INMUEBLE</p>
              <p style={{ fontSize: '13px', margin: '0 0 10px 0' }}>{caso.direccion_inmueble || '-'}</p>
            </div>
            <div style={{ borderTop: '1px solid #E5E5E7', paddingTop: '10px' }}>
              <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: THEME.gray, margin: '0 0 8px 0' }}>DESCRIPCION</p>
              <p style={{ fontSize: '14px', lineHeight: '1.6', fontStyle: 'italic', margin: 0 }}>"{caso.descripcion}"</p>
              {caso.fotos_urls && caso.fotos_urls.length > 0 && (
              <div style={{ borderTop: '1px solid #E5E5E7', paddingTop: '10px', marginTop: '10px' }}>
                <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: '#6E6E73', margin: '0 0 8px 0' }}>EVIDENCIA FOTOGRAFICA</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {caso.fotos_urls.map((url, i) => (
                    <img key={i} src={url} alt={'Foto ' + (i+1)} style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E5E5E7', cursor: 'pointer' }} onClick={() => window.open(url, '_blank')} />
                  ))}
                </div>
              </div>
            )}
            </div>
            <div style={{ borderTop: '1px solid #E5E5E7', paddingTop: '10px', marginTop: '10px' }}>
              <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: THEME.gray, margin: '0 0 6px 0' }}>ESTADO</p>
              <span style={{ fontSize: '11px', fontWeight: 900, padding: '4px 10px', borderRadius: '4px', backgroundColor: caso.estado === 'RESPONDIDA' ? '#E8F5E9' : caso.estado === 'EN ANALISIS' ? '#FFFDE7' : '#E3F2FD', color: caso.estado === 'RESPONDIDA' ? '#2E7D32' : caso.estado === 'EN ANALISIS' ? '#F57F17' : '#1565C0' }}>
                {caso.estado}
              </span>
            </div>
            {isDirectorView && (
              <div style={{ borderTop: '1px solid #E5E5E7', paddingTop: '10px', marginTop: '10px' }}>
                <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: THEME.gray, margin: '0 0 4px 0' }}>TIEMPO TRANSCURRIDO</p>
                <p style={{ fontSize: '13px', margin: 0 }}>{tiempoTranscurrido()}</p>
              </div>
            )}
            {isDirectorView && caso.recomendacion && (
              <div style={{ borderTop: '1px solid #E5E5E7', paddingTop: '10px', marginTop: '10px' }}>
                <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: '#B21F24', margin: '0 0 6px 0' }}>ACTUACION RECOMENDADA POR ARQUITECTO</p>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#1D1D1F', margin: '0' }}>{caso.recomendacion}{({'Nivel 0':' — Consulta Inicial','Nivel 1':' — Informe Tecnico','Nivel 1+':' — Informe Ampliado','Nivel 2':' — Videollamada Tecnica','Nivel 3':' — Visita Presencial','Nivel 4a':' — Pautas Terapeuticas','Nivel 4b':' — Memoria Descriptiva','Nivel 5':' — Costos de Obra','Nivel 6':' — Supervision de Obra','Nivel 7':' — Otras Actuaciones'} as any)[caso.recomendacion] || ''}</p>
              </div>
            )}
            {isDirectorView && caso.precio_propuesto && (
              <div style={{ borderTop: '1px solid #E5E5E7', paddingTop: '10px', marginTop: '10px' }}>
                <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: '#B21F24', margin: '0 0 6px 0' }}>PRECIO PROPUESTO POR ARQUITECTO</p>
                <p style={{ fontSize: '18px', fontWeight: 900, color: '#B21F24', margin: '0 0 10px 0' }}>$ {Number(caso.precio_propuesto).toLocaleString()} UYU</p>
                {caso.precio_validado ? (
                  <span style={{ fontSize: '11px', fontWeight: 900, padding: '4px 10px', borderRadius: '4px', backgroundColor: '#E8F5E9', color: '#2E7D32' }}>PRECIO VALIDADO</span>
                ) : (
                  <button onClick={async () => { await updateDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId), { precio_validado: true }); setCaso((prev: any) => ({ ...prev, precio_validado: true })); }} style={{ backgroundColor: '#B21F24', color: '#FFFFFF', border: 'none', padding: '8px 16px', fontSize: '11px', fontWeight: 900, cursor: 'pointer', borderRadius: '4px' }}>VALIDAR PRECIO</button>
                )}
              </div>
            )}
            {isDirectorView && caso.arquitecto_nombre && (
              <div style={{ borderTop: '1px solid #E5E5E7', paddingTop: '10px', marginTop: '10px' }}>
                <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: THEME.gray, margin: '0 0 4px 0' }}>ARQUITECTO ASIGNADO</p>
                <p style={{ fontSize: '13px', margin: 0 }}>{caso.arquitecto_nombre}</p>
              </div>
            )}
            {false && isDirectorView && (
              <div style={{ borderTop: '1px solid #E5E5E7', paddingTop: '10px', marginTop: '10px' }}>
                <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: THEME.gray, margin: '0 0 8px 0' }}>NIVEL DE SERVICIO</p>
                <select
                  value={caso.nivel_servicio || ''}
                  onChange={async e => {
                    await updateDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId), { nivel_servicio: e.target.value });
                    setCaso((prev: any) => ({ ...prev, nivel_servicio: e.target.value }));
                  }}
                  style={{ ...styles.inputFieldBold, marginBottom: '0' }}
                >
                  <option value="">Sin asignar</option>
                  <option value="Nivel 1">Nivel 1 — Informe Técnico</option>
                  <option value="Nivel 1+">Nivel 1+ — Informe Ampliado</option>
                  <option value="Nivel 2">Nivel 2 — Videollamada Técnica</option>
                  <option value="Nivel 3">Nivel 3 — Visita Presencial</option>
                  <option value="Nivel 4a">Nivel 4a — Pautas Terapéuticas</option>
                  <option value="Nivel 4b">Nivel 4b — Memoria Descriptiva</option>
                  <option value="Nivel 5">Nivel 5 — Gestión de Costos</option>
                  <option value="Nivel 6">Nivel 6 — Supervisión de Obra</option>
                </select>
              </div>
            )}
            {isDirectorView && (
              <div style={{ borderTop: '1px solid #E5E5E7', paddingTop: '10px', marginTop: '10px' }}>
                <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: THEME.gray, margin: '0 0 8px 0' }}>HONORARIO ARQUITECTO ($ UYU)</p>
                <input
                  type="number"
                  placeholder="Ingresá el monto"
                  value={caso.honorario_arquitecto || ''}
                  onChange={async e => {
                    const valor = Number(e.target.value);
                    await updateDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId), { honorario_arquitecto: valor });
                    setCaso((prev: any) => ({ ...prev, honorario_arquitecto: valor }));
                  }}
                  style={{ ...styles.inputFieldBold, marginBottom: '0' }}
                />
              </div>
            )}
            {isDirectorView && (
              <div style={{ borderTop: '1px solid #E5E5E7', paddingTop: '10px', marginTop: '10px' }}>
                <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: THEME.gray, margin: '0 0 8px 0' }}>ESTADO DE PAGO</p>
                {caso.pago_estado === 'pagado' ? (
                  <span style={{ fontSize: '11px', fontWeight: 900, padding: '4px 10px', borderRadius: '4px', backgroundColor: '#E8F5E9', color: '#2E7D32' }}>PAGADO</span>
                ) : (
                  <button onClick={async () => {
                    await updateDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Casos', caseId), { pago_estado: 'pagado' });
                    setCaso((prev: any) => ({ ...prev, pago_estado: 'pagado' }));
                  }} style={{ backgroundColor: '#2E7D32', color: '#FFFFFF', border: 'none', padding: '8px 16px', fontSize: '11px', fontWeight: 900, cursor: 'pointer', borderRadius: '4px' }}>
                    MARCAR COMO PAGADO
                  </button>
                )}
              </div>
            )}
            {isDirectorView && actuaciones.length > 0 && <div style={{...styles.cardInfo,border:'2px solid #1D1D1F',marginTop:'15px'}}><label style={{...styles.label,color:'#B21F24'}}>HISTORIAL DE ACTUACIONES</label>{actuaciones.map(a => <div key={a.id} style={{borderTop:'1px solid #E5E5E7',paddingTop:'10px',marginTop:'10px'}}><p style={{fontSize:'11px',fontWeight:900,color:'#6E6E73',margin:'0 0 4px 0'}}>{a.nivel_servicio} — {a.nombre_servicio||''}</p><p style={{fontSize:'13px',margin:'0 0 6px 0'}}>{a.respuesta_texto?.substring(0,100)}{a.respuesta_texto?.length>100?'...':''}</p><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:'11px',color:a.pago_usuario==='pagado'?'#2E7D32':'#E65100',fontWeight:700}}>{a.nivel_servicio==='Nivel 0'?'GRATUITO':a.pago_usuario==='pagado'?'PAGADO':('PAGO PENDIENTE — '+(a.metodo_pago||''))}</span></div></div>)}</div>}
            {!isDirectorView && actuaciones.length > 0 && <div style={{...styles.cardInfo,border:'2px solid #1D1D1F',marginTop:'15px'}}><label style={{...styles.label,color:'#B21F24'}}>HISTORIAL DE ACTUACIONES</label>{actuaciones.map(a => <div key={a.id} style={{borderTop:'1px solid #E5E5E7',paddingTop:'10px',marginTop:'10px'}}><p style={{fontSize:'11px',fontWeight:900,color:'#6E6E73',margin:'0 0 4px 0'}}>{a.nivel_servicio}{' — '}{a.nombre_servicio||''}</p><p style={{fontSize:'13px',margin:'0 0 6px 0'}}>{a.respuesta_texto||'Sin respuesta aun'}</p><div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:'11px',fontWeight:700,color:a.pago_arquitecto==='pagado'?'#2E7D32':'#E65100'}}>{a.pago_arquitecto==='pagado'?'HONORARIO PAGADO':'HONORARIO PENDIENTE'}</span><span style={{fontSize:'11px',color:'#6E6E73'}}>{a.honorario_arquitecto?'$'+a.honorario_arquitecto:''}</span></div></div>)}</div>}
            {caso?.estado !== 'RESPONDIDA' && caso?.estado !== 'FINALIZADA SIN PAGO' && !isDirectorView && (<div style={{...styles.cardInfo,border:'2px solid #1D1D1F',marginTop:'15px'}}><label style={{fontSize:'11px',fontWeight:900,letterSpacing:'0.1em',color:'#1D1D1F',display:'block',marginBottom:'8px'}}>CONTACTO INICIAL CON EL USUARIO</label><p style={{fontSize:'11px',color:'#6E6E73',margin:'0 0 10px 0'}}>Enviá un mensaje al usuario confirmando que ya estas trabajando en su caso.</p>{contactoEnviado || caso?.contacto_inicial_enviado ? (<div style={{padding:'10px',backgroundColor:'#E8F5E9',borderRadius:'6px',border:'1px solid #2E7D32'}}><p style={{color:'#2E7D32',fontWeight:700,fontSize:'13px',margin:0}}>✅ Mensaje de contacto enviado al usuario</p></div>) : (<><textarea value={mensajeContacto || ('Hola ' + (caso?.usuario_nombre||'') + ', soy ' + (caso?.arquitecto_nombre||'el arquitecto asignado') + ' y ya estoy analizando tu consulta sobre ' + (caso?.direccion_inmueble||'tu inmueble') + '. En breve me pondre en contacto para confirmar los plazos de entrega. Ante cualquier duda podes responder este mensaje.')} onChange={e => setMensajeContacto(e.target.value)} style={{width:'100%',padding:'10px',border:'1px solid #E5E5E7',borderRadius:'6px',fontSize:'12px',minHeight:'100px',boxSizing:'border-box',marginBottom:'10px',fontFamily:'inherit',resize:'none'}} /><button onClick={handleContactoInicial} disabled={enviandoContacto} style={{width:'100%',padding:'12px',backgroundColor:'#1D1D1F',color:'#FFFFFF',border:'2px solid #1D1D1F',borderRadius:'6px',fontSize:'12px',fontWeight:700,cursor:'pointer',opacity:enviandoContacto?0.7:1}}>{enviandoContacto ? 'Enviando...' : 'Enviar mensaje al usuario'}</button></>)}</div>)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ ...styles.cardInfo, border: '2px solid #B21F24' }}>
            <label style={{ ...styles.label, color: '#B21F24' }}>DIAGNOSTICO TECNICO PROFESIONAL</label>
            {isDirectorView ? (
              <p style={{ fontSize: '14px', lineHeight: '1.6', margin: 0, fontStyle: caso.diagnostico ? 'normal' : 'italic', color: caso.diagnostico ? '#1D1D1F' : '#6E6E73' }}>
                {caso.diagnostico || 'Pendiente de diagnostico del arquitecto.'}
              </p>
            ) : (
              <>
              {caso.estado !== 'RESPONDIDA' && (
                <button
                  onClick={async () => {
                    setGenerandoIA(true);
                    try {
                      const prompt = 'Sos un arquitecto con mas de 20 anos de experiencia, especializado en patologias edilicias, arquitectura, construccion y normativa edilicia. Tu expertise principal es el diagnostico y rehabilitacion de edificios de propiedad horizontal, con profundo conocimiento de la normativa vigente en Uruguay y la region. Analiza el siguiente caso y genera un borrador de diagnostico tecnico profesional. DESCRIPCION DEL PROBLEMA: ' + caso.descripcion + ' DIRECCION DEL INMUEBLE: ' + caso.direccion_inmueble + ' Si el caso refiere a una patologia edilicia: identificar la patologia mas probable con su denominacion tecnica, explicar las causas tecnicas mas frecuentes, evaluar el nivel de urgencia, redactarse de forma clara y profesional, tener entre 150 y 250 palabras, concluir con una recomendacion de actuacion. Si el caso refiere a otra consulta tecnica responde con criterio profesional con la misma extension cerrando con una recomendacion. No incluyas disclaimers ni menciones a la IA. Responde directamente con el diagnostico. Si la descripcion del problema es vaga, insuficiente o no aporta datos tecnicos concretos, NO inventes un diagnostico. En ese caso responde solicitando informacion adicional especifica que necesitas para poder diagnosticar correctamente, como: tipo de manchas, ubicacion exacta, antiguedad del problema, condiciones del entorno, etc.';
                      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-goog-api-key': import.meta.env.VITE_GEMINI_API_KEY },
                        body: JSON.stringify({ contents: [{ parts: [...(caso.fotos_urls||[]).slice(0,3).map((url:string)=>({text:'Foto del caso: '+url})),{ text: prompt }] }] })
                      });
                      const data = await res.json();
                      const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                      setDiagnostico(texto);
                    } catch (e) {
                      console.error('Error Gemini:', e);
                    }
                    setGenerandoIA(false);
                  }}
                  disabled={generandoIA}
                  style={{ ...styles.btnSecondaryOutline, width: '100%', marginBottom: '10px', fontSize: '12px', padding: '10px' }}
                >
                  {generandoIA ? 'Generando borrador...' : 'Generar borrador con IA'}
                </button>
              )}
              <textarea
                placeholder="Redacta tu respuesta tecnica profesional..."
                value={diagnostico}
                onChange={e => setDiagnostico(e.target.value)}
                style={{ ...styles.textareaBold, minHeight: '160px', borderColor: '#B21F24' }}
                disabled={caso.estado === 'RESPONDIDA'}
             />
              </>
            )}
          </div>
          {!isDirectorView && (<div style={{ ...styles.cardInfo, border: '2px solid #1D1D1F', marginBottom: '15px' }}><label style={styles.label}>RECOMENDACION AL USUARIO</label><p style={{ fontSize: '11px', color: '#6E6E73', margin: '0 0 8px 0' }}>Selecciona el proximo nivel de servicio recomendado.</p><select value={caso?.recomendacion || ''} onChange={async e => { const v = e.target.value; setCaso((prev:any) => ({...prev,recomendacion:v})); await updateDoc(doc(db,'Estudios',ESTUDIO_ID,'Casos',caseId),{recomendacion:v}); }} style={{...styles.inputFieldBold,marginBottom:'0'}}><option value="">Sin recomendacion</option><option value="Nivel 1">Nivel 1 — Informe Tecnico</option><option value="Nivel 1+">Nivel 1+ — Informe Ampliado</option><option value="Nivel 2">Nivel 2 — Videollamada Tecnica</option><option value="Nivel 3">Nivel 3 — Visita Presencial</option><option value="Nivel 4a">Nivel 4a — Pautas Terapeuticas</option><option value="Nivel 4b">Nivel 4b — Memoria Descriptiva</option><option value="Nivel 5">Nivel 5 — Costos de Obra</option><option value="Nivel 6">Nivel 6 — Supervision de Obra</option><option value="Nivel 7">Nivel 7 — Otras Actuaciones</option></select></div>)} {!isDirectorView && (
            <div style={{ ...styles.cardInfo, border: '2px solid #1D1D1F' }}>
              <label style={styles.label}>NOTAS INTERNAS PRIVADAS</label>
              <p style={{ fontSize: '11px', color: '#6E6E73', margin: '0 0 8px 0' }}>Estas notas NO son visibles para el usuario ni el Director.</p>
              <textarea
                placeholder="Notas internas profesionales (privadas)..."
                value={notaInterna}
                onChange={e => setNotaInterna(e.target.value)}
                style={{ ...styles.textareaBold, minHeight: '100px' }}
              />
            </div>
          )} {false && isDirectorView && actuaciones.length > 0 && <div style={{...styles.cardInfo,border:'2px solid #1D1D1F',marginTop:'15px'}}><label style={{...styles.label,color:'#B21F24'}}>HISTORIAL DE ACTUACIONES</label>{actuaciones.map(a => <div key={a.id} style={{borderTop:'1px solid #E5E5E7',paddingTop:'10px',marginTop:'10px'}}><p style={{fontSize:'11px',fontWeight:900,color:'#6E6E73',margin:'0 0 4px 0'}}>{a.nivel_servicio} — {a.nombre_servicio||''}</p><p style={{fontSize:'13px',margin:'0 0 6px 0'}}>{a.respuesta_texto?.substring(0,100)}{a.respuesta_texto?.length>100?'...':''}</p><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:'11px',color:a.pago_usuario==='pagado'?'#2E7D32':'#E65100',fontWeight:700}}>{a.nivel_servicio==='Nivel 0'?'GRATUITO':a.pago_usuario==='pagado'?'PAGADO':('PAGO PENDIENTE — '+(a.metodo_pago||''))}</span>{a.pago_usuario!=='pagado' && a.estado==='solicitada' && <button onClick={async()=>{await updateDoc(doc(db,'Estudios',ESTUDIO_ID,'Casos',a.caseId||caseId,'Actuaciones',a.id),{pago_usuario:'pagado'});setActuaciones(prev=>prev.map(x=>x.id===a.id?{...x,pago_usuario:'pagado'}:x));}} style={{fontSize:'10px',fontWeight:900,backgroundColor:'#2E7D32',color:'#fff',border:'none',padding:'4px 10px',borderRadius:'4px',cursor:'pointer'}}>MARCAR PAGADO</button>}</div></div>)}</div>}{false && !isDirectorView && actuaciones.length > 0 && <div style={{...styles.cardInfo,border:'2px solid #1D1D1F',marginTop:'15px'}}><label style={{...styles.label,color:'#B21F24'}}>HISTORIAL DE ACTUACIONES</label>{actuaciones.map(a => <div key={a.id} style={{borderTop:'1px solid #E5E5E7',paddingTop:'10px',marginTop:'10px'}}><p style={{fontSize:'11px',fontWeight:900,color:'#6E6E73',margin:'0 0 4px 0'}}>{a.nivel_servicio}{' — '}{a.nombre_servicio||''}</p><p style={{fontSize:'13px',margin:'0 0 6px 0'}}>{a.respuesta_texto||'Sin respuesta aun'}</p><div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:'11px',fontWeight:700,color:a.pago_arquitecto==='pagado'?'#2E7D32':'#E65100'}}>{a.pago_arquitecto==='pagado'?'HONORARIO PAGADO':'HONORARIO PENDIENTE'}</span><span style={{fontSize:'11px',color:'#6E6E73'}}>{a.honorario_arquitecto?'$'+a.honorario_arquitecto:''}</span></div></div>)}</div>} 
          {!isDirectorView && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {enviado || caso.estado === 'RESPONDIDA' ? (
                <div style={{ padding: '15px', backgroundColor: '#E8F5E9', border: '2px solid #2E7D32', borderRadius: '8px', textAlign: 'center' }}>
                  <p style={{ color: '#2E7D32', fontWeight: 900, margin: 0 }}>Diagnostico validado y enviado al usuario</p>
                </div>
              ) : (
                <>
                  <div style={{ padding: '15px', border: '2px solid #1D1D1F', borderRadius: '8px', marginBottom: '10px' }}>
                    {verTabla && <div style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',backgroundColor:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setVerTabla(false)}><div style={{backgroundColor:'#fff',borderRadius:'12px',padding:'24px',maxWidth:'90%',width:'600px',maxHeight:'80vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}><label style={{fontSize:'11px',fontWeight:900,letterSpacing:'0.1em',color:'#B21F24'}}>TABLA DE PRECIOS DE REFERENCIA</label><button onClick={()=>setVerTabla(false)} style={{backgroundColor:'transparent',border:'none',fontSize:'18px',cursor:'pointer',color:'#6E6E73'}}>✕</button></div>{SERVICIOS_DEFAULT.map(s=><div key={s.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #E5E5E7',padding:'8px 0'}}><div><span style={{fontSize:'11px',fontWeight:900,color:'#B21F24',marginRight:'8px'}}>{s.nivel}</span><span style={{fontSize:'13px',fontWeight:700}}>{s.nombre}</span></div><span style={{fontSize:'13px',fontWeight:900,color:'#1D1D1F'}}>{s.gratuito?'GRATIS':s.porcentaje?'% obra':('$'+s.precio_uyu+' UYU / U$S '+Math.round(s.precio_uyu/42))}</span></div>)}</div></div>}
                    <button onClick={() => setVerTabla(true)} style={{backgroundColor:'transparent',color:'#B21F24',border:'2px solid #B21F24',padding:'8px 16px',fontSize:'11px',fontWeight:900,cursor:'pointer',borderRadius:'6px',marginBottom:'12px',width:'100%'}}>VER TABLA DE PRECIOS</button>
                    <p style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.1em', color: '#6E6E73', margin: '0 0 8px 0' }}>PRECIO PROPUESTO PARA ESTE CASO (UYU)</p>
                    <input type='number' placeholder='Monto en UYU' value={precioPropuesto} onChange={e => setPrecioPropuesto(e.target.value)} style={{ width: '100%', padding: '10px', border: '2px solid #1D1D1F', borderRadius: '6px', fontSize: '14px', fontWeight: 700, boxSizing: 'border-box' }} />
                    {caso?.precio_validado ? (
                      <p style={{ color: '#2E7D32', fontWeight: 700, fontSize: '13px', marginTop: '8px' }}>Precio validado por el Director</p>
                    ) : (
                      <p style={{ fontSize: '11px', color: '#6E6E73', margin: '8px 0 0 0' }}>El Director validara este precio antes de informarlo al usuario.</p>
                    )}
                  </div>
                  {false && caso?.estado !== 'RESPONDIDA' && caso?.estado !== 'FINALIZADA SIN PAGO' && (<div style={{padding:'16px',border:'2px solid #1D1D1F',borderRadius:'8px',marginBottom:'10px'}}><label style={{fontSize:'11px',fontWeight:900,letterSpacing:'0.1em',color:'#1D1D1F',display:'block',marginBottom:'8px'}}>CONTACTO INICIAL CON EL USUARIO</label><p style={{fontSize:'11px',color:'#6E6E73',margin:'0 0 10px 0'}}>Enviá un mensaje al usuario confirmando que ya estas trabajando en su caso.</p>{contactoEnviado || caso?.contacto_inicial_enviado ? (<div style={{padding:'10px',backgroundColor:'#E8F5E9',borderRadius:'6px',border:'1px solid #2E7D32'}}><p style={{color:'#2E7D32',fontWeight:700,fontSize:'13px',margin:0}}>✅ Mensaje de contacto enviado al usuario</p></div>) : (<><textarea value={mensajeContacto || ('Hola ' + (caso?.usuario_nombre||'') + ', soy ' + (caso?.arquitecto_nombre||'el arquitecto asignado') + ' y ya estoy analizando tu consulta sobre ' + (caso?.direccion_inmueble||'tu inmueble') + '. En breve me pondre en contacto para confirmar los plazos de entrega. Ante cualquier duda podes responder este mensaje.')} onChange={e => setMensajeContacto(e.target.value)} style={{width:'100%',padding:'10px',border:'1px solid #E5E5E7',borderRadius:'6px',fontSize:'12px',minHeight:'100px',boxSizing:'border-box',marginBottom:'10px',fontFamily:'inherit',resize:'none'}} /><button onClick={handleContactoInicial} disabled={enviandoContacto} style={{width:'100%',padding:'12px',backgroundColor:'#1D1D1F',color:'#FFFFFF',border:'2px solid #1D1D1F',borderRadius:'6px',fontSize:'12px',fontWeight:700,cursor:'pointer',opacity:enviandoContacto?0.7:1}}>{enviandoContacto ? 'Enviando...' : 'Enviar mensaje al usuario'}</button></>)}</div>)}<button onClick={handleGuardarNota} disabled={guardando} style={{ backgroundColor: 'transparent', color: '#1D1D1F', border: '2px solid #1D1D1F', padding: '14px 28px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', borderRadius: '6px', opacity: guardando ? 0.7 : 1 }}>
                    {guardando ? 'Guardando...' : 'Guardar borrador'}
                  </button>
                  <button onClick={handleValidarYNotificar} disabled={guardando || !diagnostico.trim()} style={{ backgroundColor: '#B21F24', color: '#FFFFFF', border: 'none', padding: '16px 32px', fontSize: '13px', fontWeight: 900, cursor: 'pointer', borderRadius: '6px', opacity: (guardando || !diagnostico.trim()) ? 0.7 : 1 }}>
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
  const [filtro, setFiltro] = useState('TODOS');
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
  const casosFiltrados = filtro === 'TODOS' ? casos : casos.filter(c => c.estado === filtro);
  return (

    <div style={styles.container}>
      <div style={styles.engineeringHeader}><button onClick={onBack} style={styles.btnBack}>← Volver</button><span>Historial Global</span></div>
    <h2 style={styles.h2}>TODAS LAS CONSULTAS</h2>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {['TODOS', 'NUEVO', 'EN ANALISIS', 'RESPONDIDA'].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 900, cursor: 'pointer', borderRadius: '4px', border: '2px solid ' + (f === 'NUEVO' ? '#1565C0' : f === 'EN ANALISIS' ? '#F57F17' : f === 'RESPONDIDA' ? '#2E7D32' : '#1D1D1F'), backgroundColor: filtro === f ? (f === 'NUEVO' ? '#1565C0' : f === 'EN ANALISIS' ? '#F57F17' : f === 'RESPONDIDA' ? '#2E7D32' : '#1D1D1F') : 'transparent', color: filtro === f ? '#FFFFFF' : (f === 'NUEVO' ? '#1565C0' : f === 'EN ANALISIS' ? '#F57F17' : f === 'RESPONDIDA' ? '#2E7D32' : '#1D1D1F') }}>{f}</button>
        ))}
      </div>
      {loading ? <p style={{ color: THEME.gray }}>Cargando...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {casosFiltrados.length === 0 ? (
            <p style={{ color: THEME.gray }}>No hay consultas con ese estado.</p>
          ) : casosFiltrados.map(c => (
            <div key={c.id} style={{ ...styles.itemCase, border: THEME.border, backgroundColor: c.estado === 'RESPONDIDA' ? '#E8F5E9' : c.estado === 'EN ANÁLISIS' || c.estado === 'EN ANALISIS' ? '#FFFDE7' : c.estado === 'NUEVO' ? '#E3F2FD' : c.estado === 'FINALIZADA SIN PAGO' ? '#FFEBEE' : '#F5F5F7' }} onClick={() => onCase(c.id)}>
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

const SERVICIOS_DEFAULT = [{id:'n0',nivel:'Nivel 0',nombre:'Consulta Inicial',precio_uyu:0,gratuito:true},{id:'n1',nivel:'Nivel 1',nombre:'Informe Tecnico',precio_uyu:3800},{id:'n1p',nivel:'Nivel 1+',nombre:'Informe Ampliado',precio_uyu:5600},{id:'n2',nivel:'Nivel 2',nombre:'Videollamada Tecnica',precio_uyu:3500},{id:'n3',nivel:'Nivel 3',nombre:'Visita Presencial con Informe',precio_uyu:6800},{id:'n4a',nivel:'Nivel 4a',nombre:'Pautas Terapeuticas',precio_uyu:4500},{id:'n4b',nivel:'Nivel 4b',nombre:'Memoria Descriptiva',precio_uyu:12600},{id:'n5',nivel:'Nivel 5',nombre:'Costos de Obra',precio_uyu:15000},{id:'n6',nivel:'Nivel 6',nombre:'Supervision de Obra',precio_uyu:0,porcentaje:true},{id:'n7',nivel:'Nivel 7',nombre:'Otras Actuaciones',precio_uyu:3500}];
function PanelEConfiguracion({ onBack, onTeam }: any) {
  const SERVICIOS_DEFAULT = [
    { id: 'n0', nivel: 'Nivel 0', nombre: 'Consulta Inicial', descripcion: 'Diagnostico preliminar orientativo', precio_uyu: 0, precio_usd: 0, gratuito: true, activo: true },
    { id: 'n1', nivel: 'Nivel 1', nombre: 'Informe Tecnico', descripcion: 'Documento tecnico con causas y recomendaciones', precio_uyu: 3800, precio_usd: 0, gratuito: false, activo: true },
    { id: 'n1p', nivel: 'Nivel 1+', nombre: 'Informe Ampliado', descripcion: 'Informe tecnico detallado con analisis profundo', precio_uyu: 5600, precio_usd: 0, gratuito: false, activo: true },
    { id: 'n2', nivel: 'Nivel 2', nombre: 'Videollamada Tecnica', descripcion: 'Visita teledirigida en tiempo real', precio_uyu: 3500, precio_usd: 0, gratuito: false, activo: true },
    { id: 'n3', nivel: 'Nivel 3', nombre: 'Visita Presencial con Informe', descripcion: 'Relevamiento in situ y diagnostico confirmado', precio_uyu: 6800, precio_usd: 0, gratuito: false, activo: true },
    { id: 'n4a', nivel: 'Nivel 4a', nombre: 'Pautas Terapeuticas', descripcion: 'Guia tecnica para reparaciones', precio_uyu: 4500, precio_usd: 0, gratuito: false, activo: true },
    { id: 'n4b', nivel: 'Nivel 4b', nombre: 'Memoria Descriptiva', descripcion: 'Documentacion tecnica para obras de mayor entidad', precio_uyu: 12600, precio_usd: 0, gratuito: false, activo: true },
    { id: 'n5', nivel: 'Nivel 5', nombre: 'Costos de Obra', descripcion: 'Solicitud y gestion de presupuestos', precio_uyu: 15000, precio_usd: 0, gratuito: false, activo: true },
    { id: 'n6', nivel: 'Nivel 6', nombre: 'Supervision de Obra', descripcion: 'Acompanamiento profesional durante la ejecucion', precio_uyu: 0, precio_usd: 0, porcentaje: 10, gratuito: false, activo: true },
   { id: 'n7', nivel: 'Nivel 7', nombre: 'Otras Actuaciones', descripcion: 'Gestion tecnica personalizada segun el caso', precio_uyu: 3500, precio_usd: 0, gratuito: false, activo: true },
  ];

  const [servicios, setServicios] = useState(SERVICIOS_DEFAULT);
  const [tipoCambio, setTipoCambio] = useState(42);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);

  useEffect(() => {
    const cargarPrecios = async () => {
      const configDoc = await getDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Configuracion', 'precios'));
      if (configDoc.exists()) {
        const data = configDoc.data();
        if (data.servicios) setServicios(data.servicios);
        if (data.tipo_cambio) setTipoCambio(data.tipo_cambio);
      }
    };
    cargarPrecios();
  }, []);

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await setDoc(doc(db, 'Estudios', ESTUDIO_ID, 'Configuracion', 'precios'), {
        servicios,
        tipo_cambio: tipoCambio,
        fecha_actualizacion: serverTimestamp()
      });
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    } catch (e) {
      console.error('Error guardando precios:', e);
    }
    setGuardando(false);
  };

  const updatePrecio = (id: string, campo: string, valor: any) => {
    setServicios(prev => prev.map(s => s.id === id ? { ...s, [campo]: valor } : s));
  };

  return (
    <div style={styles.container}>
      <div style={styles.engineeringHeader}>
        <button onClick={onBack} style={styles.btnBack}>Volver</button>
        <span>Configuracion del Estudio</span>
        <button onClick={onTeam} style={{ ...styles.btnPrimary, width: 'auto', padding: '8px 16px', fontSize: '11px' }}>Gestion de Equipo</button>
      </div>
      <h2 style={styles.h2}>CONFIGURACION DE PRECIOS Y SERVICIOS</h2>
      <p style={styles.subtitleBold}>Tabla de aranceles profesionales. Los precios en USD se calculan automaticamente segun el tipo de cambio.</p>

      <div style={{ ...styles.cardInfo, border: '2px solid #1D1D1F', marginBottom: '20px' }}>
        <label style={styles.label}>TIPO DE CAMBIO USD / UYU</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '14px', color: '#6E6E73' }}>1 USD =</span>
          <input
            type="number"
            value={tipoCambio}
            onChange={e => setTipoCambio(Number(e.target.value))}
            style={{ ...styles.inputFieldBold, width: '100px' }}
          />
          <span style={{ fontSize: '14px', color: '#6E6E73' }}>UYU</span>
        </div>
      </div>

      <div style={{ ...styles.cardInfo, border: '2px solid #1D1D1F' }}>
        <label style={styles.label}>TABLA DE ARANCELES PROFESIONALES</label>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px', marginLeft: '0'}}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E5E5E7' }}>
              {['Nivel', 'Servicio', 'Descripcion', 'UYU', 'USD'].map(h => (
                <th key={h} style={{ padding: '4px 2px', textAlign: 'left', fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: '#6E6E73', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {servicios.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #E5E5E7' }}>
                <td style={{ padding: '4px 2px', fontSize: '13px', fontWeight: 900, color: '#B21F24' }}>{s.nivel}</td>
                <td style={{ padding: '4px 2px', fontSize: '13px', fontWeight: 700 }}>{s.nombre}</td>
                <td style={{ padding: '4px 2px', fontSize: '10px', color: '#6E6E73', maxWidth: '200px' }}>{s.descripcion}</td>
                <td style={{ padding: '4px 2px' }}>
                  {s.gratuito ? (
                    <span style={{ fontSize: '12px', fontWeight: 900, color: '#2E7D32' }}>GRATIS</span>
                  ) : s.a_determinar ? (
                    <span style={{ fontSize: '12px', color: '#6E6E73' }}>A determinar</span>
                  ) : s.porcentaje ? (
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>{s.porcentaje}% obra</span>
                  ) : editando === s.id ? (
                    <input
                      type="number"
                      value={s.precio_uyu}
                      onChange={e => updatePrecio(s.id, 'precio_uyu', Number(e.target.value))}
                      onBlur={() => setEditando(null)}
                      autoFocus
                      style={{ width: '90px', padding: '6px', border: '2px solid #B21F24', borderRadius: '4px', fontSize: '13px', fontWeight: 700 }}
                    />
                  ) : (
                    <span
                      onClick={() => setEditando(s.id)}
                      style={{ fontSize: '13px', fontWeight: 900, color: '#1D1D1F', cursor: 'pointer', borderBottom: '1px dashed #6E6E73' }}
                    >
                      $ {s.precio_uyu.toLocaleString()}
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px', fontSize: '13px', fontWeight: 700, color: '#6E6E73' }}>
                  {s.gratuito ? '-' : s.a_determinar ? '-' : s.porcentaje ? '-' : 'U$S ' + (s.precio_uyu / tipoCambio).toFixed(0)}
                </td>
              
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
        {guardado && (
          <div style={{ padding: '15px 20px', backgroundColor: '#E8F5E9', border: '2px solid #2E7D32', borderRadius: '8px', flex: 1 }}>
            <p style={{ color: '#2E7D32', fontWeight: 900, margin: 0 }}>Precios guardados correctamente</p>
          </div>
        )}
        <button onClick={handleGuardar} disabled={guardando} style={{ ...styles.btnPrimary, opacity: guardando ? 0.7 : 1 }}>
          {guardando ? 'Guardando...' : 'GUARDAR CONFIGURACION'}
        </button>
      </div>
    </div>
  );
}

// --- PANEL ARQUITECTO MIS CASOS ---
function PanelAMisCasos({ currentUser, onBack, onCase }: any) {
  const [casos, setCasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'activos' | 'respondidos'>('todos');
  useEffect(() => {
    if (!currentUser) return;
    const fetch = async () => {
      const casosRef = collection(db, 'Estudios', ESTUDIO_ID, 'Casos');
      const q = query(casosRef, where('arquitecto_asignado', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCasos(data);
      setLoading(false);
    };
    fetch();
  }, [currentUser]);
  const casosFiltrados = casos.filter(c => {
    if (filtro === 'activos') return !['RESPONDIDA', 'CERRADA'].includes(c.estado);
    if (filtro === 'respondidos') return c.estado === 'RESPONDIDA';
    return true;
  });
  return (
    <div style={styles.container}>
      <div style={styles.engineeringHeader}>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: THEME.gray }}>MIS CASOS</span>
        <button onClick={onBack} style={styles.btnBack}>← Volver</button>
      </div>
      <h2 style={styles.h2}>Bitácora de Casos</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        {(['todos', 'activos', 'respondidos'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{ ...styles.btnSecondaryOutline, width: 'auto', padding: '8px 16px', fontSize: '11px', backgroundColor: filtro === f ? THEME.primary : 'transparent', color: filtro === f ? '#fff' : THEME.text, borderColor: filtro === f ? THEME.primary : THEME.text }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {loading ? <p style={{ color: THEME.gray }}>Cargando...</p> : casosFiltrados.length === 0 ? (
        <div style={{ ...styles.cardInfo, border: THEME.border, textAlign: 'center' }}>
          <p style={{ color: THEME.gray }}>No hay casos en esta categoría.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {casosFiltrados.map(c => (
            <div key={c.id} style={{ ...styles.cardInfo, border: THEME.border, cursor: 'pointer' }} onClick={() => onCase(c.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ fontSize: '14px' }}>{c.usuario_nombre || 'Usuario'}</strong>
                  <p style={{ fontSize: '12px', color: THEME.gray, margin: '4px 0' }}>{c.direccion_inmueble}</p>
                  <p style={{ fontSize: '11px', color: THEME.gray }}>{c.descripcion?.substring(0, 80)}...</p>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 900, color: THEME.primary, whiteSpace: 'nowrap', marginLeft: '10px' }}>{c.estado}</span>
              </div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${THEME.softGray}` }}>
                <p style={{ fontSize: '11px', color: THEME.gray }}>Nivel: <strong>{c.nivel_servicio || 'Sin asignar'}</strong></p>
                <p style={{ fontSize: '11px', color: THEME.gray }}>Asignado: <strong>{c.fecha_creacion?.toDate?.()?.toLocaleDateString('es-UY') || '—'}</strong></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- PANEL ARQUITECTO MI CUENTA ---
function PanelAMiCuenta({ currentUser, onBack }: any) {
  const [casos, setCasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroPago, setFiltroPago] = useState<'todos' | 'pendiente' | 'pagado'>('todos');
  useEffect(() => {
    if (!currentUser) return;
    const fetch = async () => {
      const casosRef = collection(db, 'Estudios', ESTUDIO_ID, 'Casos');
      const q = query(casosRef, where('arquitecto_asignado', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      const ORDEN_ARQ: Record<string, number> = { 'NUEVO': 0, 'PAGO PENDIENTE': 1, 'EN ANALISIS': 2, 'RESPONDIDA': 3 };
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (ORDEN_ARQ[a.estado] ?? 2) - (ORDEN_ARQ[b.estado] ?? 2) || (b.fecha_creacion?.toMillis?.() ?? 0) - (a.fecha_creacion?.toMillis?.() ?? 0));
      setCasos(data);
      setLoading(false);
    };
    fetch();
  }, [currentUser]);
  const pendientes = casos.filter(c => c.pago_estado === 'pendiente' && c.honorario_arquitecto);
  const pagados = casos.filter(c => c.pago_estado === 'pagado' && c.honorario_arquitecto);
  const totalPendiente = pendientes.reduce((acc, c) => acc + (c.honorario_arquitecto || 0), 0);
  const totalCobrado = pagados.reduce((acc, c) => acc + (c.honorario_arquitecto || 0), 0);
  return (
    <div style={styles.container}>
      <div style={styles.engineeringHeader}>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: THEME.gray }}>MI CUENTA</span>
        <button onClick={onBack} style={styles.btnBack}>← Volver</button>
      </div>
      <h2 style={styles.h2}>Estado de Pagos</h2>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
        <div onClick={() => setFiltroPago('pendiente')} style={{ ...styles.cardInfo, border: filtroPago === 'pendiente' ? `2px solid ${THEME.primary}` : THEME.border, cursor: 'pointer' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: THEME.gray, marginBottom: '8px' }}>PENDIENTE DE COBRO</p>
          <p style={{ fontSize: '24px', fontWeight: 900, color: THEME.primary }}>${totalPendiente.toLocaleString('es-UY')}</p>
        </div>
        <div onClick={() => setFiltroPago('pagado')} style={{ ...styles.cardInfo, border: filtroPago === 'pagado' ? `2px solid #2E7D32` : THEME.border, cursor: 'pointer' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: THEME.gray, marginBottom: '8px' }}>TOTAL COBRADO</p>
          <p style={{ fontSize: '24px', fontWeight: 900, color: '#2E7D32' }}>${totalCobrado.toLocaleString('es-UY')}</p>
        </div>
      </div>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <label style={styles.label}>DETALLE POR CASO</label>
        {loading ? <p style={{ color: THEME.gray }}>Cargando...</p> : casos.length === 0 ? (
          <p style={{ color: THEME.gray, fontSize: '13px' }}>No hay casos asignados.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
            {casos.filter(c => filtroPago === 'todos' || c.pago_estado === filtroPago || (!c.pago_estado && filtroPago === 'pendiente')).map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: `1px solid ${THEME.softGray}`, borderRadius: '8px' }}>
                <div>
                  <strong style={{ fontSize: '13px' }}>{c.usuario_nombre || 'Usuario'}</strong>
                  <p style={{ fontSize: '11px', color: THEME.gray, margin: '2px 0' }}>{c.direccion_inmueble}</p>
                  <p style={{ fontSize: '11px', color: THEME.gray }}>Nivel: {c.nivel_servicio || 'Sin asignar'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '14px', fontWeight: 900, color: c.pago_estado === 'pagado' ? '#2E7D32' : THEME.primary }}>
                    {c.honorario_arquitecto ? `$${c.honorario_arquitecto.toLocaleString('es-UY')}` : 'Sin asignar'}
                  </p>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: c.pago_estado === 'pagado' ? '#E8F5E9' : '#FFF3E0', color: c.pago_estado === 'pagado' ? '#2E7D32' : '#E65100' }}>
                    {c.pago_estado === 'pagado' ? 'PAGADO' : 'PAGO PENDIENTE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- PANEL ARQUITECTO MI PERFIL ---
function PanelAMiPerfil({ currentUser, userProfile, onBack }: any) {
  const [nombre, setNombre] = useState(userProfile?.nombre || '');
  const [telefono, setTelefono] = useState(userProfile?.telefono || '');
  const [direccion, setDireccion] = useState(userProfile?.direccion || '');
  const [especialidad, setEspecialidad] = useState(userProfile?.especialidad || '');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await updateDoc(doc(db, 'Usuarios', currentUser.uid), { nombre, telefono, direccion, especialidad });
      setMensaje('✅ Perfil actualizado correctamente.');
    } catch (e) {
      setMensaje('❌ Error al guardar.');
    }
    setGuardando(false);
  };
  return (
    <div style={styles.container}>
      <div style={styles.engineeringHeader}>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: THEME.gray }}>MI PERFIL</span>
        <button onClick={onBack} style={styles.btnBack}>← Volver</button>
      </div>
      <h2 style={styles.h2}>Mi Perfil</h2>
      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <label style={styles.label}>DATOS PERSONALES</label>
        <p style={{ fontSize: '12px', color: THEME.gray, marginBottom: '20px' }}>Email: {currentUser?.email}</p>
        <input placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} style={{ ...styles.inputFieldBold, marginBottom: '12px' }} />
        <input placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} style={{ ...styles.inputFieldBold, marginBottom: '12px' }} />
        <input placeholder="Dirección" value={direccion} onChange={e => setDireccion(e.target.value)} style={{ ...styles.inputFieldBold, marginBottom: '12px' }} />
        <input placeholder="Especialidad" value={especialidad} onChange={e => setEspecialidad(e.target.value)} style={{ ...styles.inputFieldBold, marginBottom: '20px' }} />
        {mensaje && <p style={{ fontSize: '13px', color: mensaje.startsWith('✅') ? '#2E7D32' : THEME.primary, marginBottom: '15px' }}>{mensaje}</p>}
        <button onClick={handleGuardar} disabled={guardando} style={{ ...styles.btnPrimary, opacity: guardando ? 0.7 : 1 }}>
          {guardando ? 'Guardando...' : 'GUARDAR CAMBIOS'}
        </button>
      </div>
    </div>
  );
}
// --- PANEL BIBLIOTECA ---
function PanelBiblioteca({ estudioId, onBack, isDirector }: any) {
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchDocumentos(); }, []);

  const fetchDocumentos = async () => {
    setLoading(true);
    try {
      const { getStorage, ref, listAll, getDownloadURL, getMetadata } = await import('firebase/storage');
      const storage = getStorage();
      const carpetaRef = ref(storage, `biblioteca/${estudioId}`);
      const resultado = await listAll(carpetaRef);
      const docs = await Promise.all(resultado.items.map(async (item) => {
        const url = await getDownloadURL(item);
        const meta = await getMetadata(item);
        return { nombre: item.name, url, fecha: meta.timeCreated, size: meta.size };
      }));
      docs.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setDocumentos(docs);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSubir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    setMensaje('');
    try {
      const { getStorage, ref, uploadBytes } = await import('firebase/storage');
      const storage = getStorage();
      const archivoRef = ref(storage, `biblioteca/${estudioId}/${file.name}`);
      await uploadBytes(archivoRef, file);
      setMensaje('✅ Documento subido correctamente.');
      fetchDocumentos();
    } catch (e) {
      console.error(e);
      setMensaje('❌ Error al subir el documento.');
    }
    setSubiendo(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEliminar = async (nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    try {
      const { getStorage, ref, deleteObject } = await import('firebase/storage');
      const storage = getStorage();
      const archivoRef = ref(storage, `biblioteca/${estudioId}/${nombre}`);
      await deleteObject(archivoRef);
      setMensaje('✅ Documento eliminado.');
      fetchDocumentos();
    } catch (e) {
      console.error(e);
      setMensaje('❌ Error al eliminar.');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatFecha = (iso: string) => new Date(iso).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div style={styles.container}>
      <div style={styles.engineeringHeader}>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: THEME.gray }}>BIBLIOTECA DE DOCUMENTOS</span>
        <button onClick={onBack} style={styles.btnBack}>← Volver</button>
      </div>
      <h2 style={styles.h2}>Documentos del Estudio</h2>
      <p style={{ fontSize: '13px', color: THEME.gray, marginBottom: '30px' }}>Modelos, plantillas y documentos institucionales disponibles para el equipo.</p>

      {isDirector && (
        <div style={{ ...styles.cardInfo, border: THEME.border, marginBottom: '30px' }}>
          <label style={styles.label}>SUBIR DOCUMENTO</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleSubir} style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={subiendo} style={{ ...styles.btnPrimary, width: 'auto', padding: '10px 24px' }}>
              {subiendo ? 'Subiendo...' : '+ Subir documento'}
            </button>
            <span style={{ fontSize: '12px', color: THEME.gray }}>PDF, Word o Excel</span>
          </div>
          {mensaje && <p style={{ marginTop: '12px', fontSize: '13px', color: mensaje.startsWith('✅') ? '#2E7D32' : THEME.primary }}>{mensaje}</p>}
        </div>
      )}

      <div style={{ ...styles.cardInfo, border: THEME.border }}>
        <label style={styles.label}>DOCUMENTOS DISPONIBLES</label>
        {loading ? <p style={{ color: THEME.gray, fontSize: '13px' }}>Cargando...</p> :
          documentos.length === 0 ? <p style={{ color: THEME.gray, fontSize: '13px' }}>No hay documentos cargados aún.</p> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
            {documentos.map((doc) => (
              <div key={doc.nombre} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px', border: `1px solid ${THEME.softGray}`, borderRadius: '8px' }}>
                <div>
                  <strong style={{ fontSize: '14px' }}>{doc.nombre}</strong>
                  <p style={{ fontSize: '11px', color: THEME.gray, margin: '4px 0 0 0' }}>{formatFecha(doc.fecha)} · {formatSize(doc.size)}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ ...styles.btnPrimary, width: '100px', padding: '8px 12px', fontSize: '11px', textDecoration: 'none', textAlign: 'center', display: 'inline-block' }}>Descargar</a>
                  {isDirector && <button onClick={() => handleEliminar(doc.nombre)} style={{ ...styles.btnSecondaryOutline, width: '100px', padding: '8px 12px', fontSize: '11px', color: '#B21F24', borderColor: '#B21F24' }}>Eliminar</button>}
                </div>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}
function PanelFGestionEquipo({ estudioId, onBack, onAssignAction }: any) {
  const [arquitectos, setArquitectos] = useState<any[]>([]);
  const [casos, setCasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInvitacion, setEmailInvitacion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [pais, setPais] = useState('Uruguay');
  const [especialidad, setEspecialidad] = useState('');
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
const handleEliminarArquitecto = async (uid: string) => {
    if (!confirm('¿Seguro que querés eliminar este arquitecto del estudio?')) return;
    try {
      const { deleteDoc, doc: firestoreDoc } = await import('firebase/firestore');
      await deleteDoc(firestoreDoc(db, 'Usuarios', uid));
      setMensaje('✅ Arquitecto eliminado correctamente.');
      fetchData();
    } catch (e) {
      console.error(e);
      setMensaje('❌ Error al eliminar el arquitecto.');
    }
  };
  const handleInvitar = async () => {
    if (!emailInvitacion || !nombreInvitacion) {
      setMensaje('Por favor completá nombre y email.');
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
        telefono: telefono,
        direccion: direccion,
        pais: pais,
        especialidad: especialidad,
        rol: 'arquitecto',
        estudio_id: estudioId,
        activo: true,
        fecha_registro: serverTimestamp()
      });
      setMensaje(`✅ Arquitecto ${nombreInvitacion} agregado. Contraseña temporal: ${tempPassword}`);
      setEmailInvitacion('');
      setNombreInvitacion('');
      fetchData();
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        setMensaje('❌ Ese email ya está registrado en el sistema.');
      } else {
        setMensaje('❌ Error al agregar el arquitecto. Intentá de nuevo.');
      }
    }
    setEnviando(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.engineeringHeader}>
        <button onClick={onBack} style={styles.btnBack}>← Dashboard</button>
        <span>Equipo Técnico</span>
      </div>
      <h2 style={styles.h2}>EQUIPO TÉCNICO · ADMINISTRACIÓN</h2>
      <p style={styles.subtitleBold}>Control de capital profesional, roles y carga operativa.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>

        {/* Izquierda — Gestión de carga */}
        <div style={{ ...styles.cardInfo, border: THEME.border }}>
          <label style={styles.label}>GESTIÓN DE CARGA PROFESIONAL</label>
          {loading ? (
            <p style={{ color: THEME.gray }}>Cargando equipo...</p>
          ) : arquitectos.length === 0 ? (
            <p style={{ color: THEME.gray, fontSize: '13px' }}>No hay arquitectos registrados aún.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              {arquitectos.map(arq => (
             <div key={arq.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '15px', border: `1px solid ${THEME.softGray}`, borderRadius: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '14px' }}>{arq.nombre}</strong>
                    <p style={{ fontSize: '12px', color: THEME.gray, margin: '3px 0 0 0' }}>
                      {getCasosCount(arq.id)} caso{getCasosCount(arq.id) !== 1 ? 's' : ''} activo{getCasosCount(arq.id) !== 1 ? 's' : ''}
                    </p>
                    <p style={{ fontSize: '11px', color: THEME.gray, margin: '2px 0 0 0' }}>{arq.email}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <button
                    onClick={onAssignAction}
                    style={{ ...styles.btnPrimary, width: '100px', padding: '8px 12px', fontSize: '11px' }}
                  >
                    Asignar
                  </button>
                  <button
                    onClick={() => handleEliminarArquitecto(arq.id)}
                    style={{ ...styles.btnSecondaryOutline, width: '100px', padding: '8px 12px', fontSize: '11px', color: '#B21F24', borderColor: '#B21F24' }}
                  >
                    Eliminar
              </button>
                  </div>
                </div>
          ))}
        </div>
          )}
        </div>

        {/* Derecha — Invitación */}
        <div style={{ ...styles.cardInfo, border: THEME.border }}>
          <label style={styles.label}>AGREGAR ARQUITECTO AL ESTUDIO</label>
          <p style={{ fontSize: '13px', color: THEME.gray, marginBottom: '20px' }}>
            Sumá profesionales al equipo del estudio.
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
          <input
            placeholder="Telefono o celular"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            style={{ ...styles.inputFieldBold, marginBottom: '10px' }}
          />
          <input
            placeholder="Direccion"
            value={direccion}
            onChange={e => setDireccion(e.target.value)}
            style={{ ...styles.inputFieldBold, marginBottom: '10px' }}
          />
          <select
            value={pais}
            onChange={e => setPais(e.target.value)}
            style={{ ...styles.inputFieldBold, marginBottom: '10px' }}
          >
            <option value="Uruguay">Uruguay</option>
            <option value="Argentina">Argentina</option>
            <option value="Brasil">Brasil</option>
            <option value="Chile">Chile</option>
            <option value="Paraguay">Paraguay</option>
            <option value="Otro">Otro</option>
          </select>
          <input
            placeholder="Especialidad (ej: Patologias edilicias)"
            value={especialidad}
            onChange={e => setEspecialidad(e.target.value)}
            style={{ ...styles.inputFieldBold, marginBottom: '15px' }}
          />
          {mensaje && (
            <div style={{ padding: '12px', backgroundColor: mensaje.startsWith('✅') ? '#E8F5E9' : '#FFEBEE', borderRadius: '6px', marginBottom: '15px', fontSize: '13px', color: mensaje.startsWith('✅') ? '#2E7D32' : THEME.primary }}>
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
  header: { position: 'sticky', top: 0, zIndex: 100, backgroundColor: '#F5F5F7', borderBottom: '2px solid #1D1D1F', padding: '0 20px', height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  isotipo: { width: '28px', height: '28px', backgroundColor: '#B21F24', clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' },
  logoText: { fontSize: '14px', fontWeight: 900, letterSpacing: '0.05em', color: '#1D1D1F' },
  btnMenu: { background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#1D1D1F' },
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












