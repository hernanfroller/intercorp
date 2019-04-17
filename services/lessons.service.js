'use strict'

const db = require('../database');
const moment = require('moment');
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
        db.mysql.reader.query(sentence,
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

function addLesson(body) {
    return new Promise(function (resolve, reject) {
        db.mysql.writter.query(`insert into lessons SET ?`, body, function (err, rows) {
            if (err) {
                return reject(err);
            } else {
                return resolve(rows);
            }
        });
    });
}

function addLessonDisciplines(disciplines, lessonId) {
    return new Promise(function (result, reject) {
        let sentence = ``;
        for (const discipline of disciplines) {
            sentence = sentence + ` insert into lesson_discipline (lessonId, disciplineId) values (${lessonId}, ${discipline.id}); `;
        }
        db.mysql.writter.query(sentence, function (err, rows) {
            if (err) {
                return reject(err);
            } else {
                return result(rows);
            }
        });
    });
}

function getCategoryClients(id, verifyEstablishmentStatusCategoryClient) {
    return new Promise(function (resolve, reject) {
        let sentence = `Select category_client.*,  DATE_FORMAT(CASE 
        when category_client.typeTimePrevReserve = '0' then  DATE_ADD(CONVERT_TZ(now(), '+00:00', establishments.timezone), INTERVAL category_client.timePrevReserve DAY) 
        when category_client.typeTimePrevReserve = '1' then
        DATE_ADD(CONVERT_TZ(now(), '+00:00', establishments.timezone), INTERVAL category_client.timePrevReserve HOUR)
        when category_client.typeTimePrevReserve = '2' then
        DATE_ADD(CONVERT_TZ(now(), '+00:00', establishments.timezone), INTERVAL category_client.timePrevReserve MINUTE)
        end, '%Y-%m-%d %H:%i:%s') as dateLimitReserve,
        DATE_FORMAT(CASE 
        when category_client.typeTimeDiscardReserve = '0' then  CONVERT_TZ(now(), '+00:00', establishments.timezone) - INTERVAL category_client.timeDiscardReserve DAY 
        when category_client.typeTimeDiscardReserve = '1' then
        (CONVERT_TZ(now(), '+00:00', establishments.timezone) - INTERVAL category_client.timeDiscardReserve HOUR)
        when category_client.typeTimeDiscardReserve = '2' then
        CONVERT_TZ(now(), '+00:00', establishments.timezone) - INTERVAL category_client.timeDiscardReserve MINUTE
        end, '%Y-%m-%d %H:%i:%s') as dateLimitDiscard,
        category_client.daysPrevLesson AS daysPrevLesson,
        DATE_FORMAT(CONVERT_TZ(now(), '+00:00', establishments.timezone) + INTERVAL category_client.daysPrevLesson DAY,'%Y-%m-%d %H:%i:%s')  as dateMaxReserv,
        establishments.timezone as timezone 
        from category_client
        inner join user_establishment on category_client.id = user_establishment.categoryClientId 
        inner join establishments on establishments.id = user_establishment.establishmentId
        where user_establishment.id = ${id}
        ${ verifyEstablishmentStatusCategoryClient ? ` and  establishments.statusCategoryClient = 'Y' `: '' }
       `;
       db.mysql.reader.query(sentence,
            function (err, rows) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(rows);
                }
            })
    })
}

function updateReserveStatusFromBiometric(id, membershipId) {
    return new Promise(function (resolve, reject) {
        let sentence = `update membership_lesson set membership_lesson.status = '1' where membership_lesson.lessonRecordId = ${id}
and membership_lesson.membershipId = ${membershipId}; call spUpdateStatusMembership(${membershipId})`;
        db.mysql.writter.query(sentence,
            function (err, rows) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(rows);
                }
            })
    });
}

