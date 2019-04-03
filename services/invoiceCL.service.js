'use strict'

const config = require('../bin/config');

function processInfoChile(data) {

    return new Promise(function(resolve, reject) {
        const typeVoucher = data.voucherId;
        var txtFile = '';
        var fileName = '';

        if (typeVoucher == config.tipoVoucher.Boleta) {
            txtFile = buildBoletaChile(data);
            fileName = 'boleta-user-' + data.userEstablishmentId + '.txt';
        } else if (typeVoucher == config.tipoVoucher.BoletaExenta) {
            data.typeDoc = config.tipoDocumentoChile.BoletaExentaElectronica;
            txtFile = buildBoletaChile(data);
            fileName = 'boleta-user-' + data.userEstablishmentId + '.txt';
        } else if (typeVoucher == config.tipoVoucher.Factura) {
            data.typeDoc = config.tipoDocumentoChile.FacturaElectronica;
            data.guideIdentifierId = config.tipoDespacho.SinDespacho;
            data.guideTypeId = 0;
            txtFile = buildFacturaChile(data);
            fileName = 'factura-user-' + data.userEstablishmentId + '.txt';
        } else if (typeVoucher == config.tipoVoucher.GuiaDespacho) {
            data.typeDoc = config.tipoDocumentoChile.GuiaDespachoElectronica;
            data.guideTypeId = 2;
            txtFile = buildFacturaChile(data);
            fileName = 'factura-user-' + data.userEstablishmentId + '.txt';
        } else if (typeVoucher == config.tipoVoucher.FacturaExenta) {
            data.typeDoc = config.tipoDocumentoChile.FacturaExentaElectronica;
            data.guideIdentifierId = config.tipoDespacho.SinDespacho;
            data.guideTypeId = 0;
            txtFile = buildFacturaChile(data);
            fileName = 'factura-user-' + data.userEstablishmentId + '.txt';
        } else {
            data.typeDoc = config.tipoDocumentoChile.NotaCreditoElectronica;

            txtFile = buildCreditNoteChile(data);
            fileName = 'creditNote-user-' + data.userEstablishmentId + '.txt';
        }



        createTxt({ fileName, content: txtFile }).then(ruta => {
            const wsData = {
                credetials: data.credentials,
                ruta,
                establishmentId: data.establishmentId,
                userEstablishmentId: data.userEstablishmentId,
            }
            sendDataToWSChile(wsData).then(resp => {

                deleteFile(ruta).then(result => {
                    return resolve(resp)
                }).catch(e => {
                    return reject(e)
                });
            }).catch(e => {
                return reject(e)
            });
        }).catch(e => {
            return reject(e)
        });


    });

}

module.exports.processInfoChile = processInfoChile;


