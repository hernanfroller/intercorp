'use strict'

const express = require('express');
const api = express.Router();
const controller = require('../controllers/schedule.controller');

/**
 * @api {post} /schedule/ Create lesson
 * @apiVersion 1.0.0
 * @apiName setLesson
 * @apiGroup Schedule
 *
 * @apiDescription Create a lesson that is visible from the schedule of the fitco solution.
 * 
 * @apiPermission Authorized users only
 * 
 * @apiParam {Number} disciplineId            Unique id of the discipline
 * @apiParam {Number} establishmentId         Unique id of the establishment
 * @apiParam {Number} special                 Special status
 * @apiParam {String} days                    Data frame of days
 * @apiParam {String} insUser                 Unique id of the user register
 * @apiParam {String} startDate               Start date of the lesson
 * @apiParam {String} untilDate               Finish date of the lesson
 * @apiParam {String} startTime               Start time of the lesson
 * @apiParam {String} endTime                 End date of the lesson
 * @apiParam {Number} type                    Type of lesson
 * @apiParam {Number} referenceInstructor     Unique id of the instructor
 * @apiParam {Number} referenceRoomId         Unique id of the Room
 * @apiParam {Number} referenceOcupancy       Unique id of the Ocupancy
 * @apiParam {Number} showOnApp               Show on app status
 * 
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    {
 *      "msg":"GLOBAL.OK",
 *      "title":"GLOBAL.EXITO"
 *    }
 * 
 * @apiErrorExample {json} Schedule not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Find error
 *    HTTP/1.1 500 Internal Server Error
 * 
 */
api.post('/', controller.setLesson);
/**
 * @api {post} /schedule/:id/membership-lesson Register memberhips lesson
 * @apiVersion 1.0.0
 * @apiName setMembershipSchedule
 * @apiGroup Schedule
 *
 * @apiDescription Create a membership lesson
 * 
 * @apiPermission Authorized users only
 *
 * @apiParam {String} status                Membership lesson status.
 * @apiParam {Number} insUser               Unique id of the user register.
 * 
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    {
 *      "msg":"GLOBAL.OK",
 *      "title":"GLOBAL.EXITO"
 *    }
 * 
 * @apiErrorExample {json} Schedule not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Find error
 *    HTTP/1.1 500 Internal Server Error
 * 
 */
api.post('/:id/membership-lesson', controller.setMembershipSchedule);
/**
 * @api {post} /schedule/lesson-record-and-membership Create a service scheduling
 * @apiVersion 1.0.0
 * @apiName addAndValidateMemberships
 * @apiGroup Schedule
 *
 * @apiDescription Create a service availability for scheduling.
 * 
 * @apiPermission Authorized users only
 * 
 * @apiParam {String} dateLesson:             Date time of the lesson record
 * @apiParam {String} endTime                 End time of the lesson record
 * @apiParam {Number} instructorId            Unique id of the instructor
 * @apiParam {Number} lessonId                Unique id of the lesson
 * @apiParam {Number} occupancy:              Ocupancy of the lesson record
 * @apiParam {Number} romId:                  Unique id of the room
 * @apiParam {Number} scheduleDisciplineId    Unique id of the schedule or discipline
 * @apiParam {String} startTime               Start time of the lesson record
 * @apiParam {String} status                  Status of the lesson record ('0': with assistance, '1': without assistance)
 * @apiParam {Number} userId:                 Unique id of the user
 * 
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    {
 *      "msg":"GLOBAL.OK",
 *      "title":"GLOBAL.EXITO"
 *    }
 * 
 * @apiErrorExample {json} Schedule not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Find error
 *    HTTP/1.1 500 Internal Server Error
 * 
 */
