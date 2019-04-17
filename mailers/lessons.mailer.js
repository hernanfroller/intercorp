const services = require('../services');
const config = require('../bin/config');
const sg = require('sendgrid')(config.environment.SEND_GRID.key);

async function scheduleSendEmial(userId, lessonRecordId, lang) {
    if (!config.environment.SEND_GRID.active) {
        let rows = await services.lessons.dataScheduleEmial(userId, lessonRecordId);
        if (rows) {
            for (var p of rows) {
                support.getEmailAdmin(p.establishmentId).then(function(resp) {
                    let bcc = [];
                    for (let i of resp) {
                        bcc.push({ email: i.email })
                    }
                    buildBodyAndSend(JSON.stringify(p), services.mailer.getLang(lang));
                    support.addLogs(p.userEstablishmentId, typeMail);
                }).catch(function(err) {
                    buildBodyAndSend(JSON.stringify(p), services.mailer.getLang(lang));
                })
            }
        }
    }
}

function buildBodyAndSend(bodyIn, lang) {
    bodyIn = JSON.parse(bodyIn);
    support.getTemplateId(bodyIn.establishmentId, typeMail)
        .then(function(templateId) {
            var isTemplate = templateId;

            if (isTemplate == null) {
                console.error("Mensaje de Clase Reserva - Inactivo" + bodyIn.establishmentName);
            } else {
                support.addLogs(bodyIn.userEstablishmentId, typeMail);
                isTemplate = isTemplate.replace("$gym", bodyIn.establishmentName);
                isTemplate = isTemplate.replace("$nombre", bodyIn.fullName);
                isTemplate = isTemplate.replace("$plan", bodyIn.planName);
                isTemplate = isTemplate.replace("$precio", bodyIn.plansPrice + "");
                isTemplate = isTemplate.replace("$inicio", bodyIn.startDate);
                isTemplate = isTemplate.replace("$fin", bodyIn.endDate);
                isTemplate = isTemplate.replace("$disciplina", bodyIn.disciplineName);
                isTemplate = isTemplate.replace("$hora", bodyIn.hourLesson);
                isTemplate = isTemplate.replace("$fecha", bodyIn.dateLesson);

                var body = {
                    personalizations: [{
                        to: [{
                            email: bodyIn.email
                        }],
                        subject: lang.lang['CONFIRM_LESSON'],
                    }],
                    from: {
                        email: 'no-reply@fitcoconnect.com',
                        name: bodyIn.establishmentName
                    },
                    content: [{
                        type: 'text/html',
                        value: isTemplate
                    }],

                };

                var request = sg.emptyRequest({
                    method: 'POST',
                    path: 'https://api.sendgrid.com/v3/mail/send',
                    body: body,
                    headers: headers
                });

                // With callback
                sg.API(request, function(error, response) {
                    if (error) {
                        console.error(error.response.body);
                    }
                });

            }
        })
        .catch(function(err) {
            console.error(err);
        })
}

module.exports = {
    scheduleSendEmial
}