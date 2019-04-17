'use strict'

const db = require('../database');
const sessionsMailer = require('../mailers/sessions.mailer');

function getMembershipsByUser(idUser, lessonRecordId) {
    return new Promise(function (result, reject) {
        let sentence = `select memberships.*, user_establishment.*, establishments.*, memberships.id mId,
        (select count(*) + (select count(*) from unpaid_record where unpaid_record.lessonRecordId = membership_lesson.lessonRecordId and unpaid_record.userEstablishmentId = ${idUser}) from membership_lesson where membership_lesson.lessonRecordId = ${lessonRecordId} and membership_lesson.membershipId = memberships.id) alradyAssist, plans.sessions planSessions,
        plans.typeSessions, 
        if(ISNULL((select plan_discipline.sessions from plan_discipline where plan_discipline.planId = plans.id and 
            plan_discipline.disciplineId = 
            (SELECT lesson_record.scheduleDisciplineId from lesson_record  where lesson_record.id = ${lessonRecordId}))), 0, 
            (select plan_discipline.sessions from plan_discipline where plan_discipline.planId = plans.id and 
            plan_discipline.disciplineId = 
            (SELECT lesson_record.scheduleDisciplineId from lesson_record  where lesson_record.id = ${lessonRecordId}))
            )
        sessionsDiscipline,

        (select count(*) from membership_lesson
        left join lesson_record on lesson_record.id = membership_lesson.lessonRecordId
        where membership_lesson.membershipId = memberships.id
        and lesson_record.scheduleDisciplineId = ${lessonRecordId}) as sessionUsedDiscipline,
        ${lessonRecordId} as lessonRecordId,
        if(date(memberships.startDate) = '0000-00-00' AND date(memberships.endDate) = '0000-00-00','1','0') as updateStartDate

        from memberships
        inner join user_establishment on user_establishment.id = memberships.userEstablishmentId
        inner join plans on plans.id = memberships.planId
        inner join establishments on establishments.id = user_establishment.establishmentId
        where memberships.userEstablishmentId = ${idUser}
        and (SELECT plan_discipline.disciplineId from plan_discipline where plan_discipline.planId = memberships.planId
        and plan_discipline.disciplineId = (select lesson_record.scheduleDisciplineId from  lesson_record
        where lesson_record.id = ${lessonRecordId}) ) and isNull(memberships.disDate) and (CONVERT_TZ(
        date((select lesson_record.dateLesson from lesson_record where lesson_record.id = ${lessonRecordId})), '+00:00', establishments.timezone) BETWEEN
        date(convert_tz(memberships.startDate - INTERVAL 1 DAY,'+00:00',establishments.timezone)) and date(convert_tz(memberships.endDate,'+00:00',establishments.timezone)) OR (date(memberships.startDate) = '0000-00-00' AND date(memberships.endDate) = '0000-00-00') ) 
        `;

        db.mysql.reader.query(sentence,
            function (err, rows) {
                if (err) {
                    return reject(err);
                } else {
                    return result(rows);
                }
            })

    });
};

function getUserEstablishment(id) {
    return new Promise(function (resolve, reject) {
        const sentence = `select memberships.userEstablishmentId from memberships where memberships.id = ${id}`;
        db.mysql.reader.query(sentence,
            function (err, rows) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(rows[0].userEstablishmentId);
                }
            });

    });
}

function updateAfterNewMembership(id) {
    return new Promise(function (resolve, reject) {
        var sentence = `call spUpdateStatusMembership(${id})`;
        db.mysql.writter.query(sentence,
            function (err, rows) {
                if (err) {
                    return reject(err)
                } else {
                    return resolve('OK');
                }
            });
    })
}

function updateStatusUserEstablishment(userEstablishmentId) {
    return new Promise(function (resolve, reject) {

        var sentence = '-';

        sentence = `update user_establishment set user_establishment.status =
        if((select count(*) from memberships where memberships.userEstablishmentId = ${userEstablishmentId} 
        and memberships.status = '1') > 0, '1', '0') 
        where user_establishment.id = ${userEstablishmentId}`;

        db.mysql.writter.query(sentence, function (err, rows) {
            if (err) {
                return reject({
                    msg: 'Error'
                });
            } else {
                return resolve('ok');

            }
        });
    });
}

function checkMembershipsSessionsToSendEmail(membership){
    return new Promise(function (resolve, reject) {
        const percentage = (membership.planSessions * config.sessionPercentage);
        const remainingSessions = (membership.planSessions - (membership.sessions + 1 ));

        if(remainingSessions == 0 ) {
            sessionsMailer.spendAllSessionsEmail(membership)
            return  resolve(200);
        }else if(remainingSessions < percentage && membership.sessionEmailSended == config.sended.no){
            sessionsMailer.lessSessionsThatThePercentage(membership)
            return  resolve(200);
        }else{
            return  resolve(200);
        }

    });
}

function getInfoForEmail(membershipId){
    return new Promise( (resolve,reject)=> {
        db.mysql.reader.query(`
        SELECT memb.planId, memb.sessions,
               plans.sessions, user.*, est.id AS establishmentId, 
               est.name AS establishmentName,
               plans.name AS planName,
               user.id AS userEstablishmentId
               
        FROM memberships memb 
            INNER JOIN user_establishment user ON memb.userEstablishmentId = user.id
            INNER JOIN establishments est ON est.id = memb.establishmentId 
            INNER JOIN plans ON plans.id = memb.planId
        WHERE memb.id = ${membershipId} AND ISNULL(memb.disDate) AND ISNULL(memb.disUser) `,(err,data)=>{
                if (err) {
                    reject(err);
                } else {
                    resolve(data[0]);
                }
            })
    });
}

function updateStatusSendedEmail(membershipId){
    return new Promise( (resolve,reject)=> {
        db.mysql.writter.query(`
        UPDATE memberships 
        SET sessionEmailSended = '${config.sended.yes}'
        WHERE memberships.id = ${membershipId} `,(err,data)=>{
                if (err) {
                    console.log(' err ' + err)
                    reject(err);
                } else {
                    resolve(data);
                }
            })
    });
}

module.exports = {
    getMembershipsByUser,
    getUserEstablishment,
    updateAfterNewMembership,
    updateStatusUserEstablishment,
    checkMembershipsSessionsToSendEmail,
    getInfoForEmail,
    updateStatusSendedEmail
}