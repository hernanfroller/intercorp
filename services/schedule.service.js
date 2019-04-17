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

module.exports = {
    setDayLockPromise,
    updDayLockPromise,
    delDayLockForDatePromise,
    getDayLockPromise,
    getDayLockForDatePromise,
    calculateEnabledLessons
}