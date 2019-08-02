'use strict'

const config = require('../bin/config');

function ifNotEmpty (obj) {
    return obj ? true : false;
}

function ifNotNull (obj) {
    return obj != null;
}

function ifNotEmptyOrNull (obj) {
    return obj || obj != null;
}

function ifArrayNotEmptyOrNull (arr) {
    return arr.length > 0 || arr != null;
}

function ifMinor (num1, num2) {
    return num1 < num2;
}

function ifMayor (num1, num2) {
    return num1 > num2;
}

function appParameters (param) {
    return {
        page: ifNotEmptyOrNull(param.page) ? param.page : config.constants.NUMBER_ONE,
        lang: ifNotEmptyOrNull(param.lang) ? param.lang : config.constants.STR_UPPERCASE_ABBREVIATION_SPANISH_LANG,
        cbp: ifNotEmptyOrNull(param.cbp) ? param.cbp : config.constants.NUMBER_TEN,
        orderby: ifNotEmptyOrNull(param.orderby) ? param.orderby : config.constants.STR_LOWERCASE_ABBREVIATION_IDENTIFIER,
        order: ifNotEmptyOrNull(param.order) ? param.order : config.constants.STR_LOWECASE_ABBREVIATION_DESCENDANT,
        testPlan: ifNotEmptyOrNull(param.testPlan) ? param.testPlan : null,
        typePlan: ifNotEmptyOrNull(param.typePlan) ? param.typePlan : config.constants.EMPTY_CHARACTER,
        statusApp: ifNotEmptyOrNull(param.statusApp) ? param.statusApp : null,
        dateStart: ifNotEmptyOrNull(param.dateStart) ? param.dateStart : param.dateStart,
        dateEnd: ifNotEmptyOrNull(param.dateEnd) ? param.dateEnd : param.dateEnd,
        typeD: ifNotEmptyOrNull(param.typeD) ? param.typeD : config.constants.CHAR_ZERO,
        typeP: param.typeP === 'S' ? '4' : 0
    };
};

module.exports = {
    ifNotEmpty,
    ifNotNull,
    ifNotEmptyOrNull,
    ifMinor,
    ifMayor,
    ifArrayNotEmptyOrNull,
    appParameters
}