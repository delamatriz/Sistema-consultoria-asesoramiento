import jsPDF from 'jspdf';

export async function generarPDFCaso(caso: any, actuaciones: any[]) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margen = 20;
  const ancho = 210 - margen * 2;
  let y = 20;
  // Encabezado
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DE LA MATRIZ ARQUITECTOS', margen, y);
  y += 8;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Expediente Tecnico Profesional', margen, y);
  y += 6;
  pdf.setFontSize(9);
  pdf.setTextColor(110, 110, 115);
  pdf.text('Fecha de generacion: ' + new Date().toLocaleDateString('es-UY'), margen, y);
  y += 10;
  pdf.setDrawColor(178, 31, 36);
  pdf.setLineWidth(0.5);
  pdf.line(margen, y, margen + ancho, y);
  y += 10;
  // Datos del cliente
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DATOS DEL CLIENTE', margen, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.text('Nombre: ' + (caso.usuario_nombre || '-'), margen, y);
  y += 5;
  pdf.text('Email: ' + (caso.usuario_email || '-'), margen, y);
  y += 10;

  // Datos del caso
  pdf.setFont('helvetica', 'bold');
  pdf.text('DATOS DEL CASO', margen, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.text('Inmueble: ' + (caso.direccion_inmueble || '-'), margen, y);
  y += 5;
  pdf.text('Estado: ' + (caso.estado || '-'), margen, y);
  y += 5;
  pdf.text('Arquitecto asignado: ' + (caso.arquitecto_nombre || '-'), margen, y);
  y += 5;
  const descripcion = pdf.splitTextToSize('Descripcion: ' + (caso.descripcion || '-'), ancho);
  pdf.text(descripcion, margen, y);
  y += descripcion.length * 5 + 5;
  // Diagnostico
  pdf.setFont('helvetica', 'bold');
  pdf.text('DIAGNOSTICO TECNICO', margen, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');
  const diagnostico = pdf.splitTextToSize(caso.diagnostico || 'Sin diagnostico registrado.', ancho);
  pdf.text(diagnostico, margen, y);
  y += diagnostico.length * 5 + 10;

  // Historial de actuaciones
  pdf.setFont('helvetica', 'bold');
  pdf.text('HISTORIAL DE ACTUACIONES', margen, y);
  y += 6;

  for (const act of actuaciones) {
    if (y > 250) { pdf.addPage(); y = 20; }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text((act.nombre_servicio || act.nivel_servicio || '-'), margen, y);
    y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.text('Estado: ' + (act.estado || '-'), margen, y);
    y += 4;
    pdf.text('Precio pagado: ' + (act.precio || '-'), margen, y);
    y += 4;
    pdf.text('Honorario arquitecto: ' + (act.honorario_arquitecto ? '$' + act.honorario_arquitecto : '-') + ' — ' + (act.pago_arquitecto === 'pagado' ? 'PAGADO' : 'PENDIENTE'), margen, y);
    y += 4;
    if (act.notas_entrega) {
      const notas = pdf.splitTextToSize('Notas: ' + act.notas_entrega, ancho);
      pdf.text(notas, margen, y);
      y += notas.length * 4;
    }
    if (act.documento_entregable?.nombre_archivo) {
      pdf.text('Documento: ' + act.documento_entregable.nombre_archivo, margen, y);
      y += 4;
    }
    y += 4;
    pdf.setDrawColor(220, 220, 220);
    pdf.line(margen, y, margen + ancho, y);
    y += 6;
  }
  // Pie de pagina
  pdf.setFontSize(8);
  pdf.setTextColor(110, 110, 115);
  pdf.text('De La Matriz Arquitectos — delamatriz@gmail.com — Tel: +598 2902 9272', margen, 285);

  // Descargar
  pdf.save('Expediente_' + (caso.direccion_inmueble || caso.id || 'caso').replace(/ /g, '_') + '.pdf');
}
