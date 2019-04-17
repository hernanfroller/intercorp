'use strict'

const transversal = require('./transversal.service');
const log = require('./log.service');
const schedule = require('./schedule.service');
const lessons = require('./lessons.service');
const memberships = require('./memberships.service');
const disciplines = require('./disciplines.service');
const mailer = require('./mailer.service');

module.exports = {
    transversal,
    log,
    schedule,
    lessons,
    memberships,
    disciplines,
    mailer
}