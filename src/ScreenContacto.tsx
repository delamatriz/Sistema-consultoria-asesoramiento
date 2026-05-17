import emailjs from '@emailjs/browser';
import React, { useState } from 'react';

function ScreenContacto({ onBack }: any) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleEnviar = async () => {
    if (!nombre || !email || !mensaje) {
      setError('Por favor completá nombre, email y mensaje.');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      await emailjs.send(
        'delamatriz',
        'template_taznf0c',
        {
          from_name: nombre,
          from_email: email,
          subject: asunto || 'Consulta general',
          message: mensaje,
        },
        'd1aTzq_ytY2X8Mrdn'
      );
      setEnviado(true);
      setNombre('');
      setEmail('');
      setAsunto('');
      setMensaje('');
    } catch (e) {
      setError('Hubo un error al enviar el mensaje. Intentá de nuevo.');
    }
    setEnviando(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #E5E5E7',
    fontSize: '14px',
    fontFamily: '"Inter", sans-serif',
    color: '#1D1D1F',
    backgroundColor: '#FFFFFF',
    boxSizing: 'border-box',
    outline: 'none',
    marginBottom: '12px',
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 20px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#6E6E73', marginBottom: '20px' }}>Volver</button>
      <h2 style={{ fontSize: 'clamp(18px, 4vw, 26px)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '6px' }}>CONTACTO</h2>
      <p style={{ fontSize: '15px', fontWeight: 600, color: '#6E6E73', marginBottom: '30px' }}>Estamos para ayudarte. Escribinos y te respondemos a la brevedad.</p>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '25px', border: '1px solid #E5E5E7', marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.12em', color: '#1D1D1F', margin: '0 0 10px 0', textTransform: 'uppercase', borderLeft: '5px solid #B21F24', paddingLeft: '10px' }}>DATOS DEL ESTUDIO</p>
        <p style={{ fontSize: '14px', lineHeight: '2', color: '#1D1D1F', margin: 0 }}>
          Río Negro 1354 of. 36 esq. 18 de Julio — Montevideo, Uruguay<br />
          Tel: 2902 9272 &nbsp;·&nbsp; WhatsApp: 099 372 600<br />
          delamatriz@gmail.com
        </p>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '25px', border: '1px solid #E5E5E7', marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.12em', color: '#1D1D1F', margin: '0 0 16px 0', textTransform: 'uppercase', borderLeft: '5px solid #B21F24', paddingLeft: '10px' }}>ENVIANOS UN MENSAJE</p>

        {enviado ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#2E7D32', marginBottom: '8px' }}>✅ Mensaje enviado</p>
            <p style={{ fontSize: '14px', color: '#6E6E73' }}>Gracias por contactarnos. Te responderemos a la brevedad.</p>
          </div>
        ) : (
          <>
            <input style={inputStyle} placeholder="Nombre completo *" value={nombre} onChange={e => setNombre(e.target.value)} />
            <input style={inputStyle} placeholder="Email *" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <input style={inputStyle} placeholder="Asunto (opcional)" value={asunto} onChange={e => setAsunto(e.target.value)} />
            <textarea
              style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
              placeholder="Mensaje *"
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
            />
            {error && <p style={{ fontSize: '13px', color: '#B21F24', marginBottom: '12px' }}>{error}</p>}
            <button
              onClick={handleEnviar}
              disabled={enviando}
              style={{ width: '100%', padding: '14px', backgroundColor: '#B21F24', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer', opacity: enviando ? 0.7 : 1 }}
            >
              {enviando ? 'Enviando...' : 'Enviar mensaje'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ScreenContacto;