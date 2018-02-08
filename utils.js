"use strict";

import {arrayLike} from "./type_checks.js";

let own = ((own)=>(x, i)=>own.call(x, i))(Object.prototype.hasOwnProperty);

export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function post(url, data, callback, fail_callback, opts) {
    let r = new XMLHttpRequest();
    let q = data;
    if(typeof(q) !== 'string' && (!opts || !opts.raw)){
        q = JSON.stringify(q);
    }
    r.onreadystatechange = function() {
        if (r.readyState === 4) {
            if (r.status >= 200 && r.status < 300) {
                if (callback) callback(r.responseText, r);
            } else { // e.g sleep
                if (fail_callback) fail_callback(r.responseText, r);
            }
        }
    };
    try {
        r.open('POST', url, true);
    } catch(e) {
        return false;
    }
    let ct_sent = false;
    if(opts && opts.headers){
        for(let i in opts.headers){
            if(i.toLowerCase() === 'content-type') ct_sent = true;
            r.setRequestHeader(i, opts.headers[i]);
        }
    }
    if (!opts || !opts.urlonly) {
        if(!ct_sent || !opts.no_content_type) r.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
        r.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    }
    r.send(q);
    return r;
}

export function splitOnce(str, splitter) {
    let ind = str.indexOf(splitter);
    if(ind < 0) return [str];

    let start = str.substring(0, ind);
    let rest = str.substring(ind + splitter.length);

    return [start, rest];
}

export function parseQuery(query, tuples) {
    if(query[0] === '?') query = query.substring(1);

    if(arguments.length < 2) tuples = False;

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
export function escapeRegExp(s) {
    return s.replace(escapeRegExpRe, '\\$&');
}

export function post_buffer(url, data, callback, fail_callback, opts) {
    if(!opts) opts = {};
    opts.raw = true;
    opts.no_content_type = true;
    post(url, data, callback, fail_callback, opts);
}

export function escapeSpecialChars(str) {
    return str.replace(/[\\]/g, '\\\\')
              .replace(/["]/g,  '\\"')
              .replace(/[\b]/g, '\\b')
              .replace(/[\f]/g, '\\f')
              .replace(/[\n]/g, '\\n')
              .replace(/[\r]/g, '\\r')
              .replace(/[\t]/g, '\\t');
}

export function basename(path) {
     return path.replace( /\\/g, '/' ).replace( /.*\//, '' );
}
export function dirname(path) {
     return path.replace( /\\/g, '/' ).replace( /\/[^\/]*$/, '' );
}

export function toArray(item){
    if (item == null) return [];
    return (item instanceof Array) ? item : arrayLike(item) ? Array.prototype.slice.call(item) : [item];
}

export {own};
