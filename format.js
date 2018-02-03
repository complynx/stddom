import {arrayLike, isObject, isFunction, isNumber} from "./type_checks.js";
import {toArray, own} from "./utils.js";

let format_re = /^((.)?[><=^])?([-+\s])?(#)?(0)?([1-9][0-9]*)?(\.[0-9]*)?(.)?$/g;

export function pad(str, min_length, pad, pad_type) {
    if(str.length >= min_length) return str;
    if(!pad_type) pad_type = '<';

    let padlen = min_length - str.length;
    if(pad_type === '<') return str + pad.repeat(padlen);
    if(pad_type === '>') return pad.repeat(padlen) + str;

    let half = Math.ceil(padlen/2);
    return pad.repeat(half) + str + pad.repeat(padlen - half);
}

let formats = {
    b: function () {
        return Number.parseInt(arguments[0]).toString(2);
    },
    c: function () {
        return String.fromCharCode(arguments[0]);
    },
    d: function () {
        return Number.parseInt(arguments[0]).toString()
    },
    e: function (arg, precision) {
        let v = arg.toExponential(precision || 6);
        let eloc = v.search('e');
        let exponent = v.slice(eloc);
        v = v.slice(0, eloc);
        if (exponent.length === 3) exponent = exponent.slice(0, 2) + '0' + exponent.slice(-1);
        return v + exponent
    },
    E: function () {
        return (formats.e.apply(this, arguments)).toUpperCase();
    },
    f: function (arg, precision) {
        if (precision === false) precision = 6;
        return arg.toFixed(precision);
    },
    F: function () {
        return (formats.f.apply(this, arguments)).toUpperCase();
    },
    g: function (arg, precision) {
        if (arg === 0) return '0';
        if (precision === false) precision = 6;
        let a = Math.abs(arg);
        let v;
        if (1e-4 <= a && a < Math.pow(10, precision)) {
            if (a < 0.1) { // between 1e-4 and 1e-2 Python writes e.g. 0.00123
                let etype = arg.toExponential(precision);
                etype = etype.replace('.', '');
                let eloc = etype.search('e');
                let exponent = Number(etype.slice(eloc + 2));
                let val = etype.slice(0, eloc);
                let length = val.length;
                if (arg < 0) {
                    length++;
                    precision++;
                }
                if (length > precision) val = val.slice(0, precision);
                let sign = '';
                if (val.slice(0, 1) === '-') {
                    sign = '-';
                    val = val.slice(1)
                }
                v = val.slice(0, precision);
                while (v.slice(-1) === '0') v = v.slice(0, -1);
                if (exponent === 2) return sign + '0.0' + v;
                else if (exponent === 3) return sign + '0.00' + v;
                else return sign + '0.000' + v // exponent must be 4
            } else {
                if (a >= 1) precision--;
                v = formats.e(a, precision);
                let eloc = v.search('e');
                let exponent = Number(v.slice(eloc + 1));
                let val = Number(v.slice(0, eloc));
                v = formats.f(val * pow(10, exponent));
                while (v.slice(-1) === '0') v = v.slice(0, -1);
                if (v.slice(-1) === '.') v = v.slice(0, -1);
                return v;
            }
        }
        else {
            precision--;
            v = formats.e(a, precision);
            let eloc = v.search('e');
            let exponent = v.slice(eloc);
            v = v.slice(0, eloc);
            while (v.slice(-1) === '0') v = v.slice(0, -1);
            if (v.slice(-1) === '.') v = v.slice(0, -1);
            return v + exponent;
        }
    },
    G: function () {
        return formats.g.apply(this, arguments).toUpperCase();
    },
    n: function (a) {
        if(Number.isInteger(a)) return formats.d.apply(this, arguments);
        return formats.g.apply(this, arguments);
    },
    o: function () {
        return Number.parseInt(a).toString(8);
    },
    x: function () {
        return Number.parseInt(a).toString(16);
    },
    X: function () {
        return formats.x.apply(this, arguments).toUpperCase();
    },
    '%': function () {
        arguments[0] *= 100;
        return formats.f.apply(this, arguments) + '%';
    }
};

let prefixes = {
    o: '0o',
    x: '0x',
    b: '0b',
    O: '0O',
    X: '0X',
    B: '0B'
};


let dateFormatter;
let isDateObject = function (date) {
    return date instanceof Date;
};

export function setDateFormatter(func, tester) {
    if(isFunction(func)) dateFormatter = func;
    if(isFunction(tester)) isDateObject = tester;
}

import {formatter} from "./dateFormatters/default.js";
setDateFormatter(formatter);

export function format_value(val, fstr){
    if(isObject(val) && isFunction(val.__format__)){
        try {
            return val.__format__(fstr);
        }catch (e){
            console.error(e);
        }
    }
    if(isDateObject(val)){
        return dateFormatter(val, fstr);
    }

    let match = format_re.exec(fstr);

    let filler = match[1] || ' ';
    let fill_type = match[2] || '<';
    let sign = match[3] || '-';
    let prefix_alternate = !!(match[4]);
    if(match[5]) {
        filler = '0';
        fill_type = '=';
    }
    let min_width = match[6] ? Number(match[6]) : 0;
    let precision = match[7] ? Number(match[7]) : false;
    let format = match[8] || '';
    let ret = '';

    if((typeof val === 'number') || (val instanceof Number)){
        if(format === '') format = 'n';

        if(!formats[format]) throw `ValueError: Unknown format code '${format}' for object of type 'number'`;

        ret = formats[format](val, precision);
        let r_sign = ret[0] === '-' ? '-' : '+';
        let r_abs = ret[0] === '-' ? ret.slice(1) : ret;
        if(prefix_alternate){
            r_abs = (prefixes[format] || '') + r_abs;
        }

        if(fill_type === '='){
            ret = r_sign + pad(r_abs, min_width - 1, filler, '>');
        }else{
            if(r_sign === '+' && sign !== '+'){
                r_sign = sign === '-' ? '' : sign;
            }
            ret = pad(r_sign + r_abs, min_width, filler, fill_type);
        }

        return ret;
    }

    if(format === '' || format === 's'){
        if(fill_type === '=') fill_type = '';
        let ret = pad('' + val, min_width, filler, fill_type);
        return precision !== false ? ret.slice(0, precision) : ret;
    }

    throw `ValueError: Unknown format code '${format}' for object of type '${typeof val}'`;
}

export function vformat(str, argc, argv, iterator_key) {
    let values = arrayLike(argc) ? toArray(argc) : [];
    let kvargs = isObject(argv) ? argv : isObject(argc) ? argc : {};
    let in_iterator = arguments.length > 3;

    if(in_iterator){
        kvargs = isObject(argc) ? argc : {};
        if(!isObject(argc) && !arrayLike(argc)){
            values = [argc];
        }
    }

    function get_kv(ref, kv) {
        if(ref.length === 0) return kv;
        let i_pos = ref.search(/[.\[\]]/);
        if(i_pos === 0) throw `Faulty reference: ${ref}`;
        if(i_pos < 0) return kv[ref];

        let index = ref.slice(0, i_pos);
        let rest = ref.slice(i_pos + 1);

        return get_kv(rest, kv[index]);
    }

    function get_value(ref) {
        let i_pos = ref.search(/[.\[\]]/);
        if(i_pos === 0) throw `Faulty reference: ${ref}`;

        let index = i_pos > 0 ? ref.slice(0, i_pos) : ref;

        if(index.match(/^[0-9]*$/g)){
            return get_kv(ref, values);
        }

        return get_kv(ref, kvargs);
    }

    let rest = str;
    let parsed = '';
    let index_shift = 0;
    let brace_stack = [];

    while (rest.length) {
        let brace = rest.search(/[{}]/);
        if(brace < 0){
            parsed += rest;
            rest = '';
            continue;
        }

        parsed += rest.slice(0, brace);
        let b = rest[brace];
        rest = rest.slice(brace + 1);

        if(rest[0] === b && brace_stack.length === 0){
            parsed += b;
            rest = rest.slice(1);
            continue;
        }

        if(b === '{') {
            brace_stack.push(parsed);
            parsed = '';
        }else{
            if(brace_stack.length === 0)  throw 'Found unmatched } braces!';

            if(in_iterator){
                if(parsed === '.'){
                    parsed = '' + iterator_key;

                    parsed = brace_stack.pop() + parsed;

                    continue;
                }else if(parsed === '..'){
                    parsed = brace_stack.pop();

                    if(brace_stack.length) throw 'Found unmatched { braces!';

                    return [parsed, rest];
                }
            }

            let colon = parsed.search(':');
            if (colon < 0) {
                if(parsed.length)
                    parsed = '' + format_value(get_value(parsed), '');
                else
                    parsed = '' + format_value(values[index_shift++], '');
            }else{
                let val = (colon > 0) ? get_value(parsed.slice(0, colon)) : values[index_shift++];
                let fmt = parsed.slice(colon + 1);

                if(fmt === 'in..'){
                    parsed = '';
                    let chunk, new_rest;
                    for(let i in val){
                        [chunk, new_rest] = vformat(rest, val[i], null, i);
                        parsed += chunk;
                    }
                    rest = new_rest;
                }else if(fmt === 'in own..'){
                    parsed = '';
                    let chunk, new_rest;
                    for(let i in val) if(own(val, i)){
                        [chunk, new_rest] = vformat(rest, val[i], null, i);
                        parsed += chunk;
                    }
                    rest = new_rest;
                }else if(fmt === 'of..'){
                    parsed = '';
                    let count = 0;
                    let chunk, new_rest;
                    for(let i of val){
                        [chunk, new_rest] = vformat(rest, i, null, count++);
                        parsed += chunk;
                    }
                    rest = new_rest;
                }else if(fmt === 'length..'){
                    if(!isNumber(val.length)) throw 'Value length missing';
                    parsed = '';
                    let chunk, new_rest;
                    for(let i=0;i<val.length;++i){
                        [chunk, new_rest] = vformat(rest, val[i], null, i);
                        parsed += chunk;
                    }
                    rest = new_rest;
                }else if(fmt === 'if..'){
                    parsed = '';
                    [parsed, rest] = vformat(rest, val[i], null, i);
                }else
                    parsed = '' + format_value(val, fmt);
            }

            parsed = brace_stack.pop() + parsed;
        }
    }

    if(in_iterator) throw 'Found unclosed iterator loop!';

    if(brace_stack.length) throw 'Found unmatched { braces!';

    return parsed;
}

export function format() {
    let args = toArray(arguments);
    let str = args.shift();
    return vformat(str, args);
}
