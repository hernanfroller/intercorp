'use strict'

const db = require('../database');
const services = require('../services');
const config = require('../bin/config');

function validLessonBeforeToCreatePromise(body) {
    return new Promise(function (resolve, reject) {
        const sentence = `select lessons.* from lessons
    where lessons.referenceInstructor = ${body.instructorId} and
    (ADDTIME(time('${body.endTime}'),'00:00:01') BETWEEN lessons.startTime and lessons.endTime or
    ADDTIME(time('${body.endTime}'),'-00:00:01') BETWEEN lessons.startTime and lessons.endTime )
    and ('${body.startDate}'BETWEEN lessons.startDate and lessons.untilDate
    or '${body.untilDate}'BETWEEN lessons.startDate and lessons.untilDate )`;
        dbReader.query(sentence,
            function (err, rows) {
                if (err) {
                    return reject({
                        status: false,
                        err: err
                    })
                }
                if (rows.length < 1) {
                    return resolve({
                        status: true
                    });
                } else {
                    const newDays = JSON.parse(body.days);
                    let can = true;
                    for (let les of rows) {
                        const oldays = JSON.parse(les.days);
                        for (d in oldays) {
                            if (oldays[d] == 1 && newDays[d] == 1) {
                                can = false;
                            }
                        }
                    }
                    if (can) {
                        return resolve({
                            status: true
                        });
                    } else {
                        return reject({
                            status: false,
                            err: 'NOT'
                        });
                    }
                }
            });
    })
}

function setLesson(req, res, next) {
    const lesson = {
        disciplineId: req.body.serviceId,
        establishmentId: req.body.establishmentId,
        special: req.body.special,
        days: req.body.days,
        insUser: req.body.insUser,
        startDate: req.body.startDate,
        untilDate: req.body.untilDate ? req.body.untilDate : req.body.startDate,
        startTime: req.body.startTime, //campo referencial para editar,
        endTime: req.body.endTime, //campo referencial para editar,
        type: req.body.type ? req.body.type : '0',
        referenceInstructor: req.body.instructorId,
        referenceRoomId: req.body.referenceRoomId,
        referenceOcupancy: req.body.referenceOcupancy,
        showOnApp: req.body.showOnApp
    };
    const disciplines = req.body.disciplines;
    validLessonBeforeToCreatePromise(req.body).then(validResp => {
        supportSchedule.addLesson(lesson)
            .then(function (lessonResp) {
                supportSchedule.addLessonDisciplines(disciplines, lessonResp.insertId).then(
                    lessonDisciplines => {
                        res.status(200);
                        return res.json({
                            msg: 'GLOBAL.OK',
                            title: 'GLOBAL.EXITO'
                        });
                    }
                ).catch(err => {
                    res.status(400);
                    res.json({
                        msg: 'GLOBAL.ERROR',
                        title: 'GLOBAL.ERROR_TITULO'
                    });
                });
            })
            .catch(function (err) {
                res.status(400);
                res.json({
                    msg: 'GLOBAL.ERROR',
                    title: 'GLOBAL.ERROR_TITULO'
                });
            });
    }).catch(err => {
        if (err.err == 'NOT') {
            res.status(400);
            res.json({
                msg: 'GLOBAL.ERROR',
                title: 'GLOBAL.ERROR.LESSON_ALREADY'
            });
        } else {
            res.status(400);
            res.json({
                msg: 'GLOBAL.ERROR',
                title: 'GLOBAL.ERROR_TITULO'
            });
        }
    });
};

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