function buildBoletaChile(data) {
    var montoNeto = 0,
        exento = 0,
        iva = 0,
        montotTotal = 0,
        subTotal = 0,
        recargos = 0;
    var details = '';
    var discounts = ``;
    var i = 0;
    var y = 0;
    var descuentos = 0,
        montoNF = 0,
        totalPeriodo = 0,
        saldoAnterior = 0,
        valorAPagar = 0;
    const montoBruto = true;
    var valorExento = 0;
    let boletaTotales = ``;
    var valorTypeExento = 0;
    const tasaIva = data.typeDoc == config.tipoDocumentoChile.BoletaExentaElectronica ? 0 : config.tasaIvaCile;
    iva = tasaIva
        //Lineas de la factura
    for (var lin of data.lines) {
        var prod = lin.type == 'M' ? 'Membresía' : lin.type == constants.INVOICE_LINE_TYPE_UNPAID_RECORD ? 'Clase suelta' : 'Producto'
        var codProd = lin.type == 'M' ? lin.planId : lin.type == constants.INVOICE_LINE_TYPE_UNPAID_RECORD ? lin.unpaidRecordId : lin.itemId;
        var tpoCod = lin.type == 'M' ? 'Memb' : lin.type == constants.INVOICE_LINE_TYPE_UNPAID_RECORD ? 'Clase' : 'Prod';
        var valor = montoBruto ? (lin.quantity * (lin.unitPrice - lin.discount)) : 0;
        valorTypeExento = valorTypeExento + (lin.quantity * lin.unitPrice);
        if (data.typeDoc == config.tipoDocumentoChile.BoletaExentaElectronica) {
            details += `
            ${i + 1};${codProd};${lin.name}${" (" + data.comment + ")"};${config.identificadorExencion.ExentoIva};${lin.quantity};${lin.unitPrice};${lin.unitPrice * lin.quantity};${lin.unitPrice * lin.quantity};${tpoCod};${config.unidadMedida.Unidad};${lin.name};`;
        } else {
            details += `
            ${i + 1};${codProd};${lin.name}${" (" + data.comment + ")"};${config.identificadorExencion.AfectoIva};${lin.quantity};${lin.unitPrice};0;${lin.unitPrice * lin.quantity};${tpoCod};${config.unidadMedida.Unidad};${lin.name};`;
        }
        exento = (exento + valorExento);
        subTotal = montoBruto ? (subTotal + valor) : 0;
        if (lin.discount > 0) {
            if (data.typeDoc == config.tipoDocumentoChile.BoletaExentaElectronica) {
                discounts += `
                ${i + 1};${config.DescuentosRecargados.Descuento};Descuento por ${prod};${config.tipoDR.Moneda};${lin.discount};1;`;
                descuentos += parseInt(lin.discount);
            } else {
                discounts += `
                ${i + 1};${config.DescuentosRecargados.Descuento};Descuento por ${prod};%;${lin.discount};0;`;
                descuentos += parseInt(lin.discount);
            }
        } else {
            discounts += ``;
        }
        i++;
    }
    /*
    Si boleta afecta a IVA y IndMntNeto = Montos Netos (2) total = Neto + IVA + Exento
    Si IndMntNeto = Montos Brutos (0) Total = Suma Valor por linea - Descuentos + Recargos  
    */
    data.typeDoc ? typeDTE = data.typeDoc : typeDTE = config.tipoDocumentoChile.BoletaElectronica;
    montoTotal = true ? (montoNeto + iva + exento) : (subTotal - descuentos + recargos);
    const boleta = `${typeDTE};0;${data.date};${config.indicadorServicio.BoletaVentasServicios};${config.identificadorMontos.MontosBrutos};;;;${data.numDoc.trim()};${data.userEstablishmentId};${data.completeName};Cliente;${data.address ? data.address : '-'};${data.comuna ? data.comuna : '-'};${data.ciudad ? data.ciudad : '-'};${data.email ? data.email : '-'};`;
    if (typeDTE == config.tipoDocumentoChile.BoletaExentaElectronica) {
        exento = valorTypeExento;
        montoTotal = valorTypeExento;
        boletaTotales = `0;${exento-parseInt(descuentos)};0;${montoTotal-parseInt(descuentos)};${montoNF};${totalPeriodo};${saldoAnterior};${valorAPagar};`;
    } else {
        exento = Math.round((valorTypeExento - parseInt(descuentos)) / (1 + (config.tasaIvaCile / 100)));
        //exento = Math.round((valorTypeExento -parseInt(descuentos)));
        iva = Math.round(exento * (config.tasaIvaCile / 100));
        montoTotal = exento + iva
        boletaTotales = `${exento};0;${iva};${montoTotal};${montoNF};${totalPeriodo};${saldoAnterior};${valorAPagar};`;
    }
    const boletaDetalles = `${details}`;
    const descuentosRecargos = discounts != `` ? `->BoletaDescRec<-${discounts}` : ``;
    const sucursal = data.credentials.sucursalId ? `->Adicionales<- 
1;${data.credentials.sucursalId};` : ``;

    tax = iva;
    var fileContent = `->Boleta<-
${boleta}
->BoletaTotales<-
${boletaTotales}
->BoletaDetalle<-
${details.trim()}
->BoletaDescRec<-
${discounts}
->Observacion<-
${data.comment};
${sucursal}`;
    txtFileContent = fileContent;

    return fileContent;
}