api.post('/lesson-record-and-membership', controller.addAndValidateMemberships);
/**
 * @api {get} /schedule/by-establishment/:id Request all calendar lesson by establishment
 * @apiVersion 1.0.0
 * @apiName getScheduleByEstablishment
 * @apiGroup Schedule
 *
 * @apiDescription Return all calendar lessons by establishment
 * 
 * @apiPermission Authorized users only
 * 
 * @apiParam {Number} id                                Unique id of the establishment
 * 
 * @apiSuccess {String} address                         Address of the lesson
 * @apiSuccess {String} alert: "0"
 * @apiSuccess {Number} antifraud: null
 * @apiSuccess {Date} birthDate: null
 * @apiSuccess {String} categoryClientColor: null
 * @apiSuccess {String} categoryClientId: null
 * @apiSuccess {String} categoryClientName: null
 * @apiSuccess {String} celPhone: null
 * @apiSuccess {Number} clientIdPay: null
 * @apiSuccess {Number} code: null
 * @apiSuccess {Number} debt: null
 * @apiSuccess {Date} disDate: null
 * @apiSuccess {String} disUser: null
 * @apiSuccess {Number} districtId: null
 * @apiSuccess {String} dni: null
 * @apiSuccess {String} email: "anapaula@fitco.com.pe"
 * @apiSuccess {Number} emergencyName: null
 * @apiSuccess {Number} emergencyPhone: null
 * @apiSuccess {Number} establishmentId: 303
 * @apiSuccess {String} establishmentName: "prueba Customer Success"
 * @apiSuccess {String} gender: null
 * @apiSuccess {Number} id: 558675
 * @apiSuccess {Number} inFreeze: 0
 * @apiSuccess {Date} insDate: "2019-04-09T20:02:40.000Z"
 * @apiSuccess {Number} insUser: 1
 * @apiSuccess {String} lastName: "Paula"
 * @apiSuccess {String} name: "Ana"
 * @apiSuccess {String} phone: null
 * @apiSuccess {String} photo: null
 * @apiSuccess {Number} roleId: 858
 * @apiSuccess {String} roleName: "Super Usuario"
 * @apiSuccess {String} status: "1"
 * @apiSuccess {String} superAdmin: "0"
 * @apiSuccess {String} typeUser: "1"
 * @apiSuccess {Date} updDate: null
 * @apiSuccess {String} updUser: null
 * @apiSuccess {Number} userEstablishmentId: null
 * 
 */
api.get('/by-establishment/:id', controller.getScheduleByEstablishment);
/**
 * @api {get} /schedule/service/by-personal/:id Request All services for a personal
 * @apiVersion 1.0.0
 * @apiName getServiceByPersonal
 * @apiGroup Schedule
 *
 * @apiDescription Return all services of a personal
 * 
 * @apiPermission Authorized users only
 * 
 * @apiParam {Number} id                            Unique id of the personal
 * 
 * @apiSuccess {String} byDefault: "0"
 * @apiSuccess {String} color                       Color hexadecimal of the lesson in calendar
 * @apiSuccess {String} description                 Description of the lesson
 * @apiSuccess {Date} disDate                       Date of disabled lesson
 * @apiSuccess {String} disUser                     Unique id of the user who disabled the lesson
 * @apiSuccess {Number} establishmentId             Unique id of the establishment
 * @apiSuccess {Number} id                          Unique id of the lesson
 * @apiSuccess {Date} insDate                       Creation date of the lesson
 * @apiSuccess {String} insUser                     Unique id of the user who create the lesson
 * @apiSuccess {Number} migrationId                 Unique id of the migration
 * @apiSuccess {String} name                        Name of the lesson
 * @apiSuccess {Number} price                       Price of the lesson
 * @apiSuccess {String} status                      Status of the lesson ('0', '1')
 * @apiSuccess {String} time                        Hour of the lesson
 * @apiSuccess {String} type                        Lesson type ('0', '1')
 * @apiSuccess {Date} updDate                       Date of the lesson update
 * @apiSuccess {String} updUser                     Unique id of the user who update the lesson
 * 
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    [
 *      {
 *          byDefault: "0"
 *          color: "#800080"
 *          description: null
 *          disDate: null
 *          disUser: null
 *          establishmentId: 303
 *          id: 45991
 *          insDate: "2019-03-07T00:00:00.000Z"
 *          insUser: 1
 *          migrationId: null
 *          name: "Sesión de Nutrición"
 *          price: 100
 *          status: "1"
 *          time: "01:00:00"
 *          type: "1"
 *          updDate: null
 *          updUser: null
 *      },
 *      ...
 *    ]
 * @apiErrorExample {json} Services not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Find error
 *    HTTP/1.1 500 Internal Server Error
 */