function getLessonInfo (lessonRecordId, category) {

    var lessonInfo = {
        limitReserve: null,
        lesson: ''
    }

    return new Promise(function (result, reject) {
        let sentence = `select date(lesson_record.dateLesson) as dateLesson, (select count(*) + (select count(*) from unpaid_record where unpaid_record.lessonRecordId = membership_lesson.lessonRecordId) from membership_lesson
        where membership_lesson.lessonRecordId = lesson_record.id) as assitAcount, (select count(*) + (select count(*) from unpaid_record where unpaid_record.lessonRecordId = membership_lesson.lessonRecordId) from membership_lesson where membership_lesson.lessonRecordId = lesson_record.id) < lesson_record.occupancy canPass, lesson_record.occupancy,
        lesson_record.status,  DATE_FORMAT(ADDTIME(lesson_record.dateLesson, lesson_record.startTime),'%Y-%m-%d %H:%i:%s')  AS datetimelesson, lesson_record.startTime, lesson_record.endTime, CONCAT(date(lesson_record.dateLesson), '') as auxDate from lesson_record where lesson_record.id = ${lessonRecordId}`;

        if (category.length > 0) {
            if (category[0].daysPrevLesson > 0) {
                sentence += ` AND ADDTIME(lesson_record.dateLesson, lesson_record.startTime) <= '${category[0].dateMaxReserv}' `
            }
        }
        db.mysql.reader.query(sentence,
            function (err, rows) {
                if (err) {
                    return reject(err);
                } else {
                    if (rows.length > 0) {
                        const lesson = rows[0];
                        if ( category.length > 0 ) {
                            if ( lesson.datetimelesson <= category[0].dateLimitReserve && category[0].timePrevReserve > 0 ) {
                                lessonInfo.limitReserve = config.constants.LESSON_TYPE_LIMIT.PREVIUS_TIME;
                            } else {
                                lessonInfo.lesson = lesson;
                            }
                        } else {
                            lessonInfo.lesson = lesson;
                        }
                    } else {
                        lessonInfo.limitReserve = config.constants.LESSON_TYPE_LIMIT.MAX_DAYS;                        
                    }
                    return result({
                        ...lessonInfo,
                        isValidPreviousTimeReserve: () => lessonInfo.limitReserve != config.constants.LESSON_TYPE_LIMIT.PREVIUS_TIME,
                        isValidFreeDaysReserve: () => lessonInfo.limitReserve != config.constants.LESSON_TYPE_LIMIT.MAX_DAYS,
                        isLessonFull: () => lessonInfo.lesson.canPass == config.constants.NUMBER_ZERO,
                        isDictatedLesson: () => String(lessonInfo.lesson.status) == config.constants.LESSON_STATUS.DICTATED,
                        isCancelLesson: () => String(lessonInfo.lesson.status) == config.constants.LESSON_STATUS.CANCELED
                    });
                }
            })

    });
}

function getStatusCategoryByEstablishment (lessonRecordId) {
    return new Promise(function (result, reject) {
        let sentence = `select establishments.* from lesson_record inner join lessons on lessons.id = lesson_record.lessonId
        inner join establishments on establishments.id = lessons.establishmentId where lesson_record.id = ${lessonRecordId} limit 1`;
        db.mysql.reader.query(sentence,
            function (err, rows) {
                if (err) {
                    return reject(err);
                } else {
                    if (rows.length > 0) {
                        return result(rows[0]);
                    } else {
                        return result({
                            statusCategoryClient: 0
                        });
                    }
                }
            })

    });
}

function cleanLessonRecord(id, full) {
    return new Promise(function (result, reject) {
        let sentence = '';
        if (full != undefined) {
            sentence = `delete from unpaid_record where unpaid_record.lessonRecordId = ${id};
            delete from membership_lesson where membership_lesson.lessonRecordId = ${id}; `;
        }
        sentence = sentence + ` delete from personal_lessons_record where personal_lessons_record.lessonRecordId = ${id};
        delete from lesson_record where lesson_record.id = ${id};`;
        db.mysql.writter.query(sentence, function (err, rows) {
            if (err) {
                return reject(err);
            } else {
                return result(rows);
            }
        });
    });
}

function addMembershipLesson (body) {
    return new Promise(function (result, reject) {

        let dataInsert = {
            lessonRecordId: body.lessonRecordId,
            membershipId: body.membershipId,
            status: body.status,
            insUser: body.insUser,
        }
        let sentence = `insert into membership_lesson SET ?; call spUpdateSessions(${body.membershipId});`;
        db.mysql.writter.query(sentence, dataInsert,
            function (err, rows) {
                if (err) {
                    return reject(err);
                } else {
                    services.memberships.getUserEstablishment(body.membershipId)
                        .then(user => {
                            services.memberships.updateAfterNewMembership(body.membershipId).then(response => {

                                services.memberships.updateStatusUserEstablishment(user).then(updateResponse => {}).catch(error => {});
                                if(body.typeSessions != config.planTypeSessions.unlimited){
                                    services.memberships.checkMembershipsSessionsToSendEmail(body);
                                }
                                
                            }).catch(error => {});

                        }).catch(error => {});
                    return result(rows);
                }
            })
    })
}

function blockInstructorLessons(lessonRecordId, status) {
    return new Promise(function (result, reject) {
        let sentence = `select * from lesson_record where lesson_record.id = ${lessonRecordId}`;
        db.mysql.reader.query(sentence,
            function (err, rows) {
                if (err) {
                    console.error(err);
                    return reject(err);
                } else {
                    if (rows.length > 0) {
                        let date = moment(rows[0].dateLesson).format('YYYY-MM-DD');
                        let sql = `
                            SELECT * FROM lesson_record WHERE instructorId = ${rows[0].instructorId} AND DATE_FORMAT(dateLesson, '%Y-%m-%d') = DATE_FORMAT('${date}', '%Y-%m-%d')
	                                AND startTime >= '${rows[0].startTime}' AND endTime <= '${rows[0].endTime}' AND id <> ${lessonRecordId}
                        `;
                        db.mysql.reader.query(sql,
                            function (err, rows) {
                                if (err) {
                                    console.error(err);
                                    return reject(err);
                                } else {
                                    if (rows.length > 0) {
                                        var lessons = rows;
                                        for (let lesson of lessons) {
                                            let sqlLesson = `
                                                    UPDATE lesson_record SET lesson_record.status = '${status}' WHERE  lesson_record.id = ${lesson.id}
                                                `;
                                            db.mysql.writter.query(sqlLesson,
                                                function (err, rows) {
                                                    if (err) {
                                                        console.error(err);
                                                        return reject(err);
                                                    }
                                                })
                                        }
                                    }
                                }
                            })
                        return result(rows[0]);
                    }
                }
            })
    });
}

