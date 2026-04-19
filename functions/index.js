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
            success: "https://sistema-consultoria-asesoramiento.onrender.com/pago-exitoso",
            failure: "https://sistema-consultoria-asesoramiento.onrender.com/pago-fallido",
            pending: "https://sistema-consultoria-asesoramiento.onrender.com/pago-pendiente"
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
);