api.get('/service/by-personal/:id', controller.getServiceByPersonal);
/**
 * @api {get} /schedule/service/by-lesson/:id Request All services by lesson
 * @apiVersion 1.0.0
 * @apiName getServiceByLesson
 * @apiGroup Schedule
 *
 * @apiDescription Return all services by lesson.
 * 
 * @apiPermission Authorized users only
 * 
 * @apiParam {Number} id                Unique id of the lesson.
 * 
 * @apiSuccess {String} byDefault: "0"
 * @apiSuccess {String} color: "#800080"
 * @apiSuccess {String} description: null
 * @apiSuccess {Date} disDate: null
 * @apiSuccess {Number} disUser: null
 * @apiSuccess {Number} establishmentId: 303
 * @apiSuccess {Number}  id: 45725
 * @apiSuccess {Date} insDate: "2019-02-04T00:00:00.000Z"
 * @apiSuccess {Number} insUser: 1
 * @apiSuccess {Number} migrationId: null
 * @apiSuccess {String} name: "Masajes"
 * @apiSuccess {Number} price: 20
 * @apiSuccess {String} status: "1"
 * @apiSuccess {String} time: "00:30:00"
 * @apiSuccess {String} type: "1"
 * @apiSuccess {Date} updDate: null
 * @apiSuccess {Number} updUser: null
 * 
 */