function updateMembershipStartDate(data) {
    return new Promise(function (resolve, reject) {
        let startDate = data.date;
        let endDate = data.date;
        db.mysql.reader.query(`
            select * from plans where plans.id = ${data.planId}`,
            function (err, rows) {
                if (err) {
                    reject(err)
                } else {
                    if (rows.length < 1) {
                        reject(err)
                    }
                    
                    if (rows[0].months != null || rows[0].months == 0) {
                        endDate = moment(endDate).add(rows[0].months, 'M').format('YYYY-MM-DD');
                        if (rows[0].days != null || rows[0].days != 0) {
                            endDate = moment(endDate, 'YYYY-MM-DD').add(rows[0].days, 'days').format('YYYY-MM-DD');
                        }
                    } else {
                        if (rows[0].days != null) {
                            endDate = moment(startDate).add(rows[0].days, 'days').format('YYYY-MM-DD');
                        }
                    }
                    if (rows[0].subtractOneDay != '0') {
                        endDate = moment(endDate).subtract(1, 'day').format('YYYY-MM-DD');
                    } else {
                       endDate = moment(endDate).format('YYYY-MM-DD');
                    }
                    startDate = moment(startDate).format('YYYY-MM-DD');
                    db.mysql.writter.query(`update memberships set  startDate = '${startDate}', endDate = '${endDate}',updDate = now() WHERE id = ${data.membershipId}`,
                        function (err, result) {
                            if (err) {
                                reject(err)
                            } else {
                                resolve(rows);
                            }
                        });
                }
            });
    });

}

function dataScheduleEmial(userId, lessonRecordId) {
    return new Promise(function (resolve, reject) {
        let query = `
        SELECT 
            CONCAT(user_establishment.name, " ", user_establishment.lastName) as fullName,
            disciplines.name as disciplineName,
            establishments.name as establishmentName,
            date_format(lesson_record.dateLesson, '%d/%m/%Y') as dateLesson,
            lesson_record.startTime as hourLesson,
            user_establishment.establishmentId as establishmentId,
            user_establishment.email as email,
            user_establishment.id as userEstablishmentId,
            establishments.photo as logoEstablishment
        FROM membership_lesson INNER JOIN lesson_record ON membership_lesson.lessonRecordId = lesson_record.id 
        INNER JOIN memberships ON membership_lesson.membershipId = memberships.id 
        INNER JOIN  user_establishment ON memberships.userEstablishmentId = user_establishment.id 
        INNER JOIN disciplines ON disciplines.id = lesson_record.scheduleDisciplineId
        INNER JOIN lessons ON lesson_record.lessonId = lessons.id
        INNER JOIN establishments ON establishments.id = lessons.establishmentId
        WHERE lesson_record.id = ${lessonRecordId} AND memberships.userEstablishmentId = ${userId}
        `;
        db.mysql.reader.query(query, body, function (err, rows) {
            if (err) {
                return reject(err);
            } else {
                return resolve(rows);
            }
        });
    });
}

function addLessonRecord(body) {
    return new Promise(function (result, reject) {
        const sentence = `insert into lesson_record set ?`;
        db.mysql.writter.query(sentence, body, function (err, rows) {
            db.mysql.writter.query(
                `insert into personal_lessons_record (personal_lessons_record.lessonRecordId, personal_lessons_record.instructorId) values (${
          rows.insertId
        }, ${body.instructorId});`,
                function (err, prow) {
                    if (err) {
                        return reject(err);
                    } else {
                        return result(rows);
                    }
                }
            );
        });
    });
}

