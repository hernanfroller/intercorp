'use strict'

const config = require('../bin/config');

function processInfo(data) {
    return new Promise(function (resolve, reject) {
            
            const typeVoucher = data.voucherId;
            const establishmentId = data.establishmentId;
            var billItems = [];
            var item = {};
            var valueUnit = 0;
            var subtotal = 0, igv = 0, total = 0,discount = 0;
            var sumTotal = 0, totalGravada = 0, totalIgv = 0, totalDiscount = 0;
            var serie = '', number = 0;
            var identificador;
            var dataClient = false;
            const typeIgv = 1;
                    for (var line of data.lines) {
                            item = {};
                            valueUnit = 0;
                            subtotal = 0;
                            igv = 0;
                            total = 0;
                            discount = 0;
                            discount = line.discount / config.divPercentageIgv;
                            valueUnit = line.unitPrice / config.divPercentageIgv;
                            subtotal = (valueUnit*line.quantity) - discount;
                            igv  = subtotal * config.percentageIgv;
                            total = subtotal + igv;
                            item = {
                                    unidad_de_medida: line.type == 'M' || line.type == constants.INVOICE_LINE_TYPE_UNPAID_RECORD ? 'ZZ' : 'NIU',
                                    codigo: line.type == 'M' ? line.planId : line.type == constants.INVOICE_LINE_TYPE_UNPAID_RECORD ? line.unpaidRecordId : line.itemId,
                                    descripcion:  line.name,
                                    cantidad: line.quantity,
                                    valor_unitario: parseFloat(valueUnit.toFixed(2)),
                                    precio_unitario: parseFloat(line.unitPrice.toFixed(2)),
                                    descuento: parseFloat(discount.toFixed(2)),
                                    subtotal: parseFloat(subtotal.toFixed(2)),
                                    tipo_de_igv: typeIgv,
                                    igv: parseFloat(igv.toFixed(2)),
                                    total: total,
                                    anticipo_regularizacion: false,
                                    anticipo_documento_serie: '',
                                    anticipo_documento_numero: ''
                            }
                            billItems.push(item);
                            sumTotal += total;
                            totalGravada += total;
                            totalIgv += igv;
                            totalDiscount += discount;    
                    }
                    totalGravada = total / config.divPercentageIgv;
                    dataClient = config.tipoVoucher.Boleta  && sumTotal > constants.AMOUNT_FOR_GENERATE_FACTURA_BOLETA_NUBEFACT? true : false;

                    getTicketNumber({establishmentId,typeVoucher}).then(result =>{
                            identificador = result;
                            console.log('indentificador',identificador)
                            const serieCod = typeVoucher == config.tipoVoucher.Boleta ? constants.TYPE_VOUCHER_BOLETA_NUBEFACT : constants.TYPE_VOUCHER_FACTURA_NUBEFACT;
                            
                            const nubefactJson = {
                                    operacion: 'generar_comprobante',
                                    tipo_de_comprobante: typeVoucher,
                                    serie: serieCod + identificador.maxSerie,
                                    numero: identificador.max + 1,
                                    sunat_transaction: 1,
                                    cliente_tipo_de_documento: dataClient ? data.docType : '-',
                                    cliente_numero_de_documento: dataClient ? data.numDoc : '-',
                                    cliente_denominacion: dataClient ? data.completeName : constants.BOLETA_NUBEFACT_CLIENT_DENOMINATION,
                                    cliente_direccion: dataClient ? data.address : '-',
                                    cliente_email: data.email,
                                    cliente_email_1: '',
                                    cliente_email_2: '',
                                    fecha_de_emision: DateHelper.formatDDMMYYYY( new Date(data.date) ),
                                    fecha_de_vencimiento: '',
                                    moneda: '1',
                                    tipo_de_cambio: '',
                                    porcentaje_de_igv: config.igv,
                                    descuento_global: '',
                                    total_descuento: totalDiscount,
                                    total_anticipo: '',
                                    total_gravada: totalGravada,
                                    total_inafecta: '',
                                    total_exonerada: '',
                                    total_igv: totalIgv,
                                    total_gratuita: '',
                                    total_otros_cargos: '',
                                    total: sumTotal,
                                    percepcion_tipo: '',
                                    percepcion_base_imponible: '',
                                    total_percepcion: '',
                                    total_incluido_percepcion: '',
                                    detraccion: false,
                                    observaciones: '',
                                    documento_que_se_modifica_tipo: '',
                                    documento_que_se_modifica_serie: '',
                                    documento_que_se_modifica_numero: '',
                                    tipo_de_nota_de_credito: '',
                                    tipo_de_nota_de_debito: '',
                                    enviar_automaticamente_a_la_sunat: true,
                                    enviar_automaticamente_al_cliente: '',
                                    codigo_unico: '',
                                    condiciones_de_pago: '',
                                    medio_de_pago: '',
                                    placa_vehiculo: '',
                                    orden_compra_servicio: '',
                                    tabla_personalizada_codigo: '',
                                    formato_de_pdf: constants.FORMAT_PDF_NUBEFACT,
                                    items: billItems
                            };
                            console.log('nubejson',nubefactJson)
                            request.post({
                                headers: {'content-type' : 'application/json',
                                'Authorization':`Token token="${data.credentials.token}"`
                                },
                                json: true,
                                url: data.credentials.url,
                                body: nubefactJson
                            }, function(error, response, body){
                                    if(error){
                                            
                                            logSupport.addBillingLog({
                                                    establishmentId: data.establishmentId,
                                                    userEstablishmentId: data.userEstablishmentId,
                                                    platform: config.plataformaFacturacion.Nubefact,
                                                    funtion: 'Procesar',
                                                    responseCode: !body.errors ? 'SUCCESS' : 'ERROR',
                                                    responseMsg: '',
                                                    dataSend: JSON.stringify({txt: nubefactJson }),
                                                    response: JSON.stringify(body.errors),
                                                    folio:  null, 
                                                    typeDoc: data.voucherId
                                                
                                                });
                    
                                            return reject(error);
                                    }else{
                                            if(body.errors != undefined){
                                                    logSupport.addBillingLog({
                                                            establishmentId: data.establishmentId,
                                                            userEstablishmentId: data.userEstablishmentId,
                                                            platform: config.plataformaFacturacion.Nubefact,
                                                            funtion: 'Procesar',
                                                            responseCode: !body.errors ? 'SUCCESS' : 'ERROR',
                                                            responseMsg: '',
                                                            dataSend: JSON.stringify({txt: nubefactJson }),
                                                            response: JSON.stringify(body.errors),
                                                            folio:  null, 
                                                            typeDoc: data.voucherId
                                                        
                                                        });
                                                    return reject({cod: body.codigo,msg:body.errors});
                                            }else{
                                                    const bodyInsert = {
                                                            idEstablishment: establishmentId,
                                                            voucherType: typeVoucher,
                                                            serie: serieCod + identificador.maxSerie,
                                                            number: identificador.max + 1,
                                                            numberSerie: identificador.maxSerie   
                                                    }
                                                    addTicket(bodyInsert).then(resulInsert =>{
                                                            logSupport.addBillingLog({
                                                                    establishmentId: data.establishmentId,
                                                                    userEstablishmentId: data.userEstablishmentId,
                                                                    platform: config.plataformaFacturacion.Nubefact,
                                                                    funtion: 'Procesar',
                                                                    responseCode: !body.errors ? 'SUCCESS' : 'ERROR',
                                                                    responseMsg: '',
                                                                    dataSend: JSON.stringify({txt: nubefactJson }),
                                                                    response: JSON.stringify(body),
                                                                    folio:  null, 
                                                                    typeDoc: data.voucherId
                                                                
                                                                });
                                                            return resolve({
                                                                    invoiceNum: identificador.maxSerie, 
                                                                    url: body.enlace,
                                                                    cod: 200
                                                            });
                                                    }).catch(e =>{  
                                                           
                                                            return reject(e)
                                                    });
                                            }
                                    }
                            });
    
    
                        }).catch(e =>{  
                           
                            return reject(e)
                        });
            });   
    }

    module.exports = {
        processInfo
    }