function buildFacturaChile(data) {
    typeDTE = data.typeDoc;
    var i = 0,
        porcDescTot = 0,
        total = 0,
        neto = 0;
    var valDescTot = 0;
    var porcRecgoTot = 0;
    var exento = 0,
        iva = 0;
    var montoTotal = 0,
        valRecgoTot = 0;
    var details = '';
    var valor = 0;
    var subTotItem = 0;
    var porcDescuentoLin = 0;
    var discount = 0;
    var totalDiscount = 0
    const exenta = typeDTE == config.tipoDocumentoChile.FacturaExentaElectronica ? true : false;
    const tasaIva = exenta ? 0 : config.tasaIvaCile;
    const FmaPago = typeDTE == config.tipoDocumentoChile.FacturaExentaElectronica ||
        typeDTE == config.tipoDocumentoChile.FacturaElectronica ? `->FormaPago<-
${config.formaPago.contado};` : ``;

    for (var lin of data.lines) {
        //valor = Number((lin.unitPrice*lin.quantity) - lin.valorDescuento + lin.valorRecargo + lin.valorExento)
        subTotItem = exenta ? Number(Number(lin.unitPrice).toFixed(2)) : ((lin.unitPrice) / (1 + (tasaIva / 100))).toFixed(2); //Sin iva 
        discount = exenta ? Number(Number(lin.discount).toFixed(2)) : (lin.discount / (1 + (tasaIva / 100)));


        valor = (lin.quantity * subTotItem); //-discount;
        porcDescuentoLin = discount > 0 ? (discount * 100) / valor : 0;
        valor -= discount;


        var porcRecargo = 0;
        var valorExento = exenta ? valor : 0;
        var prod = lin.type == 'M' ? 'Membresía' : lin.type == constants.INVOICE_LINE_TYPE_UNPAID_RECORD ? 'Clase suelta' : 'Producto';
        var codProd = lin.type == 'M' ? lin.planId : lin.type == constants.INVOICE_LINE_TYPE_UNPAID_RECORD ? lin.unpaidRecordId : lin.itemId;
        var tpoCod = lin.type == 'M' ? 'Memb' : lin.type == constants.INVOICE_LINE_TYPE_UNPAID_RECORD ? 'Clase' : 'Prod';
        details += `
${i + 1};${codProd};${lin.name};${lin.quantity};${subTotItem};${porcDescuentoLin.toFixed(2)};${discount.toFixed(2)};0;0;${valorExento.toFixed(2)};${valor.toFixed(2)};${tpoCod};${config.unidadMedida.Unidad};;`;
        //porcDescTot += Number(porcDescuentoLin);
        // valDescTot += Number(lin.discount);
        porcRecgoTot += Number(porcRecargo);
        total += valor;
        exento += Number(valorExento);
        totalDiscount += discount;
        i++;

    }
    neto = exenta ? 0 : Math.round(Number(total - valDescTot + valRecgoTot));
    iva = exenta ? 0 : Math.round(total * (tasaIva / 100));
    montoTotal = neto + exento + iva;
    let latin = utf8ToLatin(data.completeName)
    const encabezado = `${data.typeDoc};0;${data.date};${data.guideTypeId};${data.guideIdentifierId};${data.numDoc.trim()};${utf8ToLatin(data.completeName)};Cliente;${data.address ? utf8ToLatin(data.address) : '-'};${data.comuna ? (data.comuna) : '-'};${data.ciudad ? utf8ToLatin(data.ciudad) : '-'};${data.email ? data.email : '-'};`;
    const totales = `${porcDescTot};${totalDiscount.toFixed(2)};${porcRecgoTot};${valRecgoTot};${Math.round(neto)};${Math.round(exento)};${tasaIva};${Math.round(iva)};${Math.round(montoTotal)};`;
    const sucursal = data.credentials.sucursalId ? `->Adicionales<- 
1;${data.credentials.sucursalId};` : ``;

    tax = iva;
    var fileContent = `->Encabezado<-
${encabezado}
${FmaPago}
->Totales<-
${totales}
->Detalle<-
${details.trim()}
->Observacion<-
${utf8ToLatin(data.comment)};
${sucursal}`;

    txtFileContent = fileContent;
    return fileContent;
}

