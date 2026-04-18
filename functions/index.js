const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

exports.helloWorld = onRequest({region: "southamerica-east1"}, (request, response) => {
  logger.info("Hola desde De La Matriz!");
  response.send("Cloud Function funcionando correctamente - De La Matriz");
});