function setDayLock (req, res, next) {
    setDayLockPromise(req.body)
        .then(dayLock => {
            if (dayLock.status) {
                res.status(200);
                return res.json({
                    msg: 'GLOBAL.OK',
                    title: 'GLOBAL.EXITO'
                });
            } else {
                res.status(400);
                return res.json({
                    msg: 'GLOBAL.ERROR',
                    title: 'GLOBAL.NO_SCHEDULE',
                    msgApp: 'SCHEDULE.THERE_ARE_NOT'
                });
            }

        })
        .catch(err => {
            console.error('err ', err);
            res.status(400);
            return res.json({
                msg: 'GLOBAL.ERROR',
                title: 'GLOBAL.ERROR_TITULO'
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

        db.query(query, function (err, rs) {
            if (err) {
                return reject({status: false, result: err});
            } else {
                return result({status: true, result: rs});
            }
        });
    });
}

function updDayLock (req, res, next) {
    updDayLockPromise(req.body)
        .then(dayLock => {
            if (dayLock.status) {
                res.status(200);
                return res.json({
                    msg: 'GLOBAL.OK',
                    title: 'GLOBAL.EXITO'
                });
            } else {
                res.status(400);
                return res.json({
                    msg: 'GLOBAL.ERROR',
                    title: 'GLOBAL.NO_SCHEDULE',
                    msgApp: 'SCHEDULE.THERE_ARE_NOT'
                });
            }

        })
        .catch(err => {
            res.status(400);
            return res.json({
                msg: 'GLOBAL.ERROR',
                title: 'GLOBAL.ERROR_TITULO'
            });
        });
}

function delDayLockForDatePromise(data) {
    return new Promise(function (result, reject) {
        const id = data.id,
              status = data.status,
              disUser = data.disUser;

        const query = `CALL STATUS_CALENDAR_DAYLOCK(${id}, ${status}, ${disUser});`;

        db.query(query, function (err, rs) {
            if (err) {
                return reject({status: false, result: err});
            } else {
                return result({status: true, result: rs});
            }
        });
    });
}

function delDayLockForDate (req, res, next) {
    
    delDayLockForDatePromise(req.body)
        .then(dayLock => {
            if (dayLock.status) {
                res.status(200);
                return res.json({
                    msg: 'GLOBAL.OK',
                    title: 'GLOBAL.EXITO'
                });
            } else {
                res.status(400);
                return res.json({
                    msg: 'GLOBAL.ERROR',
                    title: 'GLOBAL.NO_SCHEDULE',
                    msgApp: 'SCHEDULE.THERE_ARE_NOT'
                });
            }

        })
        .catch(err => {
            console.error('err ', err);
            res.status(400);
            return res.json({
                msg: 'GLOBAL.ERROR',
                title: 'GLOBAL.ERROR_TITULO'
            });
        });
}

function getDayLockPromise(data) {
    return new Promise(function (result, reject) {
        const id = data.id;

        const query = `CALL SEL_CALENDAR_DAYLOCK_BY_ID(${id});`;

        db.query(query, function (err, rs) {
            if (err) {
                return reject({status: false, result: err});
            } else {
                return result({status: true, result: rs});
            }
        });
    });
}

function getDayLock (req, res, next) {

    getDayLockPromise(req.params)
        .then(dayLock => {
            if (dayLock.status) {
                res.status(200);
                return res.json({
                    msg: 'GLOBAL.OK',
                    title: 'GLOBAL.EXITO',
                    data: dayLock.result
                });
            } else {
                res.status(400);
                return res.json({
                    msg: 'GLOBAL.ERROR',
                    title: 'GLOBAL.NO_SCHEDULE',
                    msgApp: 'SCHEDULE.THERE_ARE_NOT'
                });
            }

        })
        .catch(err => {
            console.error('err ', err);
            res.status(400);
            return res.json({
                msg: 'GLOBAL.ERROR',
                title: 'GLOBAL.ERROR_TITULO'
            });
        });
}

function getDayLockForDatePromise(data) {
    return new Promise(function (result, reject) {
        const establishmentId = data.establishmentId,
              fromDate = data.fromDate,
              toDate = data.toDate;

        const query = `CALL SEL_CALENDAR_DAYLOCK_BY_DATE_RANGE(${establishmentId}, ${fromDate}, ${toDate});`;

        db.query(query, function (err, rs) {
            if (err) {
                return reject({status: false, result: err});
            } else {
                return result({status: true, result: rs});
            }
        });
    });
}

function getDayLockForDate (req, res, next) {

    getDayLockForDatePromise(req.query)
        .then(dayLock => {
            if (dayLock.status) {
                for (let i = 0; dayLock.result[0].length > i; i++) {
                    dayLock.result[0][i].fromDate = moment(dayLock.result[0][i].fromDate).toString();
                    dayLock.result[0][i].toDate = moment(dayLock.result[0][i].toDate).toString();
                }
                res.status(200);
                return res.json({
                    msg: 'GLOBAL.OK',
                    title: 'GLOBAL.EXITO',
                    data: dayLock.result
                });
            } else {
                res.status(400);
                return res.json({
                    msg: 'GLOBAL.ERROR',
                    title: 'GLOBAL.NO_SCHEDULE',
                    msgApp: 'SCHEDULE.THERE_ARE_NOT'
                });
            }

        })
        .catch(err => {
            console.error('err ', err);
            res.status(400);
            return res.json({
                msg: 'GLOBAL.ERROR',
                title: 'GLOBAL.ERROR_TITULO'
            });
        });
}

module.exports = {
    setLesson,
    setDayLock,
    updDayLock,
    delDayLockForDate,
    getDayLock,
    getDayLockForDate
}