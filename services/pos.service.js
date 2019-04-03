'use strict'

const config = require('../bin/config');

function establishmentStatusForSale(establishmentId){
    return new Promise( (resolve,reject)=> {
        dbReader.query(`SELECT onlineKeys.*, est.autoGenInv,
                    DATE_FORMAT(CONVERT_TZ(NOW(),'+00:00',est.timezone),'%Y-%m-%d') AS date,
                    countries.*,
                    est.name AS 'establishmentName',
                    est.ruc AS 'establishmentRuc',
                    est.id AS 'establishmentId',
                    est.statusPrint
                FROM establishments est 
                        LEFT JOIN online_billing_keys onlineKeys ON  est.id = onlineKeys.establishmentId
                        LEFT JOIN countries ON est.countryId = countries.id 
                        WHERE est.id = ${establishmentId}`,(err,establishmentData)=>{
                if (err) {
                    reject(err);
                } else {
                    resolve(establishmentData[0]);
                }
            })
    });
} 

module.exports = {
    establishmentStatusForSale
}