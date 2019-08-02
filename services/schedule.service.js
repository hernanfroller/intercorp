'use strict'

const db = require('../database');
const moment = require('moment');
const services = require('../services');

function setDayLockPromise(data) {
    return new Promise(function (result, reject) {
        const establishmentId = data.establishmentId,
              fromDate = data.fromDate,
              toDate = data.toDate,
              allDay = data.allDay,
              repeatOption = data.repeatOption,
              eachOption = data.eachOption ? data.eachOption : null,
              eachNumber = data.eachNumber ? data.eachNumber : null,
              inDay = data.inDay ? data.inDay : null,
              forever = data.forever ? data.forever : null,
              finishDate = data.finishDate ? data.finishDate : null,
              insUser = data.insUser;

        const query = `CALL SET_CALENDAR_DAYLOCK(NULL, ${establishmentId}, '${fromDate}', '${toDate}', ${allDay}, ${repeatOption}, ${eachOption}, ${eachNumber}, '${inDay}', ${forever}, '${finishDate}', ${insUser});`;
        
        db.mysql.writter.query(query, function (err, rs) {
            if (err) {
                return reject({status: false, result: err});
            } else {
                return result({status: true, result: rs});
            }
        });
    });
}

function updDayLockPromise(data) {
    return new Promise(function (result, reject) {
        const id = data.id ? data.id : null,
              fromDate = data.fromDate ? data.fromDate : null,
              toDate = data.toDate ? data.toDate : null,
              allDay = data.allDay ? data.allDay : null,
              repeatOption = data.repeatOption ? data.repeatOption : null,
              eachOption = data.eachOption ? data.eachOption : null,
              eachNumber = data.eachNumber ? data.eachNumber : null,
              inDay = data.inDay ? data.inDay : null,
              forever = data.forever ? data.forever : null,
              finishDate = data.finishDate ? data.finishDate : null,
              updUser = data.updUser;

        const query = `CALL UPD_CALENDAR_DAYLOCK(${id}, '${fromDate}', '${toDate}', ${allDay}, ${repeatOption}, ${eachOption}, ${eachNumber}, '${inDay}', ${forever}, '${finishDate}', ${updUser});`;

        db.mysql.writter.query(query, function (err, rs) {
            if (err) {
                return reject({status: false, result: err});
            } else {
                return result({status: true, result: rs});
            }
        });
    });
}

function delDayLockForDatePromise(data) {
    return new Promise(function (result, reject) {
        const id = data.id,
              status = data.status,
              disUser = data.disUser;

        const query = `CALL STATUS_CALENDAR_DAYLOCK(${id}, ${status}, ${disUser});`;

        db.mysql.writter.query(query, function (err, rs) {
            if (err) {
                return reject({status: false, result: err});
            } else {
                return result({status: true, result: rs});
            }
        });
    });
}

function getDayLockPromise(data) {
    return new Promise(function (result, reject) {
        const id = data.id;

        const query = `CALL SEL_CALENDAR_DAYLOCK_BY_ID(${id});`;

        db.mysql.reader.query(query, function (err, rs) {
            if (err) {
                return reject({status: false, result: err});
            } else {
                return result({status: true, result: rs});
            }
        });
    });
}

function getDayLockForDatePromise(data) {
    return new Promise(function (result, reject) {
        const establishmentId = data.establishmentId,
              fromDate = data.fromDate,
              toDate = data.toDate;

        const query = `CALL SEL_CALENDAR_DAYLOCK_BY_DATE_RANGE(${establishmentId}, ${fromDate}, ${toDate});`;

        db.mysql.reader.query(query, function (err, rs) {
            if (err) {
                return reject({status: false, result: err});
            } else {
                return result({status: true, result: rs});
            }
        });
    });
}