api.get('/service/by-lesson/:id', controller.getServiceByLesson);
/**
 * @api {get} /schedule/lessons-by-establishment/:id Request All Lessons by establishment
 * @apiVersion 1.0.0
 * @apiName getLessonsByEstablishment
 * @apiGroup Schedule
 *
 * @apiDescription Return all the exist lessons of establishment.
 * 
 * @apiPermission Authorized users only
 * 
 * @apiParam {Number} id                Unique id of the lesson.
 * 
 * @apiSuccess {Number} lessonWithReserves.allDay: 0
 * @apiSuccess {String} lessonWithReserves.color: "#800080"
 * @apiSuccess {Number} lessonWithReserves.disciplineId: 45725
 * @apiSuccess {String} lessonWithReserves.dsciplineName: "Masajes"
 * @apiSuccess {String} lessonWithReserves.end: "2019-05-18 07:00:00"
 * @apiSuccess {Number} lessonWithReserves.id: 4065400
 * @apiSuccess {String} lessonWithReserves.instructorId: "469345"
 * @apiSuccess {String} lessonWithReserves.instructorName: "Jose  chavez"
 * @apiSuccess {String} lessonWithReserves.instructorPhoto: null
 * @apiSuccess {Number} lessonWithReserves.lessonId: 315052
 * @apiSuccess {String} lessonWithReserves.membershipReserves: ""
 * @apiSuccess {Number} lessonWithReserves.occupancy: 10
 * @apiSuccess {Number} lessonWithReserves.reserves: 1
 * @apiSuccess {Number} lessonWithReserves.romId: 1227
 * @apiSuccess {String} lessonWithReserves.romName: "San isidro"
 * @apiSuccess {String} lessonWithReserves.roomType: "0"
 * @apiSuccess {String} lessonWithReserves.start: "2019-05-18 06:30:00"
 * @apiSuccess {String} lessonWithReserves.status: "0"
 * @apiSuccess {String} lessonWithReserves.title: "Masajes"
 * @apiSuccess {String} lessonWithReserves.type: "1"
 * @apiSuccess {String} lessonWithReserves.unpaidReserves: "viernes modo cine viernes modo cine"
 * @apiSuccess {String} lessonWithReserves.url: "/admin/#/lessons/4037931"
 * 
 * @apiSuccess {Number} lessonWithoutReserves.allDay: 0
 * @apiSuccess {String} lessonWithoutReserves.color: "#800080"
 * @apiSuccess {Number} lessonWithoutReserves.disciplineId: 45725
 * @apiSuccess {String} lessonWithoutReserves.dsciplineName: "Masajes"
 * @apiSuccess {String} lessonWithoutReserves.end: "2019-05-18 07:00:00"
 * @apiSuccess {Number} lessonWithoutReserves.id: 4065400
 * @apiSuccess {String} lessonWithoutReserves.instructorId: "469345"
 * @apiSuccess {String} lessonWithoutReserves.instructorName: "Jose  chavez"
 * @apiSuccess {String} lessonWithoutReserves.instructorPhoto: null
 * @apiSuccess {Number} lessonWithoutReserves.lessonId: 315052
 * @apiSuccess {String} lessonWithoutReserves.membershipReserves: ""
 * @apiSuccess {Number} lessonWithoutReserves.occupancy: 10
 * @apiSuccess {Number} lessonWithoutReserves.reserves: 1
 * @apiSuccess {Number} lessonWithoutReserves.romId: 1227
 * @apiSuccess {String} lessonWithoutReserves.romName: "San isidro"
 * @apiSuccess {String} lessonWithoutReserves.roomType: "0"
 * @apiSuccess {String} lessonWithoutReserves.start: "2019-05-18 06:30:00"
 * @apiSuccess {String} lessonWithoutReserves.status: "0"
 * @apiSuccess {String} lessonWithoutReserves.title: "Masajes"
 * @apiSuccess {String} lessonWithoutReserves.type: "1"
 * @apiSuccess {String} lessonWithoutReserves.unpaidReserves: "viernes modo cine viernes modo cine"
 * @apiSuccess {String} lessonWithoutReserves.url: "/admin/#/lessons/4037931"
 * 
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    {
 *          "lessonWithReserves":
 *              [
 *                  {
 *                      "id":4065400,
 *                      "lessonId":315052,
 *                      "type":"1",
 *                      "title":"Masajes",
 *                      "start":"2019-05-18 06:30:00",
 *                      "end":"2019-05-18 07:00:00",
 *                      "color":"#800080",
 *                      "url":"/admin/#/lessons/4065400",
 *                      "allDay":0,"disciplineId":45725,
 *                      "dsciplineName":"Masajes",
 *                      "occupancy":10,
 *                      "reserves":1,
 *                      "unpaidReserves":"viernes modo cine viernes modo cine",
 *                      "membershipReserves":"",
 *                      "romId":1227,
 *                      "romName":"San isidro",
 *                      "instructorName":"Jose  chavez",
 *                      "status":"0","instructorPhoto":null,
 *                      "instructorId":"469345",
 *                      "roomType":"0"
 *                  },
 *                  ...
 *              ],
 *          "lessonWithoutReserves":
 *              [
 *                  {
 *                      "id":3995814,
 *                      "lessonId":297094,
 *                      "type":"1",
 *                      "title":"Sesión de Nutrición",
 *                      "start":"2019-05-13 09:00:00",
 *                      "end":"2019-05-13 10:00:00",
 *                      "color":"#800080",
 *                      "url":"/admin/#/lessons/3995814",
 *                      "allDay":0,
 *                      "disciplineId":45991,
 *                      "dsciplineName":"Sesión de Nutrición",
 *                      "occupancy":1,
 *                      "reserves":0,
 *                      "unpaidReserves":"",
 *                      "membershipReserves":"",
 *                      "romId":998,
 *                      "romName":"Salón Pilates",
 *                      "instructorName":"Alexandra Rivera",
 *                      "status":"0",
 *                      "instructorPhoto":"https://s3-us-west-2.amazonaws.com/fitco-storage/profiles/profile-5295787DXzN.png",
 *                      "instructorId":"529578",
 *                      "roomType":"0"
 *                  },
 *                  ...
 *              ]
 *    }
 * 
 * @apiErrorExample {json} Schedule not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Find error
 *    HTTP/1.1 500 Internal Server Error
 */
