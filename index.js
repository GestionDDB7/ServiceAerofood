const fs = require("fs");
const path = require("path");
const performLogin = require("./services/login");
const performPostSale = require("./services/postSale");
const control = require("./helpers/salesHelper");
const xmljs = require("xml-js");
const queryToHangarDb = require("./services/plaza/hangar");
require("dotenv").config();

let running = true;
global.failTransaction = [];

const obtenerFechaCreacion = (rutaArchivo) => {
  return new Promise((resolve, reject) => {
    fs.stat(rutaArchivo, (err, stats) => {
      if (err) {
        reject(`Error al obtener información del archivo: ${err.message}`);
      } else {
        // La fecha de creación puede variar según el sistema de archivos y el sistema operativo
        resolve(stats.birthtime);
      }
    });
  });
};

const leerFechaGuardada = (rutaArchivo) => {
  return new Promise((resolve, reject) => {
    fs.readFile(rutaArchivo, "utf8", (err, data) => {
      if (err) {
        if (err.code === "ENOENT") {
          // Si el archivo no existe, resolvemos con una cadena vacía
          resolve("");
        } else {
          reject(`Error al leer el archivo JSON: ${err.message}`);
        }
      } else {
        resolve(data.trim()); // Trimming para eliminar posibles espacios en blanco
      }
    });
  });
};

const guardarEnArchivo = (rutaArchivo, nuevaFecha) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(rutaArchivo, nuevaFecha, "utf8", (err) => {
      if (err) {
        reject(`Error al escribir en el archivo TXT: ${err.message}`);
      } else {
        resolve();
      }
    });
  });
};

const backupArchivo = (rutaArchivo, rutaNuevoArchivo) => {
  const nombreNuevoArchivo = path.basename(rutaArchivo);
  rutaNuevoArchivo = path.join(rutaNuevoArchivo, nombreNuevoArchivo);
  fs.copyFile(rutaArchivo, rutaNuevoArchivo, (err) => {
    if (err) {
      console.error("Error al copiar el archivo:", err);
      return;
    }

    console.log("Archivo copiado exitosamente.");
  });
};

const convertirXmlAJson = (xml) => {
  return new Promise((resolve, reject) => {
    try {
      const result = xmljs.xml2js(xml, { compact: true });
      resolve(result);
    } catch (err) {
      reject(`Error al convertir XML a JSON: ${err.message}`);
    }
  });
};