function getLessonRecordByEstablishment(lessonData) {

    return new Promise(function (result, reject) {
        const dateAux = lessonData.startDate != lessonData.endDate;
        let sentence = `
    select
    lesson_record.id as id,
    lessons.id as lessonId,
    lessons.type as type,
    disciplines.name as title,
    concat( date_format(lesson_record.dateLesson,'%Y-%m-%d'), ' ' ,lesson_record.startTime) as start,
    concat( date_format(lesson_record.dateLesson,'%Y-%m-%d'), ' ' ,lesson_record.endTime) as end,
    disciplines.color as color,
    concat('/admin/#/lessons/',lesson_record.id) as url,
    false as allDay,
    disciplines.id as disciplineId,
    disciplines.name as dsciplineName,
   lesson_record.occupancy as occupancy,
    ((select count(membership_lesson.id)
 	 from membership_lesson where membership_lesson.lessonRecordId = lesson_record.id)
  	 + (select count(unpaid_record.id) from unpaid_record where unpaid_record.lessonRecordId = lesson_record.id)) as reserves,
       IFNULL((SELECT GROUP_CONCAT(CONCAT(us.name,' ',us.lastName) SEPARATOR ', ') AS name
       FROM unpaid_record  unpRecord 
       INNER JOIN user_establishment us ON us.id = unpRecord.userEstablishmentId 
       WHERE  unpRecord.lessonRecordId = lesson_record.id AND ISNULL(unpRecord.disDate)
       GROUP BY  unpRecord.lessonRecordId
       ORDER BY  unpRecord.insDate ),'') AS unpaidReserves,
       
       IFNULL((SELECT GROUP_CONCAT(CONCAT(us.name,' ',us.lastName) SEPARATOR ', ') AS name
       FROM membership_lesson membLess 
       INNER JOIN memberships memb ON memb.id = membLess.membershipId 
       INNER JOIN user_establishment us ON us.id = memb.userEstablishmentId 
       WHERE  membLess.lessonRecordId = lesson_record.id AND ISNULL(membLess.disDate)
       GROUP BY  membLess.lessonRecordId
       ORDER BY  membLess.insDate ),'') AS membershipReserves,
	  	rooms.id as romId,

    rooms.name as romName,
    (select GROUP_CONCAT(CONCAT(user_establishment.name," ",user_establishment.lastName)) from user_establishment inner join personal_lessons_record on personal_lessons_record.instructorId = user_establishment.id where personal_lessons_record.lessonRecordId = lesson_record.id) as 'instructorName' ,
    lesson_record.status,
    if((select count(user_establishment.id) > 1 from user_establishment inner join personal_lessons_record on personal_lessons_record.instructorId = user_establishment.id where personal_lessons_record.lessonRecordId = lesson_record.id),NULL, (select user_establishment.photo from user_establishment inner join personal_lessons_record on personal_lessons_record.instructorId = user_establishment.id where personal_lessons_record.lessonRecordId = lesson_record.id)) as 'instructorPhoto',
    (select GROUP_CONCAT(user_establishment.id) from user_establishment inner join personal_lessons_record on personal_lessons_record.instructorId = user_establishment.id where personal_lessons_record.lessonRecordId = lesson_record.id) as 'instructorId',
    rooms.type as roomType
    from lesson_record
    left join lessons on lesson_record.lessonId = lessons.id
    left join rooms on lesson_record.romId = rooms.id
    left join disciplines on disciplines.id =  lesson_record.scheduleDisciplineId
    where rooms.establishmentId = ${lessonData.id}
    ${dateAux ? ` and date(lesson_record.dateLesson) between date('${lessonData.startDate}') and date('${lessonData.endDate}') ` : `and date(lesson_record.dateLesson) = date('${lessonData.startDate}') `}
     and lessons.type = '${lessonData.typeD}'
    group by lesson_record.id order by lesson_record.startTime;`;
        db.mysql.reader.query(sentence,
            function (err, rows) {
                if (err) {
                    return reject(err);
                } else {
                    if (lessonData.typeD == config.constants.LESSON_TYPE.SCHEDULE) {
                        var lessonWithReserves = new Array();
                        var lessonWithoutReserves = new Array();
                        var lessons = rows;
                        for (let lesson of lessons) {
                            if (lesson.reserves >= 1) {
                                lessonWithReserves.push(lesson);
                            } else {
                                lessonWithoutReserves.push(lesson);
                            }
                        }
                        return result({
                            lessonWithReserves: lessonWithReserves,
                            lessonWithoutReserves: lessonWithoutReserves
                        });
                    } else {
                        return result(rows);
                    }

                }
            })
    });
}

function getLessonsByEstablishment(data) {

    return new Promise(function (result, reject) {
        const id = data.id;
        const startDate = data.startDate;
        const endDate = data.endDate;
        const sentence = `  select  lessons.* , 
                            date_format(lessons.startDate,'%Y/%m/%d') startDate,
                            date_format(lessons.untilDate,'%Y/%m/%d') endDate,
                            (SELECT GROUP_CONCAT(disciplines.id SEPARATOR ', ')

                            FROM disciplines 
                                INNER JOIN lesson_discipline ON disciplines.id = lesson_discipline.disciplineId
                            WHERE lesson_discipline.lessonId = lessons.id order by disciplines.id) disciplinesId,

                            (SELECT 
                                SUM(TRUNCATE((((TIME_TO_SEC(TIMEDIFF(lessons.endTime,lessons.startTime))/60) /
                                    (TIME_TO_SEC(disciplines.time) / 60 ))* lessons.referenceOcupancy),0)) 
                                        
                        FROM disciplines 
                            INNER JOIN lesson_discipline ON disciplines.id = lesson_discipline.disciplineId
                        WHERE lesson_discipline.lessonId = lessons.id order by disciplines.id) realCapacity

                    from lessons 
                    where lessons.establishmentId = ${id} 
                        and lessons.type = '1'
                        and ( (date('${startDate}') BETWEEN date(lessons.startDate) 
                        and date(lessons.untilDate) )
                        or (date(lessons.startDate) BETWEEN date('${startDate}') and  date('${endDate}')) )`;

        db.mysql.reader.query(sentence, function (err, rows) {
            if (err) {
                return reject(err);
            } else {
                return result(rows);
            }
        });
    });
}