api.get('/lessons-by-establishment/:id', controller.getLessonsByEstablishment);
/**
 * @api {get} /schedule/lessons-by-type/:id Request All Lessons By Type
 * @apiVersion 1.0.0
 * @apiName getLessonsServices
 * @apiGroup Schedule
 *
 * @apiDescription Return all lessons by lesson type.
 * 
 * @apiPermission Authorized users only
 * 
 * @apiParam {Number} id                Unique id of the lesson type.
 * 
 * @apiSuccess {Number} days: Array of days enabled for the lesson [0,0,0,0,0,0,1] (starts on monday, 0 inactive, 1 active)
 * @apiSuccess {Number} disDate: null
 * @apiSuccess {Number} disUser: null
 * @apiSuccess {Number} disciplineId: null
 * @apiSuccess {Number} disciplineName: "Masajes"
 * @apiSuccess {Number} endDate: "18/05/2019"
 * @apiSuccess {Number} endTime: "07:00:00"
 * @apiSuccess {Number} establishmentId: 303
 * @apiSuccess {Number} id: 315052
 * @apiSuccess {Number} insDate: "2019-05-21T21:18:08.000Z"
 * @apiSuccess {Number} insUser: 1
 * @apiSuccess {Number} instructor: "Jose  chavez"
 * @apiSuccess {Number} planDisponibilityId: null
 * @apiSuccess {Number} referenceEndTime: null
 * @apiSuccess {Number} referenceInstructor: 469345
 * @apiSuccess {Number} referenceOcupancy: 10
 * @apiSuccess {Number} referenceRoomId: 1227
 * @apiSuccess {Number} referenceStartTime: null
 * @apiSuccess {Number} roomType: "0"
 * @apiSuccess {Number} showOnApp: "1"
 * @apiSuccess {Number} special: ""
 * @apiSuccess {Number} startDate: "18/05/2019"
 * @apiSuccess {Number} startTime: "06:00:00"
 * @apiSuccess {Number} status: "1"
 * @apiSuccess {Number} type: "1"
 * @apiSuccess {Number} untilDate: "2019-05-18T00:00:00.000Z"
 * @apiSuccess {Number} updDate: null
 * @apiSuccess {Number} updUser: null
 * 
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    [
 *      {
 *          days: "[0,0,0,0,0,0,1]"
 *          disDate: null
 *          disUser: null
 *          disciplineId: null
 *          disciplineName: "Masajes"
 *          endDate: "18/05/2019"
 *          endTime: "07:00:00"
 *          establishmentId: 303
 *          id: 315052
 *          insDate: "2019-05-21T21:18:08.000Z"
 *          insUser: 1
 *          instructor: "Jose  chavez"
 *          planDisponibilityId: null
 *          referenceEndTime: null
 *          referenceInstructor: 469345
 *          referenceOcupancy: 10
 *          referenceRoomId: 1227
 *          referenceStartTime: null
 *          roomType: "0"
 *          showOnApp: "1"
 *          special: ""
 *          startDate: "18/05/2019"
 *          startTime: "06:00:00"
 *          status: "1"
 *          type: "1"
 *          untilDate: "2019-05-18T00:00:00.000Z"
 *          updDate: null
 *          updUser: null
 *      },
 *      ...
 *    ]
 * @apiErrorExample {json} lesson not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Find error
 *    HTTP/1.1 500 Internal Server Error
 */
api.get('/lessons-by-type/:id', controller.getLessonsServices);
/**
 * @api {get} /:establishmentId/by-user/:userEstablishmentId/by-service/:servId Request all Schedules by user and service.
 * @apiVersion 1.0.0
 * @apiName getScheduleByEstablishmentByUser
 * @apiGroup Schedule
 *
 * @apiDescription Return all the exist schedules by user and service.
 * 
 * @apiPermission Authorized users only
 * 
 * @apiSuccess {Number} id              Unique id of the feature.
 * @apiSuccess {String} value           Value of the feature.
 * @apiSuccess {String} description     Description of the feature.
 * @apiSuccess {String} status          Status of the feature (Active:'1'/Inactive:'0').
 * @apiSuccess {Date} insDate           Creation date of the feature.
 * @apiSuccess {String} insUser         Creation user of the feature.
 * @apiSuccess {Date} updDate           Update date of the feature.
 * @apiSuccess {String} updUser         Update user of the feature.
 * @apiSuccess {Date} delDate           Delete date of the feature.
 * @apiSuccess {String} delUser         Delete user of the feature.
 * 
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    [
 *      {
 *          "id":1,
 *          "name":"Dashboard",
 *          "description":null,
 *          "status":"1",
 *          "icon":null,
 *          "route":null,
 *          "menuId":1,
 *          "shareModule":"N"
 *      },
 *      {
 *          "id":2,"name":"Clases",
 *          "description":null,
 *          "status":"1",
 *          "icon":null,
 *          "route":null,
 *          "menuId":2,
 *          "shareModule":"N"
 *      },
 *      ...
 *    ]
 * @apiErrorExample {json} Features not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Find error
 *    HTTP/1.1 500 Internal Server Error
 */