const readFiles = async () => {
  console.log("Código ejecutado cada 1 minuto.");

  const dataHangar = await queryToHangarDb();
  // console.log(dataHangar);
  console.log("PRIMER REGISTRO", dataHangar[0]);
  console.log("ULTIMO REGISTRO", dataHangar[dataHangar.length - 1]);
  //recorrer datahangar con un for each
  const inicio = new Date();
  const { token } = await performLogin();
  for (let item of dataHangar) {
    console.log(item);
    global.idTransaction = item.transaction.id;
    try {
      const saved = await performPostSale({ sale: item }, token);
      console.log(saved);
    } catch (error) {
      console.log("ELLLL OTROOOOOO");
      global.failTransaction.push(global.idTransaction)
      console.log(error);
    }
  }

  console.log("FALLADOS1", global.failTransaction);

  for (let idTransaction of global.failTransaction) {
    console.log(idTransaction);
    global.idTransaction = idTransaction;
    const saleFinded = dataHangar.find(
      (sale) => sale.transaction.id === idTransaction
    );
    try {
      if (saleFinded) {
        const saved = await performPostSale({ sale: saleFinded }, token);
        console.log(saved);
        global.failTransaction = global.failTransaction.filter(
          (id) => id !== idTransaction
        );
      }
    } catch (error) {
      const errorMsg = error.toString();
      await guardarEnArchivo(
        `./sales/fail/log_${idTransaction}_${new Date().getFullYear()}-${
          new Date().getMonth() + 1
        }-${new Date().getDate()}.txt`,
        errorMsg
      );
      console.log(error);
    }
  }

  console.log("FALLADOS2", global.failTransaction);

  console.log("TOTAL DE REGISTROS", dataHangar.length);
  console.log("INICIO", inicio);
  console.log("FIN", new Date());

  // console.log(jsonString);

  // Ruta de la carpeta que contiene los archivos JSON
  const carpeta = "./jsonfiles";

  // Leer la lista de archivos en la carpeta
  fs.readdir(carpeta, async (err, archivos) => {
    if (err) {
      console.error("Error al leer la carpeta:", err);
      return;
    }

    // Filtrar solo los archivos con terminancion en JSON y que tenga RESPONSE en su nombre
    const archivosJSON = archivos.filter(
      (archivo) =>
        path.extname(archivo) === ".json" && archivo.includes("RESPONSE")
    );

    // Recorrer los archivos JSON
    for (const archivoJSON of archivosJSON) {
      const rutaArchivo = path.join(carpeta, archivoJSON);
      console.log("Ruta archivo:", rutaArchivo);

      try {
        const fechaGuardada = await leerFechaGuardada(
          "./sales/read/lastDate.txt"
        );
        const fechaCreacion = await obtenerFechaCreacion(rutaArchivo);

        if (
          fechaGuardada === "" ||
          new Date(fechaCreacion) > new Date(fechaGuardada)
        ) {
          fs.readFile(rutaArchivo, "utf8", async (err, data) => {
            if (err) {
              console.error("Error al leer el archivo JSON:", err);
              return;
            }

            // Parsear el contenido JSON
            const jsonData = JSON.parse(data);
            const xmlToJson = await convertirXmlAJson(jsonData.xmlFeSigned);
            jsonData.xmlFeSigned = xmlToJson;

            //////////ACA HACER CONTROL //////////////////

            let msgError = control.controlSales(jsonData);
            console.log(msgError);

            /////////////////////////////////////////////////

            if (msgError === "-") {
              const transactionType =
                xmlToJson.rFE.gTot.gFormaPago.iFormaPago._text !== "01"
                  ? "SALE"
                  : "CREDIT_NOTE";

              const totalSale =
                transactionType === "CREDIT_NOTE"
                  ? Number(xmlToJson.rFE.gTot.dVTot._text) * -1
                  : Number(xmlToJson.rFE.gTot.dVTot._text);
              const totalNetSale =
                transactionType === "CREDIT_NOTE"
                  ? Number(xmlToJson.rFE.gTot.dTotNeto._text) * -1
                  : Number(xmlToJson.rFE.gTot.dTotNeto._text);

              const listProd = xmlToJson.rFE.gItem.map((prod) => {
                const total =
                  transactionType === "CREDIT_NOTE"
                    ? Number(prod.gPrecios.dValTotItem._text) * -1
                    : Number(prod.gPrecios.dValTotItem._text);
                const prodSale = {
                  productName: prod.dDescProd._text,
                  quantity: prod.dCantCodInt._text,
                  price: {
                    currency: "USD",
                    value: 1,
                  },
                  id: prod.dCodProd._text,
                  total: total,
                  netTotal: total,
                  taxTotal: 0,
                };

                return prodSale;
              });

              const saleToRegister = {
                sale: {
                  generator: {
                    companyId: process.env.COMPANY_ID,
                    plazaId: process.env.PLAZA_ID,
                    deviceId: "1",
                    salesPersonId: "19",
                  },
                  buyer: {
                    flightNumber: "555555",
                    documentId: "123456",
                    documentType: "PASSPORT",
                  },
                  transaction: {
                    discount: {
                      id: "1",
                      name: "descuento",
                      multiplier: 1,
                    },
                    id: jsonData.feNumber.replace(/-/g, ""),
                    dateTime: xmlToJson.rFE.gDGen.dFechaEm._text,
                    currency: "USD",
                    taxTotal: Number(process.env.TRANSACTION_TAXTOTAL),
                    netTotal: totalNetSale,
                    total: totalSale,
                    type: transactionType,
                    paymentOption: "CREDIC_CARD",
                    details: listProd,
                  },
                },
              };
              console.log("SALE:", saleToRegister);

              await guardarEnArchivo(
                "./sales/read/lastDate.txt",
                fechaCreacion.toISOString()
              );
              const saved = await performPostSale(saleToRegister);
              console.log("Se cargo correctamente", saved);
              backupArchivo(rutaArchivo, "./sales/read/backupJsonFiles");
            } else {
              //////// SET HEADER MSG CONTROL
              const header = `LOG DE ERRORES

DATE/HOUR: ${new Date().toLocaleString()}
PLAZA_ID: ${process.env.PLAZA_ID}
NRO_INVOICE: ${jsonData.feNumber.replace(/-/g, "")}
FILE:nombre de archivo`;

              msgError = msgError.replace("-", header);
              console.log("MSG_ERROR", msgError);
              const nameFile = archivoJSON.replace(/-RESPONSE\.json$/, "");
              dateInvoice = new Date(
                jsonData.xmlFeSigned.rFE.gDGen.dFechaEm._text
              );
              const year = dateInvoice.getFullYear();
              const month = dateInvoice.getMonth() + 1;
              const day = dateInvoice.getDate();
              await guardarEnArchivo(
                `./sales/log/log_${nameFile}_${year}-${month}-${day}_${jsonData.feNumber.replace(
                  /-/g,
                  ""
                )}.txt`,
                msgError
              );
            }
          });
        } else {
          console.log(
            "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXno hay archivos nuevosXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
          );
        }
      } catch (error) {
        console.error(error);
      }
    }
  });
};

readFiles();

// Configurar la ejecución cada 1 minuto (60 segundos * 1000 milisegundos)
const intervalId = setInterval(readFiles, 60 * 1000);

// Manejar la señal SIGINT (Ctrl + C)
process.on("SIGINT", () => {
  console.log("\nDeteniendo el script...");
  clearInterval(intervalId); // Detener el intervalo
  running = false; // Marcar que el script debe detenerse
});

// Ciclo infinito para mantener el script en ejecución
const keepRunning = () => {
  if (running) {
    setTimeout(keepRunning, 1000);
  } else {
    console.log("Script detenido.");
    process.exit(); // Salir del script
  }
};

keepRunning();