function buildCreditNoteChile(data) {
    typeDTE = data.typeDoc;

    var i = 0,
        porcDescTot = 0,
        total = 0,
        neto = 0;
    var valDescTot = 0;
    var porcRecgoTot = 0;
    var exento = 0,
        iva = 0;
    var montoTotal = 0,
        valRecgoTot = 0;
    var details = '';
    var valor = 0;
    var subTotItem = 0;
    var porcDescuentoLin = 0;
    var discount = 0;
    var totalDiscount = 0
    const esBoleta = data.typeDTE != config.tipoDocumentoChile.BoletaElectronica ? false : true;
    var tasaIva = !esBoleta ? config.tasaIvaCile : 0;

    if (data.typeDTE == parseInt(config.tipoDocumentoChile.BoletaExentaElectronica) || data.typeDTE == parseInt(config.tipoDocumentoChile.FacturaExentaElectronica)) {
        tasaIva = 0
    }



    for (var lin of data.details) {


        //valor = Number((lin.unitPrice*lin.quantity) - lin.valorDescuento + lin.valorRecargo + lin.valorExento)
        // subTotItem = !esBoleta ? ((lin.unitPrice)/(1+(tasaIva/100))).toFixed(2) : lin.unitPrice.toFixed(2); //Sin iva 
        subTotItem = !esBoleta ? ((lin.subImport / lin.subQuantity) / (1 + (tasaIva / 100))).toFixed(2) : (lin.subImport / lin.subQuantity);
        // discount =  !esBoleta ? (lin.discount/(1+(tasaIva/100))) : lin.discount;
        valor = (lin.subQuantity * subTotItem) - discount;
        porcDescuentoLin = 0; // (discount*100)/valor;

        var porcRecargo = 0;
        var valorExento = 0;
        var prod = lin.type == 'M' ? 'Membresía' : lin.type == constants.INVOICE_LINE_TYPE_UNPAID_RECORD ? 'Clase suelta' : 'Producto'
        var codProd = lin.itemId;
        var tpoCod = lin.type == 'M' ? 'Memb' : lin.type == constants.INVOICE_LINE_TYPE_UNPAID_RECORD ? 'Clase' : 'Prod';
        details += `
${i + 1};${codProd};${lin.desc};${lin.subQuantity};${subTotItem};${porcDescuentoLin.toFixed(2)};${discount.toFixed(2)};0;0;0;${valor.toFixed(2)};${tpoCod};${config.unidadMedida.Unidad};${lin.desc};`;
        //porcDescTot += Number(porcDescuentoLin);
        // valDescTot += Number(lin.discount);
        porcRecgoTot += Number(porcRecargo);
        total += valor;
        exento += Number(valorExento);
        totalDiscount += discount;
        i++;
    }
    neto = Number(total - valDescTot + valRecgoTot);
    iva = !esBoleta ? total * (tasaIva / 100) : 0;
    if (data.typeDTE == parseInt(config.tipoDocumentoChile.BoletaExentaElectronica) || data.typeDTE == parseInt(config.tipoDocumentoChile.FacturaExentaElectronica)) {
        iva = 0
    }

    montoTotal = neto + exento + iva;

    const encabezado = `${data.typeDoc};0;${data.date};0;0;${(data.numDoc) ? data.numDoc.trim() : ''};${utf8ToLatin(data.completeName)};Cliente;${utf8ToLatin(data.address) || ' '};;;${utf8ToLatin(data.email) || ' '};`;

    if (esBoleta) {
        var totales = `${porcDescTot};${totalDiscount.toFixed(2)};${porcRecgoTot};${valRecgoTot};${neto.toFixed(2)};${exento};${tasaIva};${iva.toFixed(2)};${(montoTotal).toFixed(2)};`;
    } else {
        var totales = `${porcDescTot};${Math.round(totalDiscount)};${porcRecgoTot};${valRecgoTot};${Math.round(neto)};${exento};${tasaIva};${Math.round(iva)};${Math.round(montoTotal)};`;
    }



    const sucursal = data.credentials.sucursalId ? `->Adicionales<- 
1;${data.credentials.sucursalId};` : ``;
    tax = iva;
    var fileContent = `->Encabezado<-
${encabezado}
->Totales<-
${totales}
->Detalle<-
${details.trim()}
->Referencia<- 
1;${data.typeDTE};${data.invoiceNum};${data.invoiceDate};3;${data.description}; 
${sucursal}`;
    //data.codigoRef = 3
    txtFileContent = fileContent;
    return fileContent;
}


function createTxt(data) {

    return new Promise(function(resolve, reject) {
        fs.writeFile(prefixServer + data.fileName, data.content, function(err) {
            // la funcion es la que maneja lo que sucede despues de termine el evento
            if (err) {
                console.log("err " + err)
                return reject(err)
            } else {
                return resolve(prefixServer + data.fileName);
            }
        });
    });

}

function deleteFile(ruta) {
    return new Promise(function(resolve, reject) {

        fs.unlink(ruta, function(err) {
            if (err && err.code == 'ENOENT') {
                console.info("File doesn't exist, won't remove it.");
                return resolve("File doesn't exist, won't remove it.");
            } else if (err) {
                console.error("Error occurred while trying to remove file");
                return reject(err)
            } else {

                return resolve("Exito!!");
            }
        });

    });
}


