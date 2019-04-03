"use strict";
/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
export function isValidFunctionName( name ) {
    try {
        eval('(function() { function ' + name + '() {} })()');
    } catch( e ) {
        return false;
    }
    return true;
}
