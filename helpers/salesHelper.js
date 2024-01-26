require("dotenv").config();

const sumTotal = (value) => {
  return value.reduce(
    (total, cur) => total + Number(cur.gPrecios.dValTotItem._text),
    0
  );
};

const controlSales = (dataFile) => {
  //   console.log("DATAFILE:", dataFile.xmlFeSigned.rFE.gItem);
  let menssageError = "-";

  if (!process.env.COMPANY_ID || !process.env.PLAZA_ID)
    menssageError +=
      "\n\nERROR: prop. VARIABLE DE ENTORNO, COMPANY_ID y PLAZA_ID son obligatorios";

  console.log("ACCEPT_PREVIOUS_DATE", process.env.ACCEPT_PREVIOUS_DATE);

  if (
    process.env.ACCEPT_PREVIOUS_DATE !== "yes" &&
    process.env.ACCEPT_PREVIOUS_DATE !== "not"
  )
    menssageError +=
      "\n\nERROR: prop. VARIABLE DE ENTORNO, ACCEPT_PREVIOUS_DATE solo puede ser 'yes' o 'not'";

  const yearActual = new Date().getFullYear();
  const yearInvoice = new Date(
    dataFile.xmlFeSigned.rFE.gDGen.dFechaEm._text
  ).getFullYear();
  const monthInvoice =
    new Date(dataFile.xmlFeSigned.rFE.gDGen.dFechaEm._text).getMonth() + 1;
  if (
    process.env.ACCEPT_PREVIOUS_DATE === "not" &&
    yearInvoice !== yearActual &&
    `${monthInvoice}/${yearActual}` !== `12/${yearActual - 1}`
  )
    menssageError +=
      "\n\nERROR: prop. dFechaEm. El AÑO de la FACTURA no puede ser distinto al año en curso";
  if (!dataFile.xmlFeSigned.rFE.gDGen.dFechaEm._text)
    menssageError +=
      "\n\nERROR: prop. dFechaEm. La FECHA de la factura no puede estar vacio";

  if (dataFile.feNumber === "")
    menssageError +=
      "\n\nERROR: prop. feNumber. El NRO DE FACTURA no puede estar vacio";

  if (Number(dataFile.xmlFeSigned.rFE.gTot.dVTot._text) === 0)
    menssageError +=
      "\n\nERROR: prop. cVTot. El TOTAL de la factura no puede ser cero";

  if (Number(dataFile.xmlFeSigned.rFE.gTot.dTotNeto._text) === 0)
    menssageError +=
      "\n\nERROR: prop. dTotNeto. El TOTAL NETO de la factura no puede ser cero";

  const total = sumTotal(dataFile.xmlFeSigned.rFE.gItem);

  if (Number(dataFile.xmlFeSigned.rFE.gTot.dVTot._text) !== total)
    menssageError +=
      "\n\nERROR: prop. cVTot. El TOTAL no puede ser distinto a la suma de su detalle";

  return menssageError;
};

module.exports = { controlSales };
