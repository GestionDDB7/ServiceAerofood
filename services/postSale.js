const axios = require("axios");
const performLogin = require("./login");
require("dotenv").config();

// Configuración de la API
const hostname = process.env.API;
const port = process.env.PORT;
// const token = process.env.TOKEN;
const basePath = "api";
const path = "/sales";



// const url = `${hostname}:${port}/${basePath}${path}`;
const url = `${hostname}/${basePath}${path}`;

const performPostSale = async (data, token) => {
  try {
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Carga exitosa:", response.data);
    return response.data;
  } catch (error) {
    
    // global.failTransaction.push(global.idTransaction)

    if (error.response) {
      console.error(
        "Error en el Sale. Código de respuesta:",
        error.response.status
      );
      console.error("Detalles del error:", error.response.data);
    } else if (error.request) {
      // La solicitud fue realizada, pero no se recibió respuesta
      console.error("Error en el Sales. No se recibió respuesta del servidor.");
    } else {
      // Otro tipo de error
      console.error("Error en el sales:", error.message);
    }

    throw error; // Re-lanzar el error para que pueda ser manejado externamente
  }
};

module.exports = performPostSale;