function calculateEnabledLessons(data) {
    return new Promise(function (resolve, reject) {
        const from = data.from == 'app' ? data.from : 'fitco';
        let listEnables = [];
        const dateFormat = 'yyyy-MM-dd HH:mm:ss';
        const start = moment(data.date + ' ' + data.lesson.startTime, dateFormat);
        const end = moment(data.date + ' ' + data.lesson.endTime, dateFormat);
        let lastTime = start;
        const allBlock = end.diff(start, 'minutes');
        do {
            const time = data.lesson.time;
            if (from == 'app') {
                listEnables.push({
                    start: data.date + ' ' + lastTime.format('HH:mm:ss'),
                    end: data.date + ' ' + lastTime.clone().add(moment.duration(time, 'HH:mm:ss').asMinutes(), 'minutes').format('HH:mm:ss'),
                    disciplineId: data.lesson.serviceId,
                    disciplineName: data.lesson.name,
                    instructorId: data.lesson.intructorId,
                    instructorName: data.lesson.instructorName,
                    occupancy: data.lesson.ocupancy,
                    roomName: data.lesson.roomName,
                    lessonId: data.lesson.id,
                    romId: data.lesson.romId
                });
            } else {
                listEnables.push({
                    startTime: lastTime.format('HH:mm:ss'),
                    endTime: lastTime.clone().add(moment.duration(time, 'HH:mm:ss').asMinutes(), 'minutes').format('HH:mm:ss')
                });
            }
            lastTime = lastTime.clone().add(moment.duration(time, 'HH:mm:ss').asMinutes(), 'minutes');
            if (lastTime >= end) {
                break;
            }

        } while (true);

        if (listEnables.length < 1) {
            return reject(err);
        } else {

            data.listEnables = listEnables;
            services.lessons.getLessonRecordByTime(data)
                .then(lessonRecord => {
                    let listFinal = [];
            
                    for (let lr in lessonRecord) {
                        const data = lessonRecord.length > 1 ? lessonRecord[lr][0] : lessonRecord[lr];
                        if (lessonRecord.length > 0) {
                            if (lessonRecord[lr].count < 1) {
                                if (from == 'app') {
                                    listEnables[lr].reserves = lessonRecord[lr].reserves;
                                    listEnables[lr].lessonRecordId = lessonRecord[lr].lessonRecordId;
                                }
                                listFinal.push(listEnables[lr]);
                            } else if (data.count < 1 || data.reserves < data.occupancy) {
                                if (from == 'app') {
                                    listEnables[lr].reserves = data.reserves;
                                    listEnables[lr].lessonRecordId = data.lessonRecordId;
                                    listFinal.push(listEnables[lr]);
                                } else {
                                    listFinal.push(listEnables[lr]);
                                }
                            }



                        }
                    }
    
                    return resolve(listFinal);
                })
                .catch(e => {
                    console.error(e);
                    return reject(e);
                });
        }
    });
}