api.get('/:establishmentId/by-user/:userEstablishmentId/by-service/:servId', controller.getScheduleByEstablishmentByUser);
/**
 * @api {get} /schedule/by-services-day/:id Request all services by day
 * @apiVersion 1.0.0
 * @apiName getServicesByDay
 * @apiGroup Schedule
 *
 * @apiDescription Return list of all services by day.
 * 
 * @apiPermission Authorized users only
 * 
 * @apiParam {Number} id                Unique id of the service type.
 * 
 * @apiSuccess {Number} days: Array of days enabled for the lesson [0,0,0,0,0,0,1] (starts on monday, 0 inactive, 1 active)
 * @apiSuccess {Number} disDate: null
 * @apiSuccess {Number} disUser: null
 * @apiSuccess {Number} disciplineId: null
 * @apiSuccess {Number} disciplineName: "Masajes"
 * @apiSuccess {Number} endDate: "18/05/2019"
 * @apiSuccess {Number} endTime: "07:00:00"
 * @apiSuccess {Number} establishmentId: 303
 * @apiSuccess {Number} id: 315052
 * @apiSuccess {Number} insDate: "2019-05-21T21:18:08.000Z"
 * @apiSuccess {Number} insUser: 1
 * @apiSuccess {Number} instructor: "Jose  chavez"
 * @apiSuccess {Number} planDisponibilityId: null
 * @apiSuccess {Number} referenceEndTime: null
 * @apiSuccess {Number} referenceInstructor: 469345
 * @apiSuccess {Number} referenceOcupancy: 10
 * @apiSuccess {Number} referenceRoomId: 1227
 * @apiSuccess {Number} referenceStartTime: null
 * @apiSuccess {Number} roomType: "0"
 * @apiSuccess {Number} showOnApp: "1"
 * @apiSuccess {Number} special: ""
 * @apiSuccess {Number} startDate: "18/05/2019"
 * @apiSuccess {Number} startTime: "06:00:00"
 * @apiSuccess {Number} status: "1"
 * @apiSuccess {Number} type: "1"
 * @apiSuccess {Number} untilDate: "2019-05-18T00:00:00.000Z"
 * @apiSuccess {Number} updDate: null
 * @apiSuccess {Number} updUser: null
 * 
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    [
 *      {
 *          days: "[0,0,0,0,0,0,1]"
 *          disDate: null
 *          disUser: null
 *          disciplineId: null
 *          disciplineName: "Masajes"
 *          endDate: "18/05/2019"
 *          endTime: "07:00:00"
 *          establishmentId: 303
 *          id: 315052
 *          insDate: "2019-05-21T21:18:08.000Z"
 *          insUser: 1
 *          instructor: "Jose  chavez"
 *          planDisponibilityId: null
 *          referenceEndTime: null
 *          referenceInstructor: 469345
 *          referenceOcupancy: 10
 *          referenceRoomId: 1227
 *          referenceStartTime: null
 *          roomType: "0"
 *          showOnApp: "1"
 *          special: ""
 *          startDate: "18/05/2019"
 *          startTime: "06:00:00"
 *          status: "1"
 *          type: "1"
 *          untilDate: "2019-05-18T00:00:00.000Z"
 *          updDate: null
 *          updUser: null
 *      },
 *      ...
 *    ]
 * @apiErrorExample {json} lesson not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Find error
 *    HTTP/1.1 500 Internal Server Error
 */