function sendDataToWSChile(data) {

    return new Promise(function(resolve, reject) {

        const login = {
            Usuario: base64.encode(data.credetials.Usuario),
            Rut: base64.encode(data.credetials.Rut),
            Clave: base64.encode(data.credetials.Clave),
            Puerto: base64.encode(data.credetials.Puerto),
            IncluyeLink: '1'
        }
        var args = {
            login
        };
        url = data.credetials.Url;
        soap.createClient(url, function(err, ws) {
            if (err) {
                console.error(err);
                return reject(err)
            } else {

                ws.Online(args, function(err, result) {
                    //Ver que retorna, si es 1esta online isConected = true
                    logSupport.addBillingLog({
                        establishmentId: data.establishmentId,
                        userEstablishmentId: data.userEstablishmentId,
                        platform: config.plataformaFacturacion.FacChile,
                        funtion: 'Online',
                        responseMsg: result.OnlineResult,
                        dataSend: JSON.stringify({ txt: txtFileContent }),
                        typeDoc: typeDTE

                    });
                    if (result.OnlineResult == 'Online=1') {
                        var archivo = fs.readFileSync(data.ruta);
                        var billInfo = {
                            login,
                            file: base64.encode(archivo),
                            formato: config.formatoArchivo.TXT
                        };
                        ws.Procesar(billInfo, function(err, result) {
                            if (err) {
                                console.log(err)
                                return reject(err)
                            } else {

                                var parser = new xml2js.Parser();
                                parser.parseString(result.ProcesarResult, function(err, resultXml) {
                                    if (err) {
                                        return reject(err)
                                    } else {

                                        let resp = {}
                                        var resCL = resultXml;

                                        logSupport.addBillingLog({
                                            establishmentId: data.establishmentId,
                                            userEstablishmentId: data.userEstablishmentId,
                                            platform: config.plataformaFacturacion.FacChile,
                                            funtion: 'Procesar',
                                            responseCode: resCL.WSPLANO.Resultado == 'True' ? 'SUCCESS' : 'ERROR',
                                            responseMsg: resCL.WSPLANO.Mensaje[0],
                                            dataSend: JSON.stringify({ txt: txtFileContent }),
                                            response: JSON.stringify(resCL.WSPLANO),
                                            folio: resCL.WSPLANO.Resultado == 'True' ? resCL.WSPLANO.Detalle[0].Documento[0].Folio[0] : null,
                                            typeDoc: typeDTE

                                        });


                                        if (resCL.WSPLANO.Resultado == 'True') {
                                            resp = {
                                                invoiceNum: resCL.WSPLANO.Detalle[0].Documento[0].Folio[0],
                                                url: base64.decode(resCL.WSPLANO.Detalle[0].Documento[0].urlOriginal[0]),
                                                cod: 200,
                                                typeDTE
                                            }

                                            return resolve(resp)
                                        } else if (resCL.WSPLANO.Resultado == 'False') {
                                            resp = {
                                                msg: 'FACTURACIÓN',
                                                title: resCL.WSPLANO.Detalle[0].Documento[0].Error[0],
                                                cod: 400
                                            }
                                            return resolve(resp)
                                        }

                                    }
                                });

                            }

                        });

                    }

                });
            }

        });

    });

}



function processInfoPeru(data) {
    return new Promise(async function(resolve, reject) {
        const typeVoucher = data.voucherId;
        var txtFile = '';
        var fileName = '';

        if (typeVoucher == config.tipoVoucher.Boleta) {
            data.tipoDocumento = config.tipoDocumentoPeru.BoletaVentaElectronica;
            txtFile = buildTxtFacturaPeru(data);
            fileName = 'boleta-user-' + data.userEstablishmentId + '.txt';
        } else if (typeVoucher == config.tipoVoucher.Factura) {
            data.tipoDocumento = config.tipoDocumentoPeru.FacturaElectronica;
            txtFile = buildTxtFacturaPeru(data);
            fileName = 'factura-user-' + data.userEstablishmentId + '.txt';
        } else {
            data.tipoDocumento = config.tipoDocumentoPeru.NotaCredito;
            txtFile = await buildCreditNotePeru(data);
            fileName = 'creditNote-user-' + data.userEstablishmentId + '.txt';
        }



        createTxt({ fileName, content: txtFile }).then(ruta => {
            const wsData = {
                credetials: data.credentials,
                ruta,
                establishmentId: data.establishmentId,
                userEstablishmentId: data.userEstablishmentId,
            }
            sendDataToWSPeru(wsData).then(resp => {
                if (data.numDoc) {
                    addinfoPeru({
                        doctype: (data.docType).toString(),
                        numDoc: data.numDoc,
                        address: data.address,
                        name: data.completeName,
                        userEstablishmentId: data.userEstablishmentId,
                        invoiceNum: resp.invoiceNum
                    })
                }
                deleteFile(ruta).then(result => {
                    return resolve(resp)
                }).catch(e => {
                    console.log(' sendDataToWSPeru ' + e)
                    return reject(e)
                });
            }).catch(e => {
                console.log(' sendDataToWSPeru ' + e)
                return reject(e)
            });
        }).catch(e => {
            return reject(e)
        });

    });
}

