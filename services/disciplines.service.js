'use strict'

const db = require('../database');
const services = require('../services');
const config = require('../bin/config');

function getServiceByPersonal(data) {
    return new Promise(function (resolve, reject) {
        const id = data.id
        const status = data.status;
        const sentence = `select disciplines.* from user_establishment
        inner join personal_discipline on personal_discipline.userEstablishmentId = user_establishment.id
        inner join disciplines on disciplines.id = personal_discipline.disciplineId
        where disciplines.type = '1' and user_establishment.id = ${id}
        ${status ? ` and disciplines.status = '${status}' ` : ''}
        group by disciplines.id;`;
        db.mysql.reader.query(sentence, function (err, rows) {
            if (err) {
                return reject(err);
            } else {
                return resolve(rows);
            }
        });
    });
}

function getServiceByLesson(data) {
    return new Promise(function (resolve, reject) {
        const id = data.id;
        const sentence = `select disciplines.* from lessons 
        inner join lesson_discipline on lesson_discipline.lessonId = lessons.id
        inner join disciplines on disciplines.id = lesson_discipline.disciplineId
        where disciplines.type = '1' and lessons.id = ${id}
        group by disciplines.id;`;
        dbReader.query(sentence, function (err, rows) {
            if (err) {
                return reject(err);
            } else {
                return resolve(rows);
            }
        });
    });
}

function getServicesByDay(data) {
    return new Promise(function (resolve, reject) {
        const id = data.id;
        const date = data.startDate;
        const time = data.time;
        const sentence = ` 
        select lessons.*, 
            disciplines.name as name, 
            disciplines.price, 
            disciplines.id as serviceId, 
            disciplines.time,
            (SELECT GROUP_CONCAT(disciplines.id SEPARATOR ', ')
            FROM disciplines
                INNER JOIN lesson_discipline ON disciplines.id = lesson_discipline.disciplineId
            WHERE lesson_discipline.lessonId = lessons.id order by disciplines.id) disciplinesId 
        from lessons inner join lesson_discipline on lesson_discipline.lessonId = lessons.id
        inner join disciplines on disciplines.id = lesson_discipline.disciplineId
        where date('${date}') BETWEEN lessons.startDate and lessons.untilDate
        ${time ? `and ADDTIME(time('${date}'),'00:00:01') BETWEEN lessons.startTime and lessons.endTime and  ADDTIME(time('${date}'),disciplines.time) <= lessons.endTime
        and 	(select count(*) from lesson_record where lesson_record.lessonId = lessons.id
        and date(lesson_record.dateLesson) = date('${date}')
        and ADDTIME(time('${date}'),'00:00:01') BETWEEN lesson_record.startTime and lesson_record.endTime
        and (if(ISNULL((select count(*) from membership_lesson where membership_lesson.lessonRecordId = lesson_record.id)), 0 , 
        (select count(*) from membership_lesson where membership_lesson.lessonRecordId = lesson_record.id)) > 0 or
    if(ISNULL((select count(*) from unpaid_record where unpaid_record.lessonRecordId = lesson_record.id)),0,
    (select count(*) from unpaid_record where unpaid_record.lessonRecordId = lesson_record.id)) > 0)) < 1
    and (select count(*) from lesson_record where lesson_record.lessonId = lessons.id
    and date(lesson_record.dateLesson) = date('${date}')
    and ADDTIME(time('${date}'),disciplines.time) > lesson_record.startTime and ADDTIME(time('${date}'),disciplines.time) <= lesson_record.endTime
    and (if(ISNULL((select count(*) from membership_lesson where membership_lesson.lessonRecordId =          lesson_record.id)), 0 , 
    (select count(*) from membership_lesson where membership_lesson.lessonRecordId = lesson_record.id)) > 0 or
    if(ISNULL((select count(*) from unpaid_record where unpaid_record.lessonRecordId = lesson_record.id)),0,
    (select count(*) from unpaid_record where unpaid_record.lessonRecordId = lesson_record.id)) > 0)) < 1

        ` : ``}
        and lessons.establishmentId = ${id} and lessons.type = '1'
        and SUBSTRING(lessons.days, DAYOFWEEK('${date}') * 2, 1) = '1'
        group by disciplines.id
        `;

        db.mysql.reader.query(sentence, function (err, rows) {
            if (err) {
                return reject(err);
            } else {
                return resolve(rows);
            }
        });
    });
}

function getServiceInstructorByDay(data) {
    return new Promise(function (resolve, reject) {
        const groupBy = data.group == 1 ? data.group : '0';
        const addTime = data.time == true ? true : false;
        let showOnApp = data.admin == false ? ` AND lessons.showOnApp = '1'` : ``
 
        let sql = `select lessons.id, disciplines.name as name, disciplines.price, disciplines.id as serviceId,
                        lessons.referenceInstructor as intructorId, lessons.startTime, lessons.endTime,
                        (select CONCAT(user_establishment.name, ' ', user_establishment.lastName) from user_establishment
                        where user_establishment.id = lessons.referenceInstructor)  as instructorName,
                        lessons.referenceOcupancy ocupancy, 
                        lessons.referenceRoomId as roomId,
                        rooms.name as 'roomName'
                        from lessons 
                        inner join lesson_discipline on lesson_discipline.lessonId = lessons.id
						inner join disciplines on disciplines.id = lesson_discipline.disciplineId
                        inner join rooms on lessons.referenceRoomId = rooms.id
                        where date('${data.date}') BETWEEN lessons.startDate and lessons.untilDate
                        and lessons.establishmentId = ${data.establisment} and lessons.type = '1'
                        and SUBSTRING(lessons.days, DAYOFWEEK('${data.date}') * 2, 1) = '1'
                        and lesson_discipline.disciplineId = ${data.serviceId}  
                            ${showOnApp}
                        `;
        sql = addTime ? sql + ` and ADDTIME(time('${data.date}'),'00:00:01') BETWEEN
         lessons.startTime and lessons.endTime  
         and (SELECT count(*) FROM lesson_record lr WHERE lr.lessonId =  lessons.id 
         and date(lr.dateLesson) = date('${data.date}')
										AND ADDTIME(time('${data.date}'),'00:00:01') BETWEEN
                                 lr.startTime and lr.endTime
         						AND 
						 	((select count(membership_lesson.id)
                     from membership_lesson where membership_lesson.lessonRecordId = lr.id AND membership_lesson.status <> '3' )
                     + (select count(unpaid_record.id) from unpaid_record where unpaid_record.lessonRecordId = lr.id)) > 0
						 
         						) < 1
         ` : sql;

        const sentence = groupBy == '1' ? sql + ` group by lessons.referenceInstructor` : sql;
   
        db.mysql.reader.query(sentence, function (err, rows) {
            if (err) {
                return reject(err);
            } else {
                return resolve(rows);
            }
        });
    });
}

module.exports = {
    getServiceByPersonal,
    getServiceByLesson,
    getServicesByDay,
    getServiceInstructorByDay
}