api.get('/by-services-day/:id', controller.getServicesByDay);
/**
 * @api {get} /schedule/instructor-by-day/:id/:serviceId Request all instructors by service in day.
 * @apiVersion 1.0.0
 * @apiName getInstructorByDay
 * @apiGroup Schedule
 *
 * @apiDescription Return all instructors avaible for a service in day.
 * 
 * @apiPermission Authorized users only
 * 
 * @apiParam {Number} id                    Unique id of the establishment.
 * @apiParam {Number} serviceId             Unique id of the service.
 * 
 * @apiSuccess {String} endTime             End time of the availability.
 * @apiSuccess {Number} id                  Unique id of the availability.
 * @apiSuccess {String} instructorName      Instructor name of the service.
 * @apiSuccess {Number} intructorId         Unique id of the instructor.
 * @apiSuccess {String} name                Name of the service.
 * @apiSuccess {Number} ocupancy            Ocuppancy of the service.
 * @apiSuccess {Number} price               Price of the service.
 * @apiSuccess {Number} roomId              Unique id of the room.
 * @apiSuccess {String} roomName            Room name of the service.
 * @apiSuccess {Number} serviceId           Unique id of the service.
 * @apiSuccess {String} startTime           End time of the availability.
 * 
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    [
 *      {
 *          endTime: "20:00:00",
 *          id: 297094,
 *          instructorName: "Jose  chavez",
 *          intructorId: 469345,
 *          name: "Masajes",
 *          ocupancy: 1,
 *          price: 20,
 *          roomId: 998,
 *          roomName: "Salón Pilates",
 *          serviceId: 45725,
 *          startTime: "09:00:00"
 *      },
 *      ...
 *    ]
 * @apiErrorExample {json} Features not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Find error
 *    HTTP/1.1 500 Internal Server Error
 */
api.get('/instructor-by-day/:id/:serviceId', controller.getInstructorByDay);
/**
 * @api {get} /schedule/times-by-lesson/:lessonId Request all avaible times on a lesson
 * @apiVersion 1.0.0
 * @apiName getTimesEnablesByLesson
 * @apiGroup Schedule
 *
 * @apiDescription Return all available hours of a lesson.
 * 
 * @apiPermission Authorized users only
 * 
 * @apiParam {Number} lessonId              Unique id of the establishment.
 * 
 * @apiSuccess {String} endTime             End time of the availability
 * @apiSuccess {String} startTime           Start time of the availability
 * 
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    [
 *      {
 *          "startTime":"08:00:00",
 *          "endTime":"09:00:00"
 *      }
 *    ]
 * 
 * @apiErrorExample {json} Availability not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Find error
 *    HTTP/1.1 500 Internal Server Error
 */
api.get('/times-by-lesson/:lessonId', controller.getTimesEnablesByLesson);
/**
 * @api {put} /schedule/cancel-lesson/:id Update lesson for cancellation
 * @apiVersion 1.0.0
 * @apiName changeStatus
 * @apiGroup Schedule
 *
 * @apiDescription Modify a lesson that needs to be canceled.
 * @apiPermission Authorized users only
 * 
 * @apiParam {Number} id        Unique id of the lesson.
 * 
 * @apiSuccess {String} msg     Success message.
 * @apiSuccess {String} title   Title success message.
 * 
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    {
 *      "msg":"GLOBAL.OK",
 *      "title":"GLOBAL.EXITO"
 *    }
 * 
 * @apiErrorExample {json} Schedule not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Find error
 *    HTTP/1.1 500 Internal Server Error
 * 
 */
api.put('/cancel-lesson/:id', controller.changeStatus);
/**
 * @api {put} /schedule/lesson-update/:id Update lesson information
 * @apiVersion 1.0.0
 * @apiName lessonUpdate
 * @apiGroup Schedule
 *
 * @apiPermission Authorized users only
 * 
 * @apiParam {Number} id        Unique id of the lesson
 * 
 * @apiSuccess {String} msg     Success message.
 * @apiSuccess {String} title   Title success message.
 * 
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    {
 *      "msg":"GLOBAL.OK",
 *      "title":"GLOBAL.EXITO"
 *    }
 * 
 * @apiErrorExample {json} Schedule not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Find error
 *    HTTP/1.1 500 Internal Server Error
 */