module.exports.processInfoPeru = processInfoPeru;

async function buildCreditNotePeru(data) {
    var details = '';
    var detailsImpuestos = '';
    var detailsDscRec = ''; //Descuentos Recargados
    var i = 0;
    var y = 0;
    var subTotal = 0;
    var descuento = 0;
    var descuentoGlobal = 0;
    var recargo = 0;
    var exonerado = 0;
    var gratuito = 0;
    var inefecto = 0;
    var igv = 0;
    var isc = 0;
    var impuesto = 0;
    var linPrice = 0
    var linIgv = 0;
    var linDiscount = 0;
    var valueUnit = 0;
    var linSubtotal = 0;
    var subtotal = 0;


    var dataNc = await getUserNCPeru(data.userEstablishmentId, data.invoiceNum)

    for (var lin of data.details) {


        var codProd = lin.itemId
            // var totalPrice = lin.import - lin.subImport
        var totalPrice = lin.subImport
        let totalPriceNoIgv = round(totalPrice / config.divPercentageIgv);
        let noIgvDiscount = round(lin.discount / config.divPercentageIgv);
        let totalLinIgv = round(totalPriceNoIgv * config.percentageIgv);
        let unitLinUnitPrice = round((totalPriceNoIgv + noIgvDiscount) / lin.quantity)
        let lineImport = round((unitLinUnitPrice * lin.quantity) - noIgvDiscount)


        details += `${i + 1};${codProd};${config.tipoProducto.Servicio};${lin.description};ZZ;${lin.quantity};${unitLinUnitPrice};${noIgvDiscount};${lineImport};\n`;
        descuento += round(noIgvDiscount);
        subTotal += round(lineImport);
        igv += Number(totalLinIgv);
        detailsImpuestos += `${i + 1};${config.Impuesto.GeneralDeVentas};10;${totalLinIgv};
`;

        i++;
    }
    typeDTE = data.tipoDocumento;

    var docType = dataNc[0].doctype;
    var numDoc = dataNc[0].numDoc;
    var address = dataNc[0].address;
    const encabezado = `${data.tipoDocumento};;0;${moment().format('DD-MM-YYYY')};;${config.monedaClPeru.Sol};;${data.establishmentName};${utf8ToLatin(data.credentials.address)};${data.credentials.ubigeo};`;
    const receptor = `${docType};${numDoc};${utf8ToLatin(data.completeName)};Cliente;;${data.userEstablishmentId};;;;`;
    const sucursalReceptor = `${utf8ToLatin(data.completeName)};${address};${data.credentials.ubigeo};PE;;;;`;

    let totalFact = (subTotal + igv);
    let totalNoIgv = (totalFact / config.divPercentageIgv);
    let totalIgv = (totalFact - totalNoIgv);
    const totales = `${subTotal};${descuento};${recargo};${exonerado};${gratuito};${inefecto};${igv};${isc};${totalFact};`;
    const infoA = `Nota de credito de factura 3;`;
    var dataRef = data.invoiceNum.split('-');
    var tipoRef = '01';
    var serieRef = dataRef[0];
    var folioRef = Number(dataRef[1]);

    const ref = `${tipoRef};${serieRef};${folioRef};${data.description};`;

    tax = igv;
    var fileContent = `->Encabezado<-
${encabezado}
->Receptor<-
${receptor}
->SucursalReceptor<-
${sucursalReceptor}
->Detalles<-
${details.trim()}
->ImpuestoDetalles<-
${detailsImpuestos.trim()}
->Totales<-
${totales}
->InformacionAdicional<-
${infoA}
->Referencia<-
${ref}`;

    txtFileContent = fileContent;
    return fileContent;
}

