'use strict'

const express = require('express');
const api = express.Router();
const controller = require('../controllers/schedule.controller');

api.post('/', controller.setLesson);
api.post('/:id/membership-lesson', controller.setMembershipSchedule);
api.post('/lesson-record-and-membership', controller.addAndValidateMemberships);
api.get('/by-establishment/:id', controller.getScheduleByEstablishment);
api.get('/service/by-personal/:id', controller.getServiceByPersonal);
api.get('/service/by-lesson/:id', controller.getServiceByLesson);
api.get('/lessons-by-establishment/:id', controller.getLessonsByEstablishment);
api.get('/lessons-by-type/:id', controller.getLessonsServices);
api.get('/:establishmentId/by-user/:userEstablishmentId/by-service/:servId', controller.getScheduleByEstablishmentByUser);
api.get('/by-services-day/:id', controller.getServicesByDay);
api.get('/instructor-by-day/:id/:serviceId', controller.getInstructorByDay);
api.get('/times-by-lesson/:lessonId', controller.getTimesEnablesByLesson);
api.put('/cancel-lesson/:id', controller.changeStatus);
api.put('/lesson-update/:id', controller.lessonUpdate);
api.put('/unpaid/:id', controller.unpaidUpdate);
api.delete('/:id/cancel-schedule/:membershipLessonId', controller.cancelMembershipSchedule);
api.post('/unpaid', controller.saveUnpaid);
api.delete('/clean-lesson-record/:id', controller.cleanLessonRecord);
api.delete('/delete/lesson/:id', controller.deleteLesson);
api.get('/lesson-app/:id/:serviceId', controller.getLessonsForApp);
api.get('/:id/by-calendar', controller.getLessonRecordId);

api.post('/calendar-day-lock', controller.setDayLock);
api.put('/:id/calendar-day-lock', controller.updDayLock);
api.delete('/:id/calendar-day-lock', controller.delDayLockForDate);
api.get('/:id/calendar-day-lock', controller.getDayLock);
api.get('/calendar-day-lock', controller.getDayLockForDate);

module.exports = api;