api.put('/lesson-update/:id', controller.lessonUpdate);
/**
 * @api {put} /schedule/unpaid/:id Update unpaid lesson information
 * @apiVersion 1.0.0
 * @apiName unpaidUpdate
 * @apiGroup Schedule
 *
 * @apiPermission Authorized users only
 * 
 * @apiParam {Number} id        Unique id of the unpaid lesson.
 * 
 * @apiSuccess {String} msg     Success message.
 * @apiSuccess {String} title   Title success message.
 * 
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    {
 *      "msg":"GLOBAL.OK",
 *      "title":"GLOBAL.EXITO"
 *    }
 * 
 * @apiErrorExample {json} Unpaid lesson not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Find error
 *    HTTP/1.1 500 Internal Server Error
 */
api.put('/unpaid/:id', controller.unpaidUpdate);
api.delete('/:id/cancel-schedule/:membershipLessonId', controller.cancelMembershipSchedule);
/**
 * @api {post} /schedule/unpaid Create unpaid lesson
 * @apiVersion 1.0.0
 * @apiName saveUnpaid
 * @apiGroup Schedule
 *
 * @apiDescription Create a unpaid lesson that is visible from the schedule of the fitco solution.
 * 
 * @apiPermission Authorized users only
 * 
 * @apiParam {Number} amount                    Amount of the unpaid lesson
 * @apiParam {Number} insUser                   Unique id of the insert user
 * @apiParam {Number} lessonRecordId            Unique id of the lesson record
 * @apiParam {String} status                    Status of the unpaid lesson ('0' inactive, '1' active)
 * @apiParam {String} title                     Title of the unpaid lesson
 * @apiParam {Number} userEstablishmentId       Unique id of the user establishment
 * 
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    {
 *      "msg":"GLOBAL.OK",
 *      "title":"GLOBAL.EXITO"
 *    }
 * 
 * @apiErrorExample {json} Schedule not found
 *    HTTP/1.1 404 Not Found
 * @apiErrorExample {json} Find error
 *    HTTP/1.1 500 Internal Server Error
 * 
 */
api.post('/unpaid', controller.saveUnpaid);
api.delete('/clean-lesson-record/:id', controller.cleanLessonRecord);
api.delete('/delete/lesson/:id', controller.deleteLesson);
api.get('/:id/by-calendar', controller.getLessonRecordId);

api.post('/calendar-day-lock', controller.setDayLock);
/**
 * @api {put} /schedule/:id/calendar-day-lock Update schedule lock information
 * @apiVersion 1.0.0
 * @apiName updDayLock
 * @apiGroup Schedule
 *
 * @apiPermission Authorized users only
 * 
 * @apiParam {Number} id                    Unique id of the schedule lock.
 * @apiParam {Number} fromDate              Start date of the schedule lock.
 * @apiParam {Number} toDate                End date of the schedule lock.
 * @apiParam {Number} allDay                Status to set schedule to all day. ('0': inactive, '1': active)
 * @apiParam {Number} repeatOption          Status to set schedule to repeat rule. ('0': inactive, '1': active)
 * @apiParam {Number} eachOption            Status to active to repeat schedule lock for a number of times.
 * @apiParam {Number} eachNumber            Number of times to repeat schedule lock.
 * @apiParam {Number} inDay                 Days to repeat schedule lock. (LU,MA,JU)
 * @apiParam {Number} forever               Status to repear schedule lock forever. ('0': inactive, '1': active)
 * @apiParam {Number} finishDate            Finish date to repeat schedule lock.
 * @apiParam {Number} updUser               Unique id of the user update schedule lock.
 * 
 * @apiSuccess {String} msg     Success message.
 * @apiSuccess {String} title   Title success message.
 */
api.put('/:id/calendar-day-lock', controller.updDayLock);
api.delete('/:id/calendar-day-lock', controller.delDayLockForDate);
api.get('/:id/calendar-day-lock', controller.getDayLock);
api.get('/calendar-day-lock', controller.getDayLockForDate);


api.get('/lesson-app/:id/:serviceId', controller.getServiceLessonsForApp);

api.get('/:id/by-establishment', controller.getDisciplinesbyEstablishment);

api.get('/:id/by-establishment/:search', controller.getDisciplinesbyEstablishment);

module.exports = api;