function buildTxtFacturaPeru(data) {

    var details = '';
    var detailsImpuestos = '';
    var detailsDscRec = ''; //Descuentos Recargados
    var i = 0;
    var y = 0;
    var subTotal = 0;
    var descuento = 0;
    var descuentoGlobal = 0;
    var recargo = 0;
    var exonerado = 0;
    var gratuito = 0;
    var inefecto = 0;
    var igv = 0;
    var isc = 0;
    var impuesto = 0;
    var linPrice = 0
    var linIgv = 0;
    var linDiscount = 0;
    var valueUnit = 0;
    var linSubtotal = 0;
    var subtotal = 0;
    for (var lin of data.lines) {
        /*linDiscount = Number((lin.discount/config.divPercentageIgv).toFixed(2));
        console.log('linDiscount '+ linDiscount)
        valueUnit = (lin.unitPrice / config.divPercentageIgv);
        console.log('valueUnit '+ valueUnit )
        linSubtotal = ((valueUnit*lin.quantity) - linDiscount);
        console.log('linSubtotal '+ linSubtotal)
        linIgv  = (linSubtotal * config.percentageIgv)
        console.log('linIgv '+ linIgv)
        var codProd = lin.type == 'M' ? lin.planId : lin.itemId;
        let subIgv = ((lin.totalPrice /config.divPercentageIgv )* config.percentageIgv).toFixed(2);
        let subSinIgv = lin.totalPrice - subIgv;
        let discountSinIgv = Number((lin.discount/config.divPercentageIgv).toFixed(2));
        let lineSinDiscountSinIgv = (subSinIgv + discountSinIgv).toFixed(2);
        let valueUniSinIgv = normalizeToFixed(lineSinDiscountSinIgv / lin.quantity,2);*/
        /*
        var codProd = lin.type == 'M' ? lin.planId : lin.itemId;
        let totalPriceNoIgv = normalizeToFixed((lin.totalPrice /config.divPercentageIgv),2); 
        let noIgvDiscount = normalizeToFixed((lin.discount / config.divPercentageIgv),2);
        let totalLinIgv = normalizeToFixed((totalPriceNoIgv * config.percentageIgv),2);
        let unitLinUnitPrice = normalizeToFixed(( (totalPriceNoIgv + noIgvDiscount) / lin.quantity ),2) ;*/

        var codProd = lin.type == 'M' ? lin.planId : lin.type == constants.INVOICE_LINE_TYPE_UNPAID_RECORD ? lin.unpaidRecordId : lin.itemId;
        let totalPriceNoIgv = round(lin.totalPrice / config.divPercentageIgv);
        let noIgvDiscount = round(lin.discount / config.divPercentageIgv);
        let totalLinIgv = round(totalPriceNoIgv * config.percentageIgv);
        let unitLinUnitPrice = round((totalPriceNoIgv + noIgvDiscount) / lin.quantity)
        let lineImport = round((unitLinUnitPrice * lin.quantity) - noIgvDiscount)

        let tesSum = ((unitLinUnitPrice * lin.quantity) - noIgvDiscount);

        //details += `${i+1};${codProd};${config.tipoProducto.Servicio};${lin.name};ZZ;${normalizeToFixed(lin.quantity,2)};${normalizeToFixed(valueUnit,2)};${(linDiscount)};${(linSubtotal)};\n`;
        details += `${i + 1};${codProd};${config.tipoProducto.Servicio};${lin.name};ZZ;${lin.quantity};${unitLinUnitPrice};${noIgvDiscount};${lineImport};\n`;
        descuento += round(noIgvDiscount);
        subTotal += round(lineImport);
        igv += Number(totalLinIgv);
        detailsImpuestos += `${i + 1};${config.Impuesto.GeneralDeVentas};10;${totalLinIgv};
`;
        //detailsDscRec += ` ${i+1};${lin.descuentosRecargados}; ${lin.tipoDR};${lin.glosa};${lin.monto};`;
        i++;
    }
    typeDTE = data.tipoDocumento;

    const encabezado = `${data.tipoDocumento};;0;${moment().format('DD-MM-YYYY')};;${config.monedaClPeru.Sol};;${data.establishmentName};${utf8ToLatin(data.credentials.address)};${data.credentials.ubigeo};`;
    const receptor = `${data.docType};${data.numDoc.trim()};${utf8ToLatin(data.completeName)};Cliente;;${data.userEstablishmentId};${utf8ToLatin(data.email)};;;`;
    const sucursalReceptor = `${utf8ToLatin(data.completeName)};${utf8ToLatin(data.address)};${data.credentials.ubigeo};PE;;;;`;
    const impuestoDetalles = `${detailsImpuestos};`;
    //const descuentosRecargos = `->DescuentosRecargos<-${detailsDscRec};`; 
    let totalFact = (subTotal + igv);
    let totalNoIgv = (totalFact / config.divPercentageIgv);
    let totalIgv = (totalFact - totalNoIgv);
    const totales = `${subTotal};${descuento};${recargo};${exonerado};${gratuito};${inefecto};${igv};${isc};${totalFact};`;
    tax = igv;
    var fileContent = `->Encabezado<-
${encabezado}
->Receptor<-
${receptor}
->SucursalReceptor<-
${sucursalReceptor}
->Detalles<-
${details.trim()}
->ImpuestoDetalles<-
${detailsImpuestos.trim()}
->Totales<-
${totales}`;

    txtFileContent = fileContent;
    return fileContent;
}


