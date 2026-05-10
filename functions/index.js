const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const {MercadoPagoConfig, Preference} = require("mercadopago");

const MERCADOPAGO_ACCESS_TOKEN = defineSecret("MERCADOPAGO_ACCESS_TOKEN");

exports.helloWorld = onRequest({region: "southamerica-east1"}, (request, response) => {
  logger.info("Hola desde De La Matriz!");
  response.send("Cloud Function funcionando correctamente - De La Matriz");
});

exports.crearPreferenciaPago = onRequest(
  {region: "southamerica-east1", secrets: [MERCADOPAGO_ACCESS_TOKEN], cors: true},
  async (request, response) => {
    try {
      const {titulo, precio, caseId, actuacionId} = request.body;
      if (!titulo || !precio) {
        response.status(400).send({error: "Faltan datos: titulo y precio son obligatorios"});
        return;
      }
      const client = new MercadoPagoConfig({accessToken: MERCADOPAGO_ACCESS_TOKEN.value().trim()});
      const preference = new Preference(client);
      const result = await preference.create({
        body: {
          items: [{
            title: titulo,
            quantity: 1,
            unit_price: Number(precio),
            currency_id: "UYU"
          }],
          back_urls: {
            success: "https://sistema-consultoria-asesoramiento.onrender.com/?status=approved",
            failure: "https://sistema-consultoria-asesoramiento.onrender.com/?status=rejected",
            pending: "https://sistema-consultoria-asesoramiento.onrender.com/?status=pending"
          },
          external_reference: (caseId || "") + "|" + (actuacionId || ""),
          statement_descriptor: "DE LA MATRIZ"
        }
      });
      logger.info("Preferencia creada:", result.id);
      response.send({
        preferenceId: result.id,
        initPoint: result.init_point,
        sandboxInitPoint: result.sandbox_init_point
      });
    } catch (error) {
      logger.error("Error creando preferencia:", error);
      response.status(500).send({error: error.message});
    }
  }
);exports.webhookMercadoPago = onRequest(
  {region: "southamerica-east1", secrets: [MERCADOPAGO_ACCESS_TOKEN], cors: true},
  async (request, response) => {
    try {
      const {type, data} = request.body;
      if (type !== "payment") {
        response.send({ok: true, ignored: true});
        return;
      }
      const paymentId = data?.id;
      if (!paymentId) {
        response.status(400).send({error: "No payment id"});
        return;
      }
      const client = new MercadoPagoConfig({accessToken: MERCADOPAGO_ACCESS_TOKEN.value().trim()});
      const paymentRes = await fetch("https://api.mercadopago.com/v1/payments/" + paymentId, {
        headers: {"Authorization": "Bearer " + MERCADOPAGO_ACCESS_TOKEN.value().trim()}
      });
      const payment = await paymentRes.json();
      logger.info("Payment status:", payment.status, "external_reference:", payment.external_reference);
      if (payment.status === "approved" && payment.external_reference) {
        const parts = payment.external_reference.split("|");
        const caseId = parts[0];
        const actuacionId = parts[1];
        if (caseId && actuacionId) {
          const admin = require("firebase-admin");
          if (!admin.apps.length) admin.initializeApp();
          const db = admin.firestore();
          const ESTUDIO_ID = "DWo8vQwXQ1ScnLc015zU";
          await db.doc("Estudios/" + ESTUDIO_ID + "/Casos/" + caseId + "/Actuaciones/" + actuacionId).update({
            pago_usuario: "pagado",
            estado: "pago_confirmado",
            fecha_pago: admin.firestore.FieldValue.serverTimestamp(),
            payment_id: String(paymentId)
          });
          await db.doc("Estudios/" + ESTUDIO_ID + "/Casos/" + caseId).update({
            estado: "PAGADA"
          });
          logger.info("Pago confirmado para caso:", caseId, "actuacion:", actuacionId);
        }
      }
      response.send({ok: true, status: payment.status});
    } catch (error) {
      logger.error("Error webhook:", error);
      response.status(500).send({error: error.message});
    }
  }
);
exports.alertar48hs = functions.pubsub.schedule('every 60 minutes').timeZone('America/Montevideo').onRun(async () => {
  const ahora = Date.now();
  const limite = ahora - 48 * 60 * 60 * 1000;
  const casosSnap = await db.collection('Estudios').doc(ESTUDIO_ID).collection('Casos').get();
  for (const casoDoc of casosSnap.docs) {
    const actuacionesSnap = await casoDoc.ref.collection('Actuaciones').get();
    for (const actDoc of actuacionesSnap.docs) {
      const act = actDoc.data();
      if (act.estado === 'pago_confirmado' && act.fecha && act.fecha.toMillis() < limite && !act.alerta_48hs_enviada) {
        const caso = casoDoc.data();
        await actDoc.ref.update({ alerta_48hs_enviada: true });
        const msg = 'ALERTA 48hs sin atender. Servicio: ' + (act.nombre_servicio||'') + '. Inmueble: ' + (caso.direccion_inmueble||'') + '. Usuario: ' + (caso.usuario_nombre||'') + '. Caso ID: ' + casoDoc.id;
        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service_id: 'delamatriz', template_id: 'template_no31o7y', user_id: 'd1aTzq_ytY2X8Mrdn', template_params: { asunto: 'ALERTA: Actuacion sin atender 48hs', mensaje: msg, destinatario: 'delamatriz@gmail.com' } })
        });
      }
    }
  }
});
