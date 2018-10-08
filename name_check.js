"use strict";

export function isValidFunctionName( name ) {
    try {
        eval('(function() { function ' + name + '() {} })()');
    } catch( e ) {
        return false;
    }
    return true;
}