function sendDataToWSPeru(data) {
    return new Promise(function(resolve, reject) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        url = data.credetials.Url;
        soap.createClient(url, function(err, ws) {
            if (err) {
                console.error(" error 95 " + err);
                return reject({ msg: "GLOBAL.ERROR", title: "GLOBAL.ERROR_TITULO" });
            } else {
                var archivo = fs.readFileSync(data.ruta);
                var args = {
                    login: {
                        Usuario: data.credetials.Usuario,
                        CodTributario: data.credetials.Rut,
                        Clave: data.credetials.Clave,
                    },
                    formato: config.formatoArchivo.TXT,
                    archivo: base64.encode(archivo),
                };

                ws.Procesar(args, function(err, result) {
                    if (err) {
                        console.error(" error 110 " + err);
                        return ({ msg: 'GLOBAL.ERROR_DB', title: 'GLOBAL.ERROR_DB_BODY' })
                    } else {
                        const respuesta = result.return;
                        logSupport.addBillingLog({
                            establishmentId: data.establishmentId,
                            userEstablishmentId: data.userEstablishmentId,
                            platform: config.plataformaFacturacion.FacPeru,
                            funtion: 'Procesar',
                            responseCode: respuesta.Resultado == true ? 'SUCCESS' : 'ERROR',
                            responseMsg: respuesta.Resultado.Mensaje,
                            dataSend: JSON.stringify({ txt: txtFileContent }),
                            response: JSON.stringify(respuesta),
                            folio: respuesta.Resultado == true ? respuesta.Detalle.Folio : null,
                            typeDoc: typeDTE
                        });


                        if (respuesta.Resultado == true) {
                            resp = {
                                invoiceNum: respuesta.Detalle[0].attributes.Folio,
                                url: respuesta.Detalle[0].attributes.UrlPdf,
                                cod: 200,
                                typeDTE
                            }

                            return resolve(resp)
                        } else {
                            return reject(respuesta.Mensaje)
                        }
                    }
                });
            }
        });
    });

}


const normalizeToFixed = (num, qDecimals) => {
    let factor = 10 ** qDecimals;
    num = num * factor;
    let newNum = num.toString().split('.')[0];
    return newNum / factor;
}

function round(number) {

    number = number * 100;
    number = Math.round(number);
    number = number / 100;
    return number;


}

function utf8ToLatin(string) {
    let iso8559 = unescape(encodeURIComponent(string))
    iso8559 = iso8559.replace("\n", " ");
    // let iso8559 = decodeURIComponent(escape(utf8))
    return iso8559
}

function addinfoPeru(data) {
    return new Promise(function(resolve, reject) {
        const sql = `INSERT INTO info_NC_Peru SET ?`;
        dbWritter.query(sql, data,
            function(err, rows) {
                if (err) {
                    return reject(err)
                } else {
                    return resolve(rows.insertId);
                }

            });
    })
}

function getUserNCPeru(userEstablishmentId, invoiceNum) {
    return new Promise(function(resolve, reject) {
        const sql = `select * from info_NC_Peru where invoiceNum = '${invoiceNum}' and userEstablishmentId = ${userEstablishmentId}`;
        dbReader.query(sql,
            function(err, rows) {
                if (err) {
                    return reject(err)
                } else {
                    return resolve(rows);

                }

            });
    })
}