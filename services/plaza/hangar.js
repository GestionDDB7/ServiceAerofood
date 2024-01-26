const connection = require("../connectionAccess.js");
require("dotenv").config();

const queryToHangarDb = () => {
 
  const query3 = `SELECT h.OrderDateTime as dateTimeTransaction, h.OrderId as transactionId, IIf(IsNull(T.DiscountAmount),0,T.DiscountAmount) as discount, h.SalesTaxAmountUsed as taxTotal, h.SubTotal as netTotal, h.AmountDue as totalTransaction, M.MenuItemText as productName,M.MenuItemid as productId,M.DefaultUnitPrice as productPrice, T.Quantity as productQuantity, M.DefaultUnitPrice * T.Quantity as TotalPriceQuantity
  FROM OrderHeaders as h, orderTransactions as T, MenuItems  as M
  WHERE h.orderId = T.OrderId
  AND T.MenuItemID = M.MenuItemID 
  AND h.OrderDateTime BETWEEN #${process.env.FECHA_INICIO} 00:00:00# AND #${process.env.FECHA_FINAL} 23:59:00#`;
  // AND h.orderId = 2112 //23:59:59
  // group by FORMAT(OrderDateTime,'DD/MM/YYYY')`;

  return connection
    .query(query3)
    .then((transacciones) => {
      // console.log(transacciones);
      // console.log(transacciones[transacciones.length - 1]);

      function convertirListado(listado) {
        // Crear un objeto para almacenar transacciones agrupadas por transactionId
        const transaccionesAgrupadas = {};

        // Agrupar transacciones por transactionId
        listado.forEach((transaccion) => {
          const {
            transactionId,
            productName,
            productQuantity,
            productPrice,
            productId,
            TotalPriceQuantity,
          } = transaccion;

          // Verificar si ya existe la transacciónId en el objeto agrupado
          if (!transaccionesAgrupadas[transactionId]) {
            // Si no existe, crear la estructura inicial
            const fecha = new Date(transaccion.dateTimeTransaction)
              .toLocaleString()
              .replace(",", "");
            const dateTransform = new Date(transaccion.dateTimeTransaction);

            const hoursFormat = `${
              new Date(dateTransform).getHours() < 10
                ? `0${new Date(dateTransform).getHours()}`
                : new Date(dateTransform).getHours()
            }:${
              new Date(dateTransform).getMinutes() < 10
                ? `0${new Date(dateTransform).getMinutes()}`
                : new Date(dateTransform).getMinutes()
            }:${
              new Date(dateTransform).getSeconds() < 10
                ? `0${new Date(dateTransform).getSeconds()}`
                : new Date(dateTransform).getSeconds()
            }`;

            const formatFecha = `${new Date(dateTransform).getFullYear()}-${
              new Date(dateTransform).getMonth() + 1 < 10
                ? `0${new Date(dateTransform).getMonth() + 1}`
                : new Date(dateTransform).getMonth() + 1
            }-${
              new Date(dateTransform).getDate() < 10
                ? `0${new Date(dateTransform).getDate()}`
                : new Date(dateTransform).getDate()
            }T${hoursFormat}`;

            transaccionesAgrupadas[transactionId] = {
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
                  multiplier: transaccion.discount,
                },
                id: transactionId.toLocaleString("es-ES", {
                  maximumFractionDigits: 0,
                }),
                dateTime: formatFecha,
                currency: "USD",
                taxTotal: Number(transaccion.taxTotal.toFixed(2)),
                netTotal: Number(transaccion.netTotal.toFixed(2)),
                total: Number(transaccion.totalTransaction.toFixed(2)),
                type: "SALE",
                paymentOption: "CREDIT_CARD",
                details: [],
              },
            };
          }

          // Agregar detalles de productos a la transacción agrupada
          transaccionesAgrupadas[transactionId].transaction.details.push({
            productName,
            quantity: productQuantity,
            price: {
              currency: "USD",
              value: Number(productPrice.toFixed(2)),
            },
            id: productId.toLocaleString("es-ES", { maximumFractionDigits: 0 }),
            total: Number(TotalPriceQuantity.toFixed(2)),
            netTotal: Number(TotalPriceQuantity.toFixed(2)),
            taxTotal: 0,
          });
        });

        // Convertir el objeto de transacciones agrupadas a un array
        const resultado = Object.values(transaccionesAgrupadas);

        return resultado;
      }

      return convertirListado(transacciones);
      //console.log(JSON.stringify(listadoConvertido, null, 2));
      //console.log("TOTAL DE REGISTROS", listadoConvertido.length);
    })
    .catch((error) => {
      console.log(error);
      throw error;
    })
    .finally(() => {
      // Cierra la conexión después de realizar la consulta
      //   console.log("conexion cerrada");
    });
  //   return listSales;
};

module.exports = queryToHangarDb;