function getDisciplines(id, params, callBy, status, cbp) {
    return new Promise(function (result, reject) {
        let sentence = `
            select disciplines.id AS id,disciplines.type  AS type,disciplines.name AS name,disciplines.description AS description,
                disciplines.establishmentId AS establishmentId,disciplines.status AS status,disciplines.byDefault AS byDefault,
                    disciplines.color AS color,date_format(disciplines.insDate,'%d-%m-%Y') AS insDate,
                        disciplines.insUser AS insUser,disciplines.updDate AS updDate,disciplines.updUser AS updUser,
                            disciplines.disDate AS disDate,disciplines.disUser AS disUser,
                                establishments.name AS establishmentName,plan_discipline.planId AS planId,
                                    plan_discipline.sessions AS sessions, disciplines.time as time, disciplines.price as price
                                        from disciplines join establishments on establishments.id = disciplines.establishmentId
                                            left join plan_discipline on plan_discipline.disciplineId = disciplines.id
                                            WHERE establishments.id IN (${id}) and (ISNULL(disciplines.disUser) or ISNULL(disciplines.disDate)) ${status == 'ALL' ? '' : status ? `
                                            and disciplines.status = '${status}'` : ''}
                            `;

        if (params.typeD.toUpperCase() == 'ALL') {
            sentence = sentence + `group by disciplines.id order by disciplines.${params.orderby} ${params.order}`;
        } else {
            sentence = sentence + ` AND disciplines.type = '${params.typeD}'
                                                    group by disciplines.id order by disciplines.${params.orderby} ${params.order}`;

        }

        if (params.cbp != "all" && params.cbp != "ALL") {
            sentence = sentence + ` limit ${params.cbp} OFFSET ${(params.cbp * (params.page - 1))} `;
        }

        db.mysql.reader.query(sentence, function (err, rows) {
            if (err) {
                return reject({
                    msg: "GLOBAL.ERROR_DB",
                    title: "ERROR_DB_BODY"
                });
            } else {
                if (cbp == 'ALL' || cbp == 'all') {
                    return result(rows);
                } else {
                    getCountAll(id, callBy, params.typeD, status).then((result) => {
                        res.setHeader("X-Item", rows.length);
                        res.setHeader("X-Total-Item", result);
                        res.setHeader("X-Offset", params.cbp * (params.page - 1));
                        res.setHeader("X-Page", params.page);
                        res.setHeader("Access-Control-Expose-Headers", "X-Item, x-Total-Item, X-Offset, X-Page, X-To ");
                        res.json(rows);
                    }).catch((err) => {
                        return reject(err);
                    })
                }
            }
        });
    });
}

function getCountAll(id, callBy, type, stauts) {
    return new Promise(function (resolve, reject) {
        var sentence = "";
        type = type == '0' ? '0' : '1';
        if (callBy == "byEstablishment") {
            sentence = `select count(*) count from disciplines where  (ISNULL(disciplines.disUser) or ISNULL(disciplines.disDate))  and disciplines.establishmentId IN (${id})
            and disciplines.type = '${type}'
            ${stauts !== 'ALL' ? ` and disciplines.status = '${stauts}' ` : ''}`;

        } else if (callBy == "byOrganization") {

            sentence = `select count(*) count from disciplines where  (ISNULL(disciplines.disUser) or ISNULL(disciplines.disDate))  and disciplines.establishmentId IN ${id}
            and disciplines.type = '${type}' 
            ${stauts ? ` and disciplines.status = '${stauts}' ` : ''}`;
        }


        db.mysql.reader.query(sentence,
            function (err, rows) {
                if (err) {
                    return reject(err)
                }
                return resolve(rows[0].count);
            });
    })
}

