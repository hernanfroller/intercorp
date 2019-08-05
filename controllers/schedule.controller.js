'use strict'

const db = require('../database');
const moment = require('moment');
const services = require('../services');
const mailerLesson = require('../mailers/lessons.mailer');
const config = require('../bin/config');

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
    services.lessons.validLessonBeforeToCreatePromise(req.body).then(validResp => {
        services.lessons.addLesson(lesson)
            .then(function (lessonResp) {
                services.lessons.addLessonDisciplines(disciplines, lessonResp.insertId).then(
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

function setMembershipSchedule(req, res, next) {
    let id = req.params.id,
        userId = req.body.userId,
        lang = req.body.lang ? req.body.lang : 'es',
        body = {
            lessonRecordId: parseInt(id),
            membershipId: 0,
            status: req.body.status != undefined || req.body.status != null ? req.body.status : '0',
            insUser: req.body.userId
        };
    if (req.query['admin']) {
        body.status = config.constants.STATUS_ACTIVE;
    }
    services.lessons.getCategoryClients(req.body.userId).then(function (categoryData) {
        services.memberships.getMembershipsByUser(req.body.userId, id)
            .then(function (memberships) {
                if (memberships.length < 1) {
                    res.status(400);
                    return res.json({
                        msg: 'GLOBAL.ERROR',
                        title: 'RESERVES.ERROR_MEMBERSHIPS',
                        lessonRecordId: id
                    });
                } else {
                    let auxCan = false;
                    for (let m of memberships) {
                        if (m.alradyAssist > 0) {
                            services.lessons.updateReserveStatusFromBiometric(id, m.mId)
                                .then(upt => {
                                    auxCan = true;
                                    res.status(200);
                                    return res.json({
                                        msg: 'GLOBAL.OK',
                                        title: 'GLOBAL.EXITO'
                                    });
                                })
                                .catch(err => {
                                    res.status(400);
                                    return res.json({
                                        msg: 'GLOBAL.ERROR',
                                        title: 'RESERVES.ERROR_RESERVES'
                                    });
                                });
                        } else {
                            services.lessons.getLessonInfo(id, categoryData)
                                .then(function (lessonResp) {
                                    const lesson = lessonResp.lesson;
                                    const lessonDate = lesson.dateLesson;
                                    services.lessons.getStatusCategoryByEstablishment(id).then(establishment => {
                                        if (lesson.status == 1 || lesson.status == 2) {
                                            res.status(400);
                                            return res.json({
                                                msg: 'GLOBAL.ERROR',
                                                title: 'RESERVES.ERROR_CLOSED'
                                            });
                                        } else if (lesson.canPass == 0) {
                                            res.status(400);
                                            return res.json({
                                                msg: 'GLOBAL.ERROR',
                                                title: 'RESERVES.ERROR_OCCUPANCY'
                                            });
                                        } else if (lesson.dateLimit == 0 && establishment.statusCategoryClient == 'Y') {
                                            res.status(400);
                                            return res.json({
                                                msg: 'GLOBAL.ERROR',
                                                title: 'RESERVES.ERROR_LIMIT_RESERVE'
                                            });
                                        }
                                        if (memberships.length < 2) {
                                            if (m.typeSessions == '0' && m.sessions >= (m.planSessions + m.giftSessions)) {
                                                res.status(400);
                                                services.lessons.cleanLessonRecord(id)
                                                    .then(success => {
                                                        return res.json({
                                                            msg: 'GLOBAL.ERROR',
                                                            title: 'RESERVES.ERROR_SESSIONS'
                                                        });
                                                    })
                                                    .catch(err => {
                                                        return res.json({
                                                            msg: 'GLOBAL.ERROR',
                                                            title: 'RESERVES.ERROR_SESSIONS'
                                                        });
                                                    });
                                            } else if (m.typeSessions == '1' && m.sessionUsedDiscipline >= m.sessionsDiscipline) {
                                                res.status(400);
                                                services.lessons.cleanLessonRecord(id)
                                                    .then(success => {
                                                        return res.json({
                                                            msg: 'GLOBAL.ERROR',
                                                            title: 'RESERVES.ERROR_SESSION_LESSON'
                                                        });
                                                    })
                                                    .catch(err => {
                                                        return res.json({
                                                            msg: 'GLOBAL.ERROR',
                                                            title: 'RESERVES.ERROR_SESSION_LESSON'
                                                        });
                                                    });
                                            } else {
                                                if (body.membershipId == 0) {
                                                    body.membershipId = m.mId;
                                                    services.lessons.addMembershipLesson(body)
                                                        .then(success => {
                                                            let status = '3';
                                                            services.lessons.blockInstructorLessons(id, status)
                                                                .then(success => {})
                                                                .catch(err => {
                                                                    console.error('\n', err, '\n');
                                                                    return res.json({
                                                                        msg: 'GLOBAL.ERROR',
                                                                        title: 'ERROR_DB_BODY'
                                                                    });
                                                                });

                                                            if (m.updateStartDate == '1') {

                                                                const updateMembership = {
                                                                    planId: m.planId,
                                                                    date: lessonDate,
                                                                    membershipId: m.mId
                                                                }

                                                                services.lessons.updateMembershipStartDate(updateMembership).then(
                                                                    success => {

                                                                    }).catch(err => {
                                                                    console.error("\n", err, "\n");
                                                                    return res.json({
                                                                        msg: 'GLOBAL.ERROR',
                                                                        title: 'ERROR_DB_BODY'
                                                                    })
                                                                });

                                                            }
                                                            mailerLesson.scheduleSendEmial(userId, id, lang);
                                                            auxCan = true;
                                                            res.status(200);
                                                            return res.json({
                                                                msg: 'GLOBAL.OK',
                                                                title: 'GLOBAL.EXITO'
                                                            });
                                                        })
                                                        .catch(err => {
                                                            console.error('\n', err, '\n');
                                                            return res.json({
                                                                msg: 'GLOBAL.ERROR',
                                                                title: 'ERROR_DB_BODY'
                                                            });
                                                        });
                                                }
                                            }
                                        } else {
                                            if (
                                                (m.typeSessions == '1' && m.sessionUsedDiscipline < m.sessionsDiscipline) ||
                                                (m.typeSessions == '0' && m.sessions < (m.planSessions + m.giftSessions)) ||
                                                m.typeSessions == '2'
                                            ) {
                                                if (body.membershipId == 0) {
                                                    body.membershipId = m.mId;
                                                    services.lessons.addMembershipLesson(body)
                                                        .then(success => {
                                                            mailerLesson.scheduleSendEmial(userId, id, lang);
                                                            let status = '4';
                                                            services.lessons.blockInstructorLessons(id, status)
                                                                .then(success => {})
                                                                .catch(err => {
                                                                    console.error('\n', err, '\n');
                                                                    return res.json({
                                                                        msg: 'GLOBAL.ERROR',
                                                                        title: 'ERROR_DB_BODY'
                                                                    });
                                                                });
                                                            if (m.updateStartDate == '1') {

                                                                const updateMembership = {
                                                                    planId: m.planId,
                                                                    date: lessonDate,
                                                                    membershipId: m.mId
                                                                }

                                                                services.lessons.updateMembershipStartDate(updateMembership).then(
                                                                    success => {
                                                                    }).catch(err => {
                                                                    console.error("\n", err, "\n");
                                                                    return res.json({
                                                                        msg: 'GLOBAL.ERROR',
                                                                        title: 'ERROR_DB_BODY'
                                                                    })
                                                                });

                                                            }
                                                            auxCan = true;
                                                            res.status(200);
                                                            return res.json({
                                                                msg: 'GLOBAL.OK',
                                                                title: 'GLOBAL.EXITO'
                                                            });
                                                        })
                                                        .catch(err => {
                                                            console.error('\n', err, '\n');
                                                            res.status(400);
                                                            return res.json({
                                                                msg: 'GLOBAL.ERROR',
                                                                title: 'ERROR_DB_BODY'
                                                            });
                                                        });
                                                }
                                            }
                                        }
                                    });
                                })
                                .catch(function (err) {
                                    console.error('\n', err, '\n');
                                    res.status(400);
                                    return res.json({
                                        msg: 'GLOBAL.ERROR',
                                        title: 'ERROR_DB_BODY'
                                    });
                                });
                        }
                    }
                }
            })
            .catch(function (err) {
                console.error(err);
                res.status(400);
                res.json({
                    msg: 'GLOBAL.ERROR',
                    title: 'ERROR_DB_BODY'
                });
            });
    });
}

function addAndValidateMemberships(req, res, next) {
    let lessonRecordId = req.body.lessonRecordId;
    if (services.transversal.ifNotEmptyOrNull(lessonRecordId) && lessonRecordId != 'undefined') {
        req.params.id = lessonRecordId;
        req.body.status = config.constants.STATUS_INACTIVE;
        setMembershipSchedule(req, res, next);
    } else {
        const bodyLessonRecord = {
            lessonId: req.body.lessonId,
            occupancy: req.body.occupancy,
            romId: req.body.romId,
            instructorId: req.body.instructorId,
            dateLesson: req.body.dateLesson,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            scheduleDisciplineId: req.body.scheduleDisciplineId,
            status: config.constants.STATUS_INACTIVE
        };

        services.lessons.addLessonRecord(bodyLessonRecord)
            .then(lessonRecord => {
                req.params.id = lessonRecord.insertId;
                req.body.status = config.constants.STATUS_INACTIVE;
                membershipAddSchedule(req, res, next);
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

};

function setDayLock (req, res, next) {
    services.schedule.setDayLockPromise(req.body)
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

function updDayLock (req, res, next) {
    services.schedule.updDayLockPromise(req.body)
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

function delDayLockForDate (req, res, next) {
    services.schedule.delDayLockForDatePromise(req.body)
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

function getDayLock (req, res, next) {
    services.schedule.getDayLockPromise(req.params)
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

function getDayLockForDate (req, res, next) {
    services.schedule.getDayLockForDatePromise(req.query)
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

function getScheduleByEstablishment(req, res, next) {
    /*var id = req.params.id;
    var startDate = req.query.startDate;
    var endDate = req.query.endDate;*/
    let params = services.transversal.appParameters(req.query);

    /*if (id == 93 && req.headers.admin != 'yes') {
        return res.json({
            msg: 'Error'
        });
    } //Esta validación es incoherente*/

    var lessonData = {
        id: req.params.id,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        typeD: params.typeD
    };

    services.lessons.getLessonRecordByEstablishment(lessonData)
        .then(lesson_result => {
            return res.json(lesson_result);
        })
        .catch(err => {
            console.error('\n', err, '\n');
            return res.json({
                msg: 'GLOBAL.ERROR',
                title: 'ERROR_DB_BODY'
            });
        });
}

function getServiceByPersonal(req, res, next) {
    const data = {
        id: req.params.id,
        status: req.query.status
    };
    services.disciplines.getServiceByPersonal(data).then(result => {
        res.status(200);
        return res.json(result);
    })
    .catch(err => {
        res.status(400);
        return res.json({
            msg: "GLOBAL.ERROR_DB",
            title: "ERROR_DB_BODY"
        });
    });
}

function getServiceByLesson(req, res, next) {
    const data = {
        id: req.params.id
    };
    services.disciplines.getServiceByLesson(data).then(result => {
        res.status(200);
        return res.json(result);
    })
    .catch(err => {
        res.status(400);
        return res.json({
            msg: "GLOBAL.ERROR_DB",
            title: "ERROR_DB_BODY"
        });
    });
}

function getLessonsByEstablishment(req, res, next) {
    const data = {
        id: req.params.id,
        startDate: req.query.startDate,
        endDate: req.query.endDate
    };

    services.lessons.getLessonsByEstablishment(data).then(rows => {
        res.status(200);
        return res.json(rows);
    })
    .catch(err => {
        res.status(404);
        return res.json({
            msg: 'GLOBAL.ERROR_DB',
            title: 'ERROR_DB_BODY'
        });
    });
}

function getLessonsServices(req, res, next) {
    const id = req.params.id;
    
    services.lessons.getLessonsServices(id).then(rows => {
        res.status(200);
        return res.json(rows);
    })
    .catch(err => {
        res.status(404);
        return res.json({
            msg: 'GLOBAL.ERROR_DB',
            title: 'ERROR_DB_BODY'
        });
    });
}

function getScheduleByEstablishmentByUser(req, res, next) {
    const data = {
        establishmentId: req.params.establishmentId,
        userEstablishmentId: req.params.userEstablishmentId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        servId: req.params.servId
    };
    services.lessons.scheduleToShowInApp(data)
        .then(lesson_result => {
            return res.json(lesson_result);
        })
        .catch(err => {
            console.error('\n', err, '\n');
            return res.json({
                msg: 'GLOBAL.ERROR',
                title: 'ERROR_DB_BODY'
            });
        });
}

function getServicesByDay(req, res, next) {
    const data = {
        id: req.params.id,
        date: req.query.startDate,
        time: req.query.time
    };
    
    services.disciplines.getServicesByDay(data).then(rows => {
        res.status(200);
        return res.json(rows);
    })
    .catch(err => {
        res.status(400);
        return res.json({
            msg: 'GLOBAL.ERROR',
            title: 'GLOBAL.ERROR_TITULO'
        });
    });
}

function getInstructorByDay(req, res, next) {
    const data = {
        establisment: req.params.id,
        serviceId: req.params.serviceId,
        date: req.query.date,
        group: '1',
        time: req.query.time != undefined ? true : false,
        admin: req.query.admin != undefined ? req.query.admin : false
    };

    services.disciplines.getServiceInstructorByDay(data)
        .then(lessons_instructor => {
            res.status(200);
            return res.json(lessons_instructor);
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

function getTimesEnablesByLesson(req, res, next) {
    const lessonId = req.params.lessonId;
    const date = req.query.date;
    const serviceId = req.query.serviceId;

    services.lessons.getLessonById(lessonId, serviceId)
        .then(lesson => {
            const lesson_data = {
                lesson: lesson,
                date: date,
                lessonId: lessonId
            };

            services.schedule.calculateEnabledLessons(lesson_data)
                .then(lesson_availability => {
                    return res.json(lesson_availability);
                })
                .catch(err => {
                    console.error('errr calculateEnabledLessons', err);
                    return res.json({
                        msg: 'GLOBAL.ERROR',
                        title: 'ERROR_DB_BODY'
                    });
                });
        })
        .catch(err => {
            console.error('err ', err);
            console.error('getLessonById errr ', err);
            return res.json({
                msg: 'GLOBAL.ERROR',
                title: 'ERROR_DB_BODY'
            });
        });
}

function changeStatus(req, res, next) {
    const data = {
        id: req.params.id,
        status: req.body.status
    };

    services.lessons.changeLessonRecordStatusById(data).then(result => {
        res.status(200);
        return es.json({
            msg: 'GLOBAL.OK',
            title: 'GLOBAL.EXITO'
        });
    })
    .catch(err => {
        console.error('Error ', err);
        res.status(400);
        return res.json({
            msg: 'GLOBAL.ERROR_DB',
            title: 'ERROR_DB_BODY'
        });
    });
}

function lessonUpdate(req, res, next) {
    const id = req.params.id;
    const referenceOcupancy = req.body.referenceOcupancy;
    services.lessons.getLessonRecordToUpdateAndReservesCount(id,referenceOcupancy)
    .then(lessonRecordCount => {
        if(lessonRecordCount >= 1){
            res.status(400);
            return res.json({
                msg: 'SCHEDULE.HAVE_RESERVES_FUTURE',
                title: 'SCHEDULE.RESERVES_COUNT_TITLE'
            });
        }else{
            const lesson = {
                disciplineId: req.body.serviceId,
                establishmentId: req.body.establishmentId,
                special: req.body.special,
                days: req.body.days,
                insUser: req.body.insUser,
                startDate: req.body.startDate,
                untilDate: req.body.untilDate ? req.body.untilDate : req.body.startDate,
                startTime: req.body.startTime,
                endTime: req.body.endTime,
                type: req.body.type ? req.body.type : config.constants.LESSON_TYPE.NORMAL,
                referenceInstructor: req.body.instructorId,
                referenceRoomId: req.body.referenceRoomId,
                referenceOcupancy: req.body.referenceOcupancy,
                showOnApp: req.body.showOnApp
            };
        
            res.header('Access-Control-Allow-Origin', '*');
            services.lessons.updateLesson(lesson).then(result => {
                services.lessons.updateLessonDisciplines(req.body.disciplines, id).then(lessonDisciplines => {
                    services.lessons.updateFutureLessonRecordOccupancy(id,req.body.referenceOcupancy).then( occupancy => {
                        res.status(200);
                        return res.json({
                            msg: 'GLOBAL.OK',
                            title: 'GLOBAL.EXITO'
                        });
                    });
                });
            })
            .catch(err => {
                console.error(err);
                res.status(400);
                return res.json({
                    msg: 'GLOBAL.ERROR',
                    title: 'GLOBAL.ERROR_TITULO'
                });
            });
        }
    })
    .catch(err => {
        return res.json({
            msg: 'GLOBAL.ERROR',
            title: 'ERROR_DB_BODY'
        });
    });
   
}

function unpaidUpdate(req, res, next) {
    const data = {
        id: req.params.id,
        body: req.body
    };
    services.lessons.updateUnpaidRecord(data).then(result => {
        res.status(200);
        return res.json({
            msg: 'GLOBAL.OK',
            title: 'GLOBAL.EXITO'
        });
    })
    .catch(err => {
        res.status(400);
        return res.json({
            msg: "GLOBAL.ERROR_DB",
            title: "ERROR_DB_BODY"
        });
    });
}

function cancelMembershipSchedule(req, res, next) {
    const id = req.params.id;
    const membershipLessonId = req.params.membershipLessonId;
    const admin = req.query['admin'];
    var discountSession = false;
    res.header('Access-Control-Allow-Origin', '*');
    let type = req.query.type == '1' ? req.query.type : '0';
    if (type == '0') {
        services.lessons.getCategoryClientsByMembershipLesson(req.params.membershipLessonId).then(function (categoryData) {
            services.lessons.getLessonRecord(id)
                .then(function (resp) {
                    if (categoryData.length > 0 && resp[0].statusCategoryClient == 'Y') {
                        let timeLesson = moment(resp[0].fullDate);
                        var now = moment(
                            moment()
                            .utcOffset(resp[0].timezone)
                            .format('YYYY-MM-DD HH:mm')
                        );
                        timeLesson.subtract(
                            categoryData[0].timeDiscardReserve,
                            services.lessons.getTypeTimeOfCategory(categoryData[0].typeTimeDiscardReserve)
                        );
                        let isAfter = now.isAfter(timeLesson);
                        var membershipLessonId = req.params.membershipLessonId;
                        if (!isAfter && admin) {
                            discountSession = true;
                            var membership_lesson = {
                                id: id,
                                membershipLessonId: membershipLessonId,
                                status: '3',
                                discountSession: discountSession
                            };
                            services.lessons.cancelReserve(membership_lesson)
                                .then(function (resp) {
                                    res.status(200);
                                    return res.json({
                                        msg: 'GLOBAL.OK',
                                        title: 'GLOBAL.EXITO'
                                    });
                                })
                                .catch(function (err) {
                                    if (err) {
                                        console.error(err);
                                        res.status(400);
                                        res.json({
                                            msg: 'GLOBAL.ERROR',
                                            title: 'GLOBAL.ERROR_TITULO',
                                            msgApp: 'GLOBAL.ERROR_TITULO'
                                        });
                                    }
                                });
                        } else if (admin) {
                            var membership_lesson = {
                                id: id,
                                membershipLessonId: req.params.membershipLessonId,
                                status: '3',
                                discountSession: discountSession
                            };
                            services.lessons.cancelReserve(membership_lesson)
                                .then(function (resp) {
                                    res.status(200);
                                    return res.json({
                                        msg: 'GLOBAL.OK',
                                        title: 'GLOBAL.EXITO'
                                    });
                                })
                                .catch(function (err) {
                                    if (err) {
                                        console.error(err);
                                        res.status(400);
                                        res.json({
                                            msg: 'GLOBAL.ERROR',
                                            title: 'GLOBAL.ERROR_TITULO',
                                            msgApp: 'GLOBAL.ERROR_TITULO'
                                        });
                                    }
                                });
                        }
                    } else {
                        var clase = moment(moment(resp[0].dateLesson).format('YYYY-MM-DD') + ' ' + resp[0].startTime);
                        var limit = resp[0].block_minutes ? resp[0].block_minutes : 0;
                        let now = moment(
                            moment()
                            .utcOffset(resp[0].timezone)
                            .format('YYYY-MM-DD HH:mm')
                        );
                        if (clase.diff(now, 'minutes') < limit && admin) {
                            var membershipLessonId = req.params.membershipLessonId;
                            discountSession = true;
                            var membership_lesson = {
                                id: id,
                                membershipLessonId: req.params.membershipLessonId,
                                status: '3',
                                discountSession: discountSession
                            };
                            services.lessons.cancelReserve(membership_lesson)
                                .then(function (resp) {
                                    res.status(200);
                                    return res.json({
                                        msg: 'GLOBAL.OK',
                                        title: 'GLOBAL.EXITO'
                                    });
                                })
                                .catch(function (err) {
                                    if (err) {
                                        console.error(err);
                                        res.status(400);
                                        res.json({
                                            msg: 'GLOBAL.ERROR',
                                            title: 'GLOBAL.ERROR_TITULO',
                                            msgApp: 'GLOBAL.ERROR_TITULO'
                                        });
                                    }
                                });
                        } else if (admin) {
                            var membership_lesson = {
                                id: id,
                                membershipLessonId: req.params.membershipLessonId,
                                status: '3',
                                discountSession: discountSession
                            };
                            services.lessons.cancelReserve(membership_lesson)
                                .then(function (resp) {
                                    res.status(200);
                                    return res.json({
                                        msg: 'GLOBAL.OK',
                                        title: 'GLOBAL.EXITO'
                                    });
                                })
                                .catch(function (err) {
                                    if (err) {
                                        console.error(err);
                                        res.status(400);
                                        res.json({
                                            msg: 'GLOBAL.ERROR',
                                            title: 'GLOBAL.ERROR_TITULO',
                                            msgApp: 'GLOBAL.ERROR_TITULO'
                                        });
                                    }
                                });
                        }
                    }
                })
                .catch(function (err) {
                    if (err) {
                        console.error(err);
                        res.status(400);
                        res.json({
                            msg: 'GLOBAL.ERROR',
                            title: 'GLOBAL.ERROR_TITULO',
                            msgApp: 'GLOBAL.ERROR_TITULO'
                        });
                    }
                });
        });
    } else if (type == '1') {
        services.lessons.deleteUnpaidRecord(membershipLessonId)
            .then(result => {
                let status = config.constants.STATUS_INACTIVE;
                services.lessons.blockInstructorLessons(id, status)
                    .then(success => {
                        res.status(200);
                        return res.json({
                            msg: 'GLOBAL.OK',
                            title: 'GLOBAL.EXITO'
                        });
                    })
                    .catch(err => {
                        res.status(400);
                        res.json({
                            msg: 'GLOBAL.ERROR',
                            title: 'GLOBAL.ERROR_TITULO'
                        });
                    });
            })
            .catch(err => {
                res.status(400);
                return res.json({
                    msg: 'GLOBAL.ERROR',
                    title: 'ERROR_DB_BODY'
                });
            });
    }
}

function saveUnpaid(req, res, next) {
    services.lessons.getUnpaidByLesson(req.body.userEstablishmentId, req.body.lessonRecordId)
        .then(result => {

            if (result.canAssist < 1) {
                if (result.ocupacy == 1) {
                    var unpaid = {
                        userEstablishmentId: req.body.userEstablishmentId,
                        lessonRecordId: req.body.lessonRecordId,
                        status: req.body.status,
                        amount: req.body.amount,
                        title: req.body.title,
                        insUser: req.body.insUser
                    };
                    supportUnpaid
                        .add(unpaid)
                        .then(result => {
                            let status = '3';
                            services.lessons.blockInstructorLessons(req.body.lessonRecordId, status)
                                .then(success => {})
                                .catch(err => {
                                    console.error('\n', err, '\n');
                                    res.status(400);
                                    return res.json({
                                        msg: 'GLOBAL.ERROR',
                                        title: 'ERROR_DB_BODY'
                                    });
                                });
                            res.status(200);
                            return res.json({
                                msg: 'GLOBAL.OK',
                                title: 'GLOBAL.EXITO'
                            });
                        })
                        .catch(err => {
                            console.error('\n', err, '\n');
                            res.status(400);
                            return res.json({
                                msg: 'GLOBAL.ERROR',
                                title: 'ERROR_DB_BODY'
                            });
                        });
                } else {
                    res.status(400);
                    return res.json({
                        msg: 'GLOBAL.ERROR',
                        title: 'RESERVES.ERROR_OCCUPANCY'
                    });
                }
            } else {
                res.status(400);
                return res.json({
                    msg: 'GLOBAL.ERROR',
                    title: 'RESERVES.ERROR_OCCUPANCY'
                });
            }
        })
        .catch(err => {
            console.error('\n', err, '\n');
            res.status(400);
            return res.json({
                msg: 'GLOBAL.ERROR',
                title: 'ERROR_DB_BODY'
            });
        });
}

function cleanLessonRecord(req, res, next) {
    const id = req.params.id;
    services.lessons.cleanLessonRecord(id, true)
        .then(resp => {
            res.status(200);
            return res.json({
                msg: 'GLOBAL.OK',
                title: 'GLOBAL.EXITO'
            });
        })
        .catch(err => {
            console.error(err);
            res.status(400);
            return res.json({
                msg: 'GLOBAL.ERROR_DB',
                title: 'ERROR_DB_BODY'
            });
        });
}

function deleteLesson(req, res, next) {
    const id = req.params.id;
    services.lessons.deleteLessonById(id).then(result => {
        res.status(200);
        return res.json({
            msg: 'GLOBAL.OK',
            title: 'GLOBAL.EXITO'
        });
    })
    .catch(err => {
        if (err.errno == config.constants.ERROR_FOREIGN_KEY_CONSTRAINT) {
            services.lessons.deleteLessonIgnore(id).then(del => {
                res.status(200);
                return res.json({
                    msg: 'GLOBAL.OK',
                    title: 'GLOBAL.EXITO'
                });
            }).catch(e => {
                console.error(e);
                res.status(400);
                return res.json({
                    msg: 'GLOBAL.ERROR_LESSON_FOREIGN',
                    title: 'GLOBAL.ERROR_CANNOT_DELETE'
                });
            })
        } else {
            res.status(400);
            return res.json({
                msg: 'GLOBAL.ERROR_DB',
                title: 'ERROR_DB_BODY'
            });
        }
    });
}


function getLessonRecordId(req, res, next) {
    const id = req.params.id;
    const type = req.query.type == undefined || req.query.type == null ? '0' : req.query.type;
    services.lessons.getLessonRecordId(id, type).then(rows => {
        res.status(200);
        return res.json(rows);
    })
    .catch(err => {
        console.error('lessonrecoirdId ', err)
        res.status(400);
        return res.json({
            msg: 'GLOBAL.ERROR',
            title: 'GLOBAL.ERROR_TITULO'
        });
    });
}

function getServiceLessonsForApp (req, res, next) {
    const data = {
        establisment: req.params.id,
        serviceId: req.params.serviceId,
        date: req.query.date,
        group: '0',
        time: false,
        admin: req.query.admin != undefined ? req.query.admin : false
    };
    //Obtengo los instructores por servicio en el dia dado
    services.schedule.getLessonInstructorsForApp(data)
        .then(lessons => {
            if (lessons.length > 0) {
                const date = req.query.date;
                services.schedule.getServiceLessonsForApp(lessons, req.params.serviceId, date)
                    .then(structure => {
                        return res.json(structure)

                    })
                    .catch(err => {
                        console.log(err);
                        res.status(400);
                        return res.json({
                            msg: 'GLOBAL.ERROR',
                            title: 'GLOBAL.ERROR_TITULO'
                        });
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

async function getDisciplinesbyEstablishment (req, res, next) {
    const id = req.params.id; // del establecimiento;
    const params = services.transversal.appParameters(req.query);
    const callBy = "byEstablishment";
    const status = req.query.status;
    const cbp = req.query.cbp;

    try {
        let response = await services.schedule.getDisciplines(id, params, callBy, status, cbp);
        return res.json(response);
    } catch(err) {
        res.status(404);
        return res.json(err);
    }
}

async function getSearchDisciplinesbyEstablishment (req, res, next) {
    const id = req.params.id; // del establecimiento;
    const search = req.params.search;
    const params = services.transversal.appParameters(req.query);
    const callBy = "byEstablishment";
    const status = req.query.status;
    const cbp = req.query.cbp;

    try {
        let response = await services.schedule.getSearchDisciplines(id, params, callBy, status, cbp, search);
        return res.json(response);
    } catch(err) {
        res.status(404);
        return res.json(err);
    }
}

async function test (req, res) {
    try {
        let memberships = await services.memberships.getMembershipsByUser(req.params.userId, req.params.lessonRecordId);
        return res.status(200).json(memberships);
    } catch (error) {
        return res.status(400).json(error);
    }
}

module.exports = {
    setLesson,
    setMembershipSchedule,
    addAndValidateMemberships,
    getScheduleByEstablishment,
    setDayLock,
    updDayLock,
    delDayLockForDate,
    getDayLock,
    getDayLockForDate,
    getServiceByPersonal,
    getServiceByLesson,
    getLessonsByEstablishment,
    getLessonsServices,
    getScheduleByEstablishmentByUser,
    getServicesByDay,
    getInstructorByDay,
    getTimesEnablesByLesson,
    changeStatus,
    lessonUpdate,
    unpaidUpdate,
    cancelMembershipSchedule,
    saveUnpaid,
    cleanLessonRecord,
    deleteLesson,
    getLessonRecordId,
    getServiceLessonsForApp,
    getDisciplinesbyEstablishment,
    getSearchDisciplinesbyEstablishment
}