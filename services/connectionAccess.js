const ADODB = require("node-adodb");
require("dotenv").config();

// Ruta al archivo de base de datos Access (.accdb o .mdb)
// const dbPath = '../db/Ferrekit.mdb';

// tener en cuenta que la ruta dbPATH lo toma como base de donde se ejecuta la coneccion
// const dbPath = './db/HANGAR/HANGAR.mdb';
const dbPath = process.env.DB_PATH;
// Cadena de conexión para Access (.accdb)
const connectionString = `Provider=Microsoft.Jet.OLEDB.4.0;User ID=Admin;Data Source=${dbPath};Persist Security Info=False;`;

// const connectionString = `Provider=Microsoft.ACE.OLEDB.6.0;User ID=Administrador;Data Source=${dbPath};Persist Security Info=False;`;

// Si estás utilizando un archivo .mdb en lugar de .accdb, la cadena de conexión sería diferente
// const connectionString = `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${dbPath};Persist Security Info=False;`;
// "Provider=Microsoft.ACE.OLEDB.12.0;User ID=Admin;Data Source=C:\\Temp\\Mdb.mdb;Persist Security Info=False;"
const connection = ADODB.open(connectionString);

// Ejemplo de consulta
// const consultaSQL = 'SELECT * FROM MenuItems';
// connection.query(consultaSQL)
//   .then((resultados) => {
//     console.log(resultados);
//   })
//   .catch((error) => {
//     console.error('Error en la consulta:', error);
//   })
//   .finally(() => {
//     connection.close();
//   });
// const query = "SELECT top 100 h.orderDateTime as Fecha, h.OrderId as NroTransaccion, M.MenuItemText as Producto,M.MenuItemid as ProductID,M.DefaultUnitPrice as Precio, T.Quantity as cantidad, M.DefaultUnitPrice * T.Quantity as Total  FROM orderHeaders as h, orderTransactions as T, MenuItems  as M WHERE h.orderId = T.OrderId and T.MenuItemID = M.MenuItemID  order by h.orderId desc"

//   connection
//   .query(query)
//   .then(data => {
//     console.log(data);
//     // console.log(JSON.stringify(data, null, 2));
//   })
//   .catch(error => {
//     console.log(error);
//   });

module.exports = connection;
