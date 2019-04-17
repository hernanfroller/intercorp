'use strict'

const db = require('../database');
const services = require('../services');
const config = require('../bin/config');

function getLang(lang) {
    switch(lang) {
        case 'en':
            return require(`./../bin/lang/en`);
        case 'fr':
            return require(`./../bin/lang/fr`);
        case 'su':
            return require(`./../bin/lang/su`);
        case 'al':
            return require(`./../bin/lang/al`);
        default:
            return require(`./../bin/lang/es`);
    }
}

function getTemplateId(establishmentId, typeMail) {
    return new Promise(function (resolve, reject) {
        var sentence =  `select messages_automatic_template.template from messages_automatic_template
         inner join establishments on establishments.id = messages_automatic_template.establishmentId 
         where establishments.statusConfMessage = 'Y' and 
         messages_automatic_template.establishmentId =  ${establishmentId} and messages_automatic_template.typeMessage = '${typeMail}' 
         and messages_automatic_template.status = '1' `;
   
        db.mysql.reader.query(sentence, function (err, rows) {
            if (err) {
                return reject(err);
            } else {
                if (rows.length > 0) {
                    
                    return resolve(rows[0].template)
                }
                return resolve(null)
            }
        });

    })
}

function addLogs(idUser, type) {
    let sentence = `insert into auto_messages_logs (autoMessageTypeId, userEstablishmentId) values ('${type}', ${idUser})`;
    db.mysql.writter.query(sentence, function (err, rows) {
        if (err) {
            console.error(err);
        }
    });
}

function addErrorLog(data){
    return new Promise( (resolve,reject)=> {
        db.mysql.writter.query(`INSERT INTO erros_logs SET ? `, data, (err,result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
    });
}

module.exports = {
    getTemplateId,
    addLogs,
    addErrorLog,
    getLang
}