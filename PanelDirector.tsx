// PanelDirector.tsx - Torre de Control (Panel C y D)
import React, { useState } from 'react';

// Datos simulados para representar la arquitectura multi-tenancy [6, 7]
const ARQUITECTOS_EQUIPO = [
  { id: 'arq_01', nombre: 'Arq. Julieta Martínez' },
  { id: 'arq_02', nombre: 'Arq. Lucas Gómez' }
];

export default function PanelDirector() {
  const [consultas, setConsultas] = useState([
    { id: 'CASO-12345', usuario: 'Juan Pérez', tema: 'Humedad Living', fecha: '2023-10-27', estado: 'NUEVA', asignado: '' },
    { id: 'CASO-12346', usuario: 'María García', tema: 'Fisura Fachada', fecha: '2023-10-26', estado: 'EN_ANALISIS', asignado: 'Arq. Julieta Martínez' }
  ]);

  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const asignarArquitecto = (arquitectoNombre: string) => {
    setConsultas(prev => prev.map(c => 
      c.id === seleccionado ? { ...c, estado: 'EN_ANALISIS', asignado: arquitectoNombre } : c
    ));
    setSeleccionado(null); // Cerramos el modal
    console.log("SISTEMA: Disparando alerta de SLA (24-48hs) para el arquitecto."); [4, 8]
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Header de Marca Blanca [6, 9] */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ color: '#B21F24', margin: 0 }}>DE LA MATRIZ</h1>
          <p style={{ margin: 0, color: '#666' }}>Panel Interno · <strong>Director de Estudio</strong></p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span>Estudio ID: MATRIZ-PRO-01</span>
        </div>
      </header>

      {/* Bloque 1: Resumen rápido (KPIs) [10, 11] */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        {['Nuevas', 'En análisis', 'Respondidas', 'Vencen hoy'].map((label, i) => (
          <div key={label} style={{ padding: '20px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#888' }}>{label}</h4>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: i === 3 ? '#B21F24' : '#333' }}>{i === 0 ? '1' : i === 3 ? '0' : '5'}</span>
          </div>
        ))}
      </div>

      {/* Bloque 2: Listado Maestro de Consultas [3, 10] */}
      <section style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Gestión de Consultas Recibidas</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#888', borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '12px' }}>ID Caso</th>
              <th>Usuario</th>
              <th>Problema</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Responsable</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {consultas.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{c.id}</td>
                <td>{c.usuario}</td>
                <td>{c.tema}</td>
                <td>{c.fecha}</td>
                <td><span style={{ backgroundColor: c.estado === 'NUEVA' ? '#FFF3CD' : '#D1E7DD', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{c.estado}</span></td>
                <td>{c.asignado || '---'}</td>
                <td>
                  {c.estado === 'NUEVA' && (
                    <button onClick={() => setSeleccionado(c.id)} style={{ padding: '5px 10px', backgroundColor: '#B21F24', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      ASIGNAR
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Bloque 3: Modal de Asignación (Panel D) [12] */}
      {seleccionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '400px' }}>
            <h3>Asignar Arquitecto</h3>
            <p>Seleccioná al profesional responsable para el caso: <strong>{seleccionado}</strong></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              {ARQUITECTOS_EQUIPO.map(arq => (
                <button key={arq.id} onClick={() => asignarArquitecto(arq.nombre)} style={{ padding: '15px', textAlign: 'left', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: '#fff' }}>
                  {arq.nombre}
                </button>
              ))}
              <button onClick={() => setSeleccionado(null)} style={{ marginTop: '10px', border: 'none', background: 'none', color: '#666', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}