"use strict";

export function isString(a) {
    return (typeof a === "string") || (a instanceof String);
}
export function isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
}
export function isFunction(obj) {
    return typeof(obj) === 'function';
}

export function arrayLike(item){
    if(typeof(item)=== "string") return false; //string is mostly like array, but it is still a primitive
    return (item != null && typeof(item.length) === 'number'//Can't remember, why the last test is necessary
        && Object.prototype.toString.call(item) !== '[object Function]');
}

export function isNumber(obj){
    try{
        return !isNaN(obj);
    }catch(e){
        return false; // case it's Symbol
    }
}