function getLessonsServices(id) {

    return new Promise(function (result, reject) {
        const sentence = `select  lessons.* ,
        (select CONCAT(user_establishment.name, ' ', user_establishment.lastName) from  user_establishment where user_establishment.id = lessons.referenceInstructor) as instructor,
        (SELECT GROUP_CONCAT(disciplines.name SEPARATOR ', ') FROM disciplines INNER JOIN  lesson_discipline 
            ON disciplines.id = lesson_discipline.disciplineId
            WHERE lesson_discipline.lessonId = lessons.id order by disciplines.id) disciplineName,
        date_format(lessons.startDate,'%d/%m/%Y') startDate,  
        date_format(lessons.untilDate,'%d/%m/%Y') endDate,
        (SELECT type FROM rooms where rooms.id = lessons.referenceRoomId) as roomType
        from lessons 
        where lessons.type = '1' and lessons.establishmentId = ${id}
        group by lessons.id order by lessons.startDate desc;`;

        db.mysql.reader.query(sentence, function (err, rows) {
            if (err) {
                return reject(err);
            } else {
                return result(rows);
            }
        });
    });
}

function scheduleToShowInApp(data) {
    return new Promise(function (result, reject) {
       
        const sentence = `SELECT
                lesson_record.id as id,
                lesson_record.status as 'status',
                concat( date_format(lesson_record.dateLesson,'%Y-%m-%d'), ' ' ,lesson_record.startTime) as 'start',
                concat( date_format(lesson_record.dateLesson,'%Y-%m-%d'), ' ' ,lesson_record.endTime) as 'end',
                lessons.id as lessonId,
                false as allDay,
                disciplines.id as disciplineId,
                disciplines.name as disciplineName,
                ((select count(membership_lesson.id)
                 from membership_lesson where membership_lesson.lessonRecordId = lesson_record.id)
                 + (select count(unpaid_record.id) from unpaid_record where unpaid_record.lessonRecordId = lesson_record.id)) as reserves,
                lesson_record.occupancy as occupancy,
                rooms.id as roomId,
                rooms.name as roomName,
                (select GROUP_CONCAT(user_establishment.id) from user_establishment inner join personal_lessons_record on personal_lessons_record.instructorId = user_establishment.id where personal_lessons_record.lessonRecordId = lesson_record.id) as 'instructorId',
                (select GROUP_CONCAT(CONCAT(user_establishment.name," ",user_establishment.lastName)) from user_establishment inner join personal_lessons_record on personal_lessons_record.instructorId = user_establishment.id where personal_lessons_record.lessonRecordId = lesson_record.id) as 'instructorName' ,
                (select GROUP_CONCAT(lesson_record.id) as lesson_records
                 from membership_lesson
                 join memberships on membership_lesson.membershipId = memberships.id
                 join lesson_record on membership_lesson.lessonRecordId = lesson_record.id
                 where memberships.userEstablishmentId = ${data.userEstablishmentId}) as 'lessonRecordsBookings'
            FROM lesson_record
                left join lessons on lesson_record.lessonId = lessons.id
                left join rooms on lesson_record.romId = rooms.id
                left join disciplines on lessons.disciplineId = disciplines.id
            WHERE rooms.establishmentId = ${data.establishmentId}
                and lesson_record.dateLesson between '${data.startDate}' and '${data.endDate}' and lessons.type = '1' 
                and lessons.disciplineId = '${data.servId}' and lesson_record.status <> '3'
                GROUP BY lesson_record.id ORDER BY lesson_record.startTime`;

        db.mysql.reader.query(sentence,
            function (err, rows) {
                if (err) {
                    return reject(err);
                } else {
                    var lessonWithoutReserves = new Array();
                    var lessons = rows;
                    for (let lesson of lessons) {
                        if (lesson.reserves < lesson.occupancy) {
                            lessonWithoutReserves.push(lesson);
                        }
                    }
                    return result(lessonWithoutReserves);
                }
            })
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

function getLessonRecordByTime(data) {
    return new Promise(function (resolve, reject) {

        let sentenceLessonRecord = '';
        const from = data.from == 'app' ? data.from : 'fitco';

        for (let times of data.listEnables) {
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
     
        db.mysql.reader.query(sentenceLessonRecord, function (err, rows) {
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

function changeLessonRecordStatusById(data) {
    return new Promise(function (resolve, reject) {
        const id = data.id;
        const status = data.status;
        db.mysql.writter.query(`update lesson_record SET status = '${status}' where id = ${id}`, function (err, rows) {
            if (err) {
                return reject(err);
            } else {
                return resolve(rows);
            }
        });
    });
}

function getLessonRecordToUpdateAndReservesCount(lessonId, occupancy) {
    return new Promise(function (result, reject) {

        db.mysql.reader.query(`
        SELECT 
            COUNT(lr.id) AS reservesCount
        FROM lesson_record lr INNER JOIN lessons ON  lr.lessonId = lessons.id 
                    INNER JOIN establishments est ON lessons.establishmentId = est.id 
                            WHERE  lessonId = ${lessonId}
                            AND  lr.dateLesson >= CONVERT_TZ(NOW(),'+00:00',est.timezone)  
                            AND   lr.occupancy <> ${occupancy} 
                            AND ((SELECT COUNT(0) FROM membership_lesson 
                                    WHERE membership_lesson.lessonRecordId = lr.id) + (select count(*) from unpaid_record
                                    WHERE unpaid_record.lessonRecordId = lr.id)) > ${occupancy}`,
            function (err, rows) {
                if (err) {
                    return reject(err);
                } else {
                    return result(rows[0].reservesCount);
                }
            });
    });
}

function updateUnpaidRecord(data) {
    return new Promise(function (resolve, reject) {
        const id = data.id;
        db.mysql.writter.query(`update unpaid_record set ? where unpaid_record.id = ${id}`, data.body, function (err, rows) {
            if (err) {
                return reject(err);
            } else {
                return resolve(rows);
            }
        });
    });
}

function updateLesson(data) {
    return new Promise(function (resolve, reject) {
        db.mysql.writter.query(`update lessons SET ? where id = ${id}`, data, function (err, rows) {
            if (err) {
                return reject(err);
            } else {
                return resolve(rows);
            }
        });
    });
}

function updateLessonDisciplines(disciplines, lessonId) {
    return new Promise(function (result, reject) {
        let sentence = ``;
        for (const discipline of disciplines) {
            sentence = sentence + ` insert into lesson_discipline (lessonId, disciplineId) values (${lessonId}, ${discipline.id}); `;
        }
        db.mysql.writter.query(`delete from lesson_discipline
        where lesson_discipline.lessonId = ${lessonId}; ` +
            sentence,
            function (err, rows) {
                if (err) {
                    return reject(err);
                } else {
                    return result(rows);
                }
            });
    });
}

function updateFutureLessonRecordOccupancy(lessonId, occupancy) {
    return new Promise(function (result, reject) {

        db.mysql.writter.query(`
            UPDATE  lesson_record lr INNER JOIN lessons ON  lr.lessonId = lessons.id 
             INNER JOIN establishments est ON lessons.establishmentId = est.id 
                SET lr.occupancy = ${occupancy}
                    WHERE  lessonId = ${lessonId} 
                    AND  lr.dateLesson >= CONVERT_TZ(NOW(),'+00:00',est.timezone)  
                    AND   lr.occupancy <> ${occupancy}`,
            function (err, rows) {
                if (err) {
                    return reject(err);
                } else {
                    return result(rows);
                }
            });
    });
}

function getCategoryClientsByMembershipLesson(id) {
    return new Promise(function (resolve, reject) {
        let sentence = `Select category_client.*,  DATE_FORMAT(CASE 
        when category_client.typeTimePrevReserve = '0'  AND category_client.timePrevReserve > 0 then  DATE_ADD(CONVERT_TZ(now(), '+00:00', establishments.timezone), INTERVAL category_client.timePrevReserve DAY) 
        when category_client.typeTimePrevReserve = '1' AND category_client.timePrevReserve > 0 then
        DATE_ADD(CONVERT_TZ(now(), '+00:00', establishments.timezone), INTERVAL category_client.timePrevReserve HOUR)
        when category_client.typeTimePrevReserve = '2' AND category_client.timePrevReserve > 0 then
        DATE_ADD(CONVERT_TZ(now(), '+00:00', establishments.timezone), INTERVAL category_client.timePrevReserve MINUTE)

        end, '%Y-%m-%d %H:%i:%s') as dateLimitReserve,
        DATE_FORMAT(CASE 
        when category_client.typeTimeDiscardReserve = '0' then  CONVERT_TZ(now(), '+00:00', establishments.timezone) - INTERVAL category_client.timeDiscardReserve DAY 
        when category_client.typeTimeDiscardReserve = '1' then
        (CONVERT_TZ(now(), '+00:00', establishments.timezone) - INTERVAL category_client.timeDiscardReserve HOUR)
        when category_client.typeTimeDiscardReserve = '2' then
        CONVERT_TZ(now(), '+00:00', establishments.timezone) - INTERVAL category_client.timeDiscardReserve MINUTE
        end, '%Y-%m-%d %H:%i:%s') as dateLimitDiscard,
        establishments.timezone as timezone 
        from category_client
        inner join user_establishment on category_client.id = user_establishment.categoryClientId 
        inner join establishments on establishments.id = user_establishment.establishmentId
        left join memberships on memberships.userEstablishmentId = user_establishment.id
        left join membership_lesson on memberships.id = membership_lesson.membershipId
        where membership_lesson.id = ${id}
        group by category_client.id`;
        db.mysql.reader.query(sentence,
            function (err, rows) {
                if (err) {
                    console.error(err);
                    return reject(err);
                } else {
                    return resolve(rows);
                }
            })
    })
}

function getLessonRecord(id) {
    return new Promise(function (resolve, reject) {
        db.mysql.reader.query(
            `select lesson_record.*, lessons.disciplineId, lessons.establishmentId, lessons.special, lessons.untilDate, lessons.days, lessons.startDate, establishments.timezone, establishments.block_minutes, ADDTIME(lesson_record.dateLesson, lesson_record.startTime) as fullDate, establishments.statusCategoryClient from lesson_record join lessons on lessons.id = lesson_record.lessonId join establishments on lessons.establishmentId = establishments.id where lesson_record.id = ${id}`,
            function (err, rows) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(rows);
                }
            }
        );
    });
}

function getTypeTimeOfCategory(type) {
    if (type == '0' || type == 0) {
        return 'days'
    } else if (type == '1' || type == 1) {
        return 'hours'
    } else {
        return 'minutes'
    }
}

function cancelReserve(body) {
    return new Promise(function (resolve, reject) {
        if (body.discountSession) {
            db.mysql.writter.query(
                `update membership_lesson SET status = '${body.status}' where id = ${body.membershipLessonId};`,
                function (err, rows) {
                    if (err) {
                        console.error('Error ', err);
                        return reject(err);
                    } else {
                        blockInstructorLessons(body.id, body.status)
                            .then(success => {
                                return resolve();
                            })
                            .catch(err => {
                                return reject(err);
                            });
                    }
                }
            );
        } else {
            db.mysql.writter.query(`select spDeleteMembershipLesson(${body.membershipLessonId});`, function (err, rows) {
                if (err) {
                    console.error(err);
                    return reject(err);
                } else {
                    blockInstructorLessons(body.id, body.status)
                        .then(success => {
                            return resolve();
                        })
                        .catch(err => {
                            return reject(err);
                        });
                }
            });
        }
    });
}

function deleteUnpaidRecord(id) {
    return new Promise(function (resolve, reject) {
        db.mysql.writter.query(`delete from unpaid_record where id = ${id}`,
            function (err, rows) {
                if (err) {
                    return reject(err)
                }else{
                    return resolve(200);
                }
            });
    })
}

function deleteLessonById(id) {
    return new Promise(function (resolve, reject) {
        db.mysql.writter.query(`delete from lessons where lessons.id = ${id}`, function (err, rows) {
            if (err) {
                return reject(err)
            }else{
                return resolve(200);
            }
        });
    });
}

function deleteLessonIgnore(id) {
    return new Promise(function (resolve, reject) {
        const sentence = `select if(ISNULL((select (select count(*) from membership_lesson where membership_lesson.lessonRecordId = lesson_record.id limit 1)
        + (select count(*) from unpaid_record where unpaid_record.lessonRecordId = lesson_record.id limit 1)
        from lesson_record where lesson_record.lessonId = lessons.id limit 1)), 0, (select (select count(*) from membership_lesson where membership_lesson.lessonRecordId = lesson_record.id limit 1)
        + (select count(*) from unpaid_record where unpaid_record.lessonRecordId = lesson_record.id limit 1)
        from lesson_record where lesson_record.lessonId = lessons.id limit 1)) cuenta
    from lessons where lessons.id = ${id};`;
        db.mysql.reader.query(sentence, function (errx, rowxs) {
            if (errx) {
                return reject(errx);
            } else {
                if (services.transversal.ifMinor(rowxs[0].cuenta, 1)) {
                    db.mysql.writter.query(`
                    delete personal_lessons_record, lesson_record from lessons
                    left join lesson_record on lesson_record.lessonId = lessons.id
                    left join personal_lessons_record on personal_lessons_record.lessonRecordId = lesson_record.id
                    where lessons.id = ${id};
                    `, function (err, row) {
                        if(err) {
                            return reject({
                                status: 'NOT'
                            });
                        } else {
                            db.mysql.writter.query(`
                            delete from lessons where lessons.id = ${id};
                            `, function (err, row) {
                                if(err) {
                                    return reject({
                                        status: 'NOT'
                                    }); 
                                } else {
                                    return resolve({
                                        msg: 'OK'
                                    });
                                }
                            });
                        }
                    });
                    // supportGlobal.execQuery(`
                    // delete personal_lessons_record, lesson_record from lessons
                    // left join lesson_record on lesson_record.lessonId = lessons.id
                    // left join personal_lessons_record on personal_lessons_record.lessonRecordId = lesson_record.id
                    // where lessons.id = ${id};
                    // `).then(resolve1 => {
                    //     // Intente evitar el callback hell pero no agarra este delete
                    //     supportGlobal.execQuery(`
                    //     delete from lessons where lessons.id = ${id};
                    //     `).then(resolve2 => {
                    //         return resolve({
                    //             msg: 'OK'
                    //         });
                    //     }).catch(e => {
                    //         return reject({
                    //             status: 'NOT'
                    //         });
                    //     })
                    // }).catch(e => {
                    //     return reject({
                    //         status: 'NOT'
                    //     });
                    // })
                } else {
                    return reject({
                        status: 'NOT'
                    });
                }
            }
        });
    });
}

function getLessonsForApp(lessons, serviceId, date) {
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
                promisesCalculate.push(services.schedule.calculateEnabledLessons(lesson_data));
            }
            Promise.all(promisesCalculate).then(lesson_availability => {
                for (let la of lesson_availability) {
                    for (let i = 0; i < la.length; i++) {
                        dataFinal.push(la[i]);
                    }
                }
                return result(dataFinal);
            }).catch(e => {
                console.error('e ', e);
                return reject(e);
            })
        }).catch(err => {
            console.error('err ', err);
            return reject(err);
        });
    });
}

function getLessonRecordId(id, type) {
    return new Promise(function (resolve, reject) {
        const prcById = type == 1 ? 'spGetScheduleIndexById' : 'spGetLessonScheduleIndexById';
        const prcByUrl = type == 1 ? 'spGetScheduleUrlByIndex' : 'spGetLessonScheduleUrlByIndex';
        const discipline = type == 1 ? 'lesson_record.scheduleDisciplineId' : 'lessons.disciplineId ';
        const query =  `SELECT lesson_record.id as id, disciplines.color, CONCAT(establishments.url, '/clases/',lesson_record.id) AS 'url',
        0 AS 'allDay', DATE_FORMAT(lesson_record.dateLesson, '%Y-%m-%d') AS 'date', lessons.untilDate, lesson_record.startTime AS 'start', lesson_record.endTime AS 'end',
        disciplines.name AS 'title', lesson_record.occupancy, lesson_record.notes, lesson_record.romId, rooms.name AS 'romName', lesson_record.status AS 'status', disciplines.id disciplineId,
        ((SELECT COUNT(0) FROM membership_lesson WHERE (membership_lesson.lessonRecordId = lesson_record.id)) + (select count(*) from unpaid_record
        where unpaid_record.lessonRecordId = lesson_record.id)) AS 'reserves', lessons.establishmentId, lessons.id as lessonId, lessons.days AS 'lessonDays', 
        ${prcByUrl}(establishments.id,${prcById}(establishments.id,lesson_record.id,'${type}')+1,0,'${type}') as next, 
        ${prcByUrl}(establishments.id,${prcById}(establishments.id,lesson_record.id,'${type}')-1,0,'${type}') as previous    
        FROM lesson_record  join lessons on lesson_record.lessonId = lessons.id 
        inner join disciplines on disciplines.id = ${discipline}
        join  establishments on disciplines.establishmentId = establishments.id left join rooms on rooms.id = lesson_record.romId
        where lesson_record.id = ${id}; `;
        db.mysql.reader.query(query,
            function (err, rows) {
                if (err) {
                    return reject(err)
                }else{
                    return resolve(rows);
                }
            });
    });
}

module.exports = {
    validLessonBeforeToCreatePromise,
    addLesson,
    addLessonDisciplines,
    getCategoryClients,
    updateReserveStatusFromBiometric,
    getLessonInfo,
    getStatusCategoryByEstablishment,
    cleanLessonRecord,
    addMembershipLesson,
    blockInstructorLessons,
    updateMembershipStartDate,
    dataScheduleEmial,
    addLessonRecord,
    getLessonRecordByEstablishment,
    getLessonsByEstablishment,
    getLessonsServices,
    scheduleToShowInApp,
    getLessonById,
    getLessonRecordByTime,
    changeLessonRecordStatusById,
    getLessonRecordToUpdateAndReservesCount,
    updateUnpaidRecord,
    updateLesson,
    updateLessonDisciplines,
    updateFutureLessonRecordOccupancy,
    getCategoryClientsByMembershipLesson,
    getLessonRecord,
    getTypeTimeOfCategory,
    cancelReserve,
    deleteUnpaidRecord,
    deleteLessonById,
    deleteLessonIgnore,
    getLessonsForApp,
    getLessonRecordId
}