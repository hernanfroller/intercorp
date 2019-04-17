const services = require('../services');
const config = require('../bin/config');
const sg = require('sendgrid')(config.environment.SEND_GRID.key);

async function  spendAllSessionsEmail(body){
    if (config.environment.SEND_GRID.active) {
        try {
            const typeEmailId = config.constants.AUTOMATIC_EMAIL_TYPE.SESSIONS_FINISHED;
            let template = await services.mailer.getTemplateId(body.establishmentId, typeEmailId)
            if(services.transversal.ifNotNull(template)){

                let info = await services.memberships.getInfoForEmail(body.membershipId);

                if(info){
                    let infoEmail = info;
                    services.mailer.addLogs(infoEmail.userEstablishmentId, typeEmailId);
                    if (template.indexOf('$gym') !== -1) {
                        template = template.replace('$gym', infoEmail.establishmentName);
                    }
                    while (template.indexOf('[$gym$]') !== -1) {
                        template = template.replace('[$gym$]', infoEmail.establishmentName);
                    }
                    template = template.replace("$nombre", infoEmail.name);
                    template = template.replace("$plan", infoEmail.planName);
                    
                    const emailBody = {
                        personalizations: [{
                            to: [{
                                email: infoEmail.email
                            }],
                            subject: config.constants.STR_NOT_SESSIONS_NOTIFICATION,
                        }],
                        from: {
                            email: config.constants.MAILER_SENDER,
                            name: infoEmail.establishmentName
                        },
                        content: [{
                            type: 'text/html',
                            value: template
                        }],

                    };
                    const request = sg.emptyRequest({
                        method: 'POST',
                        path: config.environment.SEND_GRID.url,
                        body: emailBody,
                        headers
                    });
                    const sendgridResquest = await sg.API(request);
                }
            }
        } catch (error) {
            services.mailer.addErrorLog({
                tittle: 'SEND',
                file: dirName,
                description: error,
                funtionName: 'spendAllSessionsEmail',
                establishmentId: body.establishmentId
            })
        }
    }
}

async function lessSessionsThatThePercentage(body){

    if (config.environment.SEND_GRID.active) {
        try {
   
            const typeEmailId = config.constants.AUTOMATIC_EMAIL_TYPE.SESSIONS_TO_FINISH;
            let template = await services.mailer.getTemplateId(body.establishmentId, typeEmailId)
            if(template != null){
          
                let info = await services.memberships.getInfoForEmail(body.membershipId);
                if(info){
                    let infoEmail = info;
                    services.mailer.addLogs(infoEmail.userEstablishmentId, typeEmailId);
                    if (template.indexOf('$gym') !== -1) {
                        template = template.replace('$gym', infoEmail.establishmentName);
                    }
                    while (template.indexOf('[$gym$]') !== -1) {
                        template = template.replace('[$gym$]', infoEmail.establishmentName);
                    } 
                    template = template.replace("$percentage", (config.constants.SESSION_PERCENT * 100));
                    template = template.replace("$nombre", infoEmail.name);
                    template = template.replace("$plan", infoEmail.planName);
                   
                    const emailBody = {
                        personalizations: [{
                            to: [{
                                email: infoEmail.email
                            }],
                            subject: config.constants.STR_NOT_SESSIONS_NOTIFICATION,
                        }],
                        from: {
                            email: config.constants.MAILER_SENDER,
                            name: infoEmail.establishmentName
                        },
                        content: [{
                            type: 'text/html',
                            value: template
                        }],

                    };
                    const request = sg.emptyRequest({
                        method: 'POST',
                        path: config.sendgridUrl,
                        body: emailBody,
                        headers
                    });
        
                    const sendgridResquest = await sg.API(request);
                    services.memberships.updateStatusSendedEmail(body.membershipId);
               
                }
            }
        } catch (error) {
            services.mailer.addErrorLog({
                tittle: 'SEND',
                file: dirName,
                description: error,
                funtionName: 'lessSessionsThatThePercentage',
                establishmentId: body.establishmentId
            })
        }
    }

}

module.exports = {
    spendAllSessionsEmail,
    lessSessionsThatThePercentage
}