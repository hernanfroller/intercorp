'use strict'

function ifNotEmpty (obj) {
    if (obj) return true;
    return false;
}

function ifNotNull (obj) {
    if (obj != null) return true;
    return false;
}

function ifNotEmptyOrNull (obj) {
    if (obj || obj != null) return true;
    return false;
}

module.exports = {
    ifNotEmpty,
    ifNotNull,
    ifNotEmptyOrNull
}