function getLessonInstructorsForApp(data) {
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

function getLessonInstructorsForApp(data) {
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

function getServiceLessonsForApp(lessons, serviceId, date) {
    return new Promise(function (result, reject) {
        var dataFinal = [];
        let promises = [];
        for (let lesson of lessons) {
            promises.push(getLessonById(lesson.id, serviceId));
        }
        Promise.all(promises).then(listLesson => {
            let promisesCalculate = [];
            for (const lesn of listLesson) {
                let lesson_data = {
                    lesson: lesn,
                    date: date,
                    lessonId: lesn.id,
                    from: 'app'
                };
                promisesCalculate.push(calculateEnabledLessons(lesson_data));
            }
            Promise.all(promisesCalculate).then(lesson_availability => {
                for (let la of lesson_availability) {
                    for (let i = 0; i < la.length; i++) {
                        dataFinal.push(la[i]);
                    }
                }
                return result(dataFinal);
            }).catch(e => {
                return reject(e);
            })
        }).catch(err => {
            return reject(err);
        });
    });
}

function getLessonById(id, service) {
    return new Promise(function (resolve, reject) {
        let auxSentence = '';
        if (service != undefined) {
            auxSentence = `and lesson_discipline.disciplineId = ${service}`;
        }
        const sentence = `        select lessons.id, disciplines.name as name, disciplines.price, disciplines.id as serviceId,
        lessons.referenceInstructor as intructorId, lessons.startTime, lessons.endTime,
        (select CONCAT(user_establishment.name, ' ', user_establishment.lastName) from user_establishment
        where user_establishment.id = lessons.referenceInstructor)  as instructorName,
        lessons.referenceOcupancy ocupancy, 
        lessons.referenceRoomId as roomId,
        rooms.name as 'roomName',
        rooms.id as 'romId',
        disciplines.time
        from lessons
        inner join lesson_discipline on lesson_discipline.lessonId = lessons.id 
        inner join disciplines on disciplines.id = lesson_discipline.disciplineId
        inner join rooms on lessons.referenceRoomId = rooms.id
        where lessons.id = ${id}  ` + auxSentence;
    ;
        db.mysql.reader.query(sentence,
            function (err, rows) {
                if (err) {
                   
                    return reject(err);
                } else {
                    if (rows.length > 0) {
                        return resolve(rows[0]);
                    } else {
                        return reject({
                            msg: 'No hay'
                        });
                    }
                }
            }
        );
    });
}

function calculateEnabledLessons(data) {
    return new Promise(function (resolve, reject) {
        const from = data.from == 'app' ? data.from : 'fitco';
        let listEnables = [];
        const dateFormat = 'yyyy-MM-dd HH:mm:ss';
        const date = moment(data.date).format('YYYY-MM-DD');
        const start = moment(date + ' ' + data.lesson.startTime);
        const end = moment(date + ' ' + data.lesson.endTime);
        let lastTime = start;
        const allBlock = end.diff(start, 'minutes');

        getDayLockByLesson(data.lessonId).then(daylocks => {

            do {
                const time = data.lesson.time;
                let lessonStartDate = from == 'app' ? moment(data.date + ' ' + lastTime.format('HH:mm:ss')) : lastTime;
                let lessonEndDate = from == 'app' ? moment(data.date + ' ' + lastTime.clone().add(moment.duration(time, 'HH:mm:ss').asMinutes(), 'minutes').format('HH:mm:ss')) : lastTime.clone().add(moment.duration(time, 'HH:mm:ss').asMinutes(), 'minutes');
                let das = daylocks.result.find(daylock => (lessonStartDate.isSame(moment(daylock.fromDate).subtract(5, 'hours')) || lessonEndDate.isSame(moment(daylock.toDate).subtract(5, 'hours'))) || 
                                                            lessonStartDate.isBetween(moment(daylock.fromDate).subtract(5, 'hours'), moment(daylock.toDate).subtract(5, 'hours')) || lessonEndDate.isBetween(moment(daylock.fromDate).subtract(5, 'hours'), moment(daylock.toDate).subtract(5, 'hours')) ||
                                                            moment(daylock.fromDate).subtract(5, 'hours').isBetween(lessonStartDate, lessonEndDate) || moment(daylock.toDate).subtract(5, 'hours').isBetween(lessonStartDate, lessonEndDate));
                if (from == 'app') {
                    if (typeof das == 'undefined') {
                        listEnables.push({
                            start: data.date + ' ' + lastTime.format('HH:mm:ss'),
                            end: data.date + ' ' + lastTime.clone().add(moment.duration(time, 'HH:mm:ss').asMinutes(), 'minutes').format('HH:mm:ss'),
                            disciplineId: data.lesson.serviceId,
                            disciplineName: data.lesson.name,
                            instructorId: data.lesson.intructorId,
                            instructorName: data.lesson.instructorName,
                            occupancy: data.lesson.ocupancy,
                            roomName: data.lesson.roomName,
                            lessonId: data.lesson.id,
                            romId: data.lesson.romId
                        });
                    }
                } else {
                    if (typeof das == 'undefined') {
                        listEnables.push({
                            startTime: lastTime.format('HH:mm:ss'),
                            endTime: lastTime.clone().add(moment.duration(time, 'HH:mm:ss').asMinutes(), 'minutes').format('HH:mm:ss')
                        });
                    }
                }
                lastTime = lastTime.clone().add(moment.duration(time, 'HH:mm:ss').asMinutes(), 'minutes');
                if (lastTime >= end) {
                    break;
                }
    
            } while (true);
    
            let sentenceLessonRecord = ``;
            if (listEnables.length < 1) {
                return resolve(listEnables);
            } else {
    
                for (let times of listEnables) {
                    sentenceLessonRecord =
                        sentenceLessonRecord +
                        `  select lesson_record.id as lessonRecordId, count(*) as count,
                        if(lesson_record.id is null,0,((select count(membership_lesson.id)
                         from membership_lesson where membership_lesson.lessonRecordId = lesson_record.id AND membership_lesson.status <> '3' )
                         + (select count(unpaid_record.id) from unpaid_record where unpaid_record.lessonRecordId = lesson_record.id)))  as reserves,
                         lesson_record.occupancy as occupancy
                        from lesson_record
                        where lesson_record.lessonId = ${data.lessonId}
                        and date(lesson_record.dateLesson) = '${data.date}'
                        and ADDTIME(time('${from == 'app' ? times.start : times.startTime}'), '00:00:01') BETWEEN lesson_record.startTime and lesson_record.endTime
                   
                        ;`;
                }
               
                getLessonRecordByTimeForApp(sentenceLessonRecord)
                    .then(lessonRecord => {
                        let listFinal = [];
    
                        for (let lr in lessonRecord) {
                            const data = lessonRecord.length > 1 ? lessonRecord[lr][0] : lessonRecord[lr];
                            if (lessonRecord.length > 0) {
                                if (lessonRecord[lr].count < 1) {
                                    if (from == 'app') {
                                        listEnables[lr].reserves = lessonRecord[lr].reserves;
                                        listEnables[lr].lessonRecordId = lessonRecord[lr].lessonRecordId;
                                    }
                                    listFinal.push(listEnables[lr]);
                                } else if (data.count < 1 || data.reserves < data.occupancy) {
                                    if (from == 'app') {
                                        listEnables[lr].reserves = data.reserves;
                                        listEnables[lr].lessonRecordId = data.lessonRecordId;
                                        listFinal.push(listEnables[lr]);
                                    } else {
                                        listFinal.push(listEnables[lr]);
                                    }
                                }
    
    
    
                            }
                        }
        
                        return resolve(listFinal);
                    })
                    .catch(e => {
                        return reject(e);
                    });
            }
        });
    });
}

function getDayLockByLesson(lessonId) {
    return new Promise(function (result, reject) {

        const query = `SELECT * FROM calendar_dayLock WHERE establishmentId = (SELECT establishmentId FROM lessons WHERE id = ${lessonId}) AND status = 1 AND DATE(FROMDATE) BETWEEN (SELECT startDate FROM lessons WHERE id = ${lessonId}) AND (SELECT untilDate FROM lessons WHERE id = ${lessonId})`;

        db.mysql.reader.query(query, function (err, rs) {
            if (err) {
                return reject({status: false, result: err});
            } else {
                return result({status: true, result: rs});
            }
        });
    });
}

function getLessonRecordByTimeForApp(sentence) {
    return new Promise(function (resolve, reject) {

     
        db.mysql.reader.query(sentence, function (err, rows) {
            if (err) {
                return reject(err);
            } else {
                if (rows.length > 0) {

                    return resolve(rows);
                } else {
                    return reject({
                        msg: 'No hay'
                    });
                }
            }
        });
    });
}

module.exports = {
    setDayLockPromise,
    updDayLockPromise,
    delDayLockForDatePromise,
    getDayLockPromise,
    getDayLockForDatePromise,
    calculateEnabledLessons,
    getDisciplines,
    getLessonInstructorsForApp,
    getServiceLessonsForApp
}