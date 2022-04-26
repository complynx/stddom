"use strict";
/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
let toStr = ((ts)=>(o)=>ts.call(o))(Object.prototype.toString);

export function isString(a) {
    return (typeof a === "string") || (a instanceof String);
}
export function isObject(obj) {
    return toStr(obj) === '[object Object]';
}
export function isFunction(obj) {
    return typeof(obj) === 'function' || (obj instanceof Function);
}

export function arrayLike(item){
    if(typeof(item)=== "string") return false; //string is mostly like array, but it is still a primitive
    return (item != null && isInteger(item.length) && item.length >= 0
        && toStr(item) !== '[object Function]'); //Can't remember, why/where the last test is necessary
}

let GeneratorClass = (function*(){}).constructor;
export function isGenerator(item) {
    return item instanceof GeneratorClass;
}

let AsyncFunctionClass = (async function(){}).constructor;
export function isAsyncFunction(item) {
    return item instanceof AsyncFunctionClass;
}

export function isNumber(obj){
    if(isString(obj) || typeof obj === 'number'){
        if(isString(obj) && (obj === '' || obj.trim() === '')) return false;

        try{
            return !isNaN(obj) && obj !== null;
        }catch(e){
            return false; // case it's Symbol
        }
    }
    return false;
}

export function isInteger(x) {
    return !isNaN(x) && !((x=parseFloat(x))%1) && x<=Number.MAX_SAFE_INTEGER && x>=Number.MIN_SAFE_INTEGER;
}

export function isArrayBufferView(obj) {
    return obj?.buffer instanceof ArrayBuffer
}

export function isBlobPart(obj) {
    return isString(obj) ||
    (
        obj instanceof ArrayBuffer ||
        obj instanceof Blob ||
        isArrayBufferView(obj)
    );
}
