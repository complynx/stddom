"use strict";
/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import {arrayLike} from "./type_checks.js";

/**
 * hasOwnProperty caller
 */
let own = ((own)=>(x, i)=>own.call(x, i))(Object.prototype.hasOwnProperty);

/**
 * Capitalizes the first letter of a provided string
 * @param   {string}    string
 * @returns {string}    String
 */
export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Fetching json->json
 * Performed tests for 200 resp, and ensured options.body is json, and request method is POST if necessary.
 * And automatic resp JSON interpretation.
 * @param   {string}    url
 * @param   {*=}        options
 * @returns {Promise<Response | never>}
 */
export function fetch_json(url, options={}) {
    if(options && options.body && typeof options.body !== "string")
        options.body = JSON.stringify(options.body);
    return fetch_test(url, options).then(r=>r.json());
}

/**
 * Fetching json->json
 * Performed tests for 200 resp, and request method is POST if necessary.
 * @param   {string}    url
 * @param   {*=}        options
 * @returns {Promise<Response | never>}
 */
export function fetch_test(url, options={}) {
    if(options){
        if(!options.method && options.body)
            options.method = 'POST';
    }
    return fetch(url, options).then(r=>{
        if(!r.ok) throw new Error('HTTP error, status = ' + response.status);
        return r;
    });
}

/**
 * Splits a string once with a delimiter
 * @param   {string}    str         what to split
 * @param   {string}    splitter    what to search
 * @returns {[string, string]}      start and rest of the str
 */
export function splitOnce(str, splitter) {
    let ind = str.indexOf(splitter);
    if(ind < 0) return [str];

    let start = str.substring(0, ind);
    let rest = str.substring(ind + splitter.length);

    return [start, rest];
}

/**
 * Parses form-data format.
 * @param   {string}    query
 * @param   {boolean=}  tuples      return array of k-v pairs rather then an object
 * @returns {*}
 */
export function parseQuery(query, tuples) {
    if(query[0] === '?') query = query.substring(1);

    if(arguments.length < 2) tuples = false;

    let args = query.split('&');

    let ret = tuples ? [] : {};

    function add(key, value) {
        if(tuples){
            ret.push([key, value]);
        }else{
            ret[key] = value;
        }
    }

    for (let i=0; i < args.length; i++) {
        let arg = args[i];

        if (-1 === arg.indexOf('=')) {
            add(decodeURIComponent(arg).trim(), true);
        }
        else {
            let kvp = splitOnce(arg, '=');

            add(decodeURIComponent(kvp[0]).trim(), decodeURIComponent(kvp[1]).trim());
        }
    }

    return ret;
}

let escapeRegExpRe = /[-\/\\^$*+?.()|[\]{}]/g;

/**
 * Escapes regexp special characters.
 * @param   {string} s
 * @returns {string}
 */
export function escapeRegExp(s) {
    return s.replace(escapeRegExpRe, '\\$&');
}

/**
 * C++ special characters escaper
 * @param   {string} str
 * @returns {string}
 */
export function escapeSpecialChars(str) {
    return str.replace(/[\\]/g, '\\\\')
              .replace(/["]/g,  '\\"')
              .replace(/[\b]/g, '\\b')
              .replace(/[\f]/g, '\\f')
              .replace(/[\n]/g, '\\n')
              .replace(/[\r]/g, '\\r')
              .replace(/[\t]/g, '\\t');
}

let htmlEscapeTextConverter = document.createElement('div');

/**
 * Escapes HTML entities using browser engine
 * @param   {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
    htmlEscapeTextConverter.innerText = text;
    return htmlEscapeTextConverter.innerHTML;
}

/**
 * splits path string (unix) and returns basename
 * @param   {string}    path
 * @returns {string}
 */
export function basename(path) {
     return path.replace( /\\/g, '/' ).replace( /.*\//, '' );
}
/**
 * splits path string (unix) and returns dirname
 * @param   {string}    path
 * @returns {string}
 */
export function dirname(path) {
     return path.replace( /\\/g, '/' ).replace( /\/[^\/]*$/, '' );
}

/**
 * Returns array from item, wraps it if necessary.
 * @param   {*}         item
 * @returns {Array}
 */
export function toArray(item){
    if (item == null) return [];
    return (item instanceof Array) ? item : arrayLike(item) ? Array.prototype.slice.call(item) : [item];
}

/**
 * Returns string that is cleaned from it's linked ancestors (see V8 string manipulation optimization)
 * To save speed, with a link to ' ' + str, but not more.
 * @param   {String} 	str
 * @returns {String}	str without links
 */
export function cleanString(str){
    if(str.length<13) return str;
    return (' ' + str).slice(1);
}

export {own};
