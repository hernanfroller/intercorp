'use strict'

const express = require('express');
const api = express.Router();
const controller = require('../controllers/schedule.controller');

router.post('/', controller.setLesson);

api.post('/calendar-day-lock', controller.setDayLock);
api.put('/:id/calendar-day-lock', controller.updDayLock);
api.delete('/:id/calendar-day-lock', controller.delDayLockForDate);
api.get('/:id/calendar-day-lock', controller.getDayLock);
api.get('/calendar-day-lock', controller.getDayLockForDate);

module.exports = api;