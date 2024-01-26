const axios = require("axios");
require("dotenv").config();

// Configuración de la API
const hostname = process.env.API;
const port = process.env.PORT;
const basePath = "api";

const loginPath = "/users/login";

const loginUrl = `${hostname}:${port}/${basePath}${loginPath}`;

const credentials = {
  email: process.env.USER_EMAIL,
  password: process.env.USER_PASSWORD,
};

const performLogin = async () => {
  try {
    const response = await axios.post(loginUrl, credentials, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Login exitoso");
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(
        "Error en el login. Código de respuesta:",
        error.response.status
      );
      console.error("Detalles del error:", error.response.data);
    } else if (error.request) {
      // La solicitud fue realizada, pero no se recibió respuesta
      console.error("Error en el login. No se recibió respuesta del servidor.");
    } else {
      // Otro tipo de error
      console.error("Error en el login:", error.message);
    }

    throw error; // Re-lanzar el error para que pueda ser manejado externamente
  }
};

module.exports = performLogin;
