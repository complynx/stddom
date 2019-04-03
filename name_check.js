"use strict";
/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
/**
 * checks whether name can be used as a function name or any other JS literal. (regarding current browser)
 * Emoji and other strange characters counts.
 * @param   {string}    name
 * @returns {boolean}
 */
export function isValidFunctionName( name ) {
    try {
        eval('(function() { function ' + name + '() {} })()');
    } catch( e ) {
        return false;
    }
    return true;
}
