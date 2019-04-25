/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 *
 * This file presents mainly two functions: `format` and `vformat`. These act close to their analogies in Python,
 * but there are some differences because of language constraints.
 * Also, these functions present a full turing-compatible template language. For examples see `tests/format.js`,
 * it contains many examples of what can `vformat` do.
 *
 * Simple call:
 * ```js
 * let str = vformat("{var} {} {2:.2g}", ["a", 2, 4.5], {var:"foo"});
 * ```
 */
import {arrayLike, isObject, isFunction, isNumber, isInteger} from "./type_checks.js";
import {toArray, own} from "./utils.js";
import {XConsole} from "./console_enhancer.js";
let console = new XConsole("format");

let format_re = /^((.)?([><=^]))?([-+\s])?(#)?(0)?([1-9][0-9]*)?(,)?(\.([0-9]*))?(.)?$/;

export function pad(str, min_length, pad, pad_type) {
    if(str.length >= min_length) return str;
    if(!pad_type) pad_type = '<';

    let padlen = min_length - str.length;
    if(pad_type === '<') return str + pad.repeat(padlen);
    if(pad_type === '>') return pad.repeat(padlen) + str;

    let half = Math.ceil(padlen/2);
    return pad.repeat(half) + str + pad.repeat(padlen - half);
}

let number_formats = {
    b:(a)=>Number.parseInt(a).toString(2),
    c:(a)=>String.fromCharCode(a),
    d:(a)=>Number.parseInt(a).toString(),
    e:(a,p)=>a.toExponential(p === false ? 6 : p),
    E:(a,p)=>number_formats.e(a,p).toUpperCase(),
    f (a,p){
        let exp = Math.floor(Math.log10(a));

        if(exp>19){
            exp -= 19;
            let significand = a/Math.pow(10, exp);
            return this.f(significand, 0) + '0'.repeat(exp) + (p>0 ? ('.' + '0'.repeat(p)):'');
        }

        return a.toFixed(p === false ? 6 : p)
    },
    F:(a,p)=>number_formats.f(a,p).toUpperCase(),
    g (arg, precision) {
        if (arg === 0) return '0';
        if (Number.isNaN(arg)) return 'nan';
        if (!Number.isFinite(arg)) return arg>0?'inf':'-inf';
        if (precision === false) precision = 6;
        else if(precision === 0) precision = 1;

        let exp = Math.floor(Math.log10(arg));

        let v;
        if (-4 <= exp && exp < precision) {
            v = number_formats.f(arg, precision - 1 - exp);

            if(v.search(/\./) >= 0) {
                let last_zeros = v.search(/(\.)?0*$/);

                if (last_zeros >= 0)
                    v = v.slice(0, last_zeros);
            }

            return v;
        }
        else {
            precision--;
            v = number_formats.e(arg, precision);
            let eloc = v.search('e');
            let exponent = v.slice(eloc);
            v = v.slice(0, eloc);

            let last_zeros = v.search(/(\.)?0*$/);
            if(last_zeros >= 0)
                v = v.slice(0, last_zeros);

            return v + exponent;
        }
    },
    G:(a,p)=>number_formats.g(a,p).toUpperCase(),
    n:(a,p)=>number_formats[isInteger(a)?'d':'g'](a,p),
    o:(a)=>Number.parseInt(a).toString(8),
    x:(a)=>Number.parseInt(a).toString(16),
    X:(a,p)=>number_formats.x(a,p).toUpperCase(),
    '%':(a,p)=>number_formats.f(a*100,p) + '%'
};

let string_formats = {
    s:(a)=>a,
    u:(a)=>a.toUpperCase(),
    l:(a)=>a.toLowerCase(),
    t:(a)=>a.toLowerCase().replace(/(\w)(\w*)/g, (_, i, r)=>i.toUpperCase() + (r != null ? r : "")),
    S:(a)=>a.toLowerCase().replace(/(\w)(\w*)/, (_, i, r)=>i.toUpperCase() + (r != null ? r : "")),
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

/**
 * formats value according the format string
 * Uses `val.__format__(fstr)` if it exists and is a function. You can populate any value with this method to enable
 * special formatting.
 *
 * @param {*}           val         value
 * @param {string}      fstr        format string
 * @returns {string}                formatted value
 */
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
    if(!match) throw `Faulty format ${fstr}!`;

    let moe = (m, e)=> m !== undefined ? m : e;

    let fill_zero = match[6] === '0';
    let filler = moe(match[2], fill_zero?'0':' ');
    let fill_type = moe(match[3], fill_zero?'=':false);
    let sign = moe(match[4], '-');
    let prefix_alternate = !!(match[5]);
    let min_width = match[7] !== undefined ? Number(match[7]) : 0;
    let thousand_delimiter = !!(match[8]);
    let precision = match[10] !== undefined ? Number(match[10]) : false;
    let format = moe(match[11], '');
    let ret = '';

    if((typeof val === 'number') || (val instanceof Number)){
        fill_type = fill_type || '>';
        if(format === '') format = 'n';

        if(!number_formats[format]) throw `ValueError: Unknown format code '${format}' for object of type 'number'`;

        ret = number_formats[format](val, precision);
        let r_sign = ret[0] === '-' ? '-' : '+';
        let r_abs = ret[0] === '-' ? ret.slice(1) : ret;
        let prefix = prefix_alternate ? (prefixes[format] || '') : '';

        if(thousand_delimiter){
            let dot = r_abs.search(/\./);
            if(dot === -1) dot = r_abs.length;
            for(let i=dot-1;i;--i){
                if((dot-i)%3 === 0){
                    r_abs = r_abs.slice(0,i) + ',' + r_abs.slice(i);
                }
            }
        }

        if(fill_type === '='){
            min_width -= prefix.length;

            if(r_sign === '+' && sign !== '+'){
                r_sign = sign === '-' ? '' : sign;
            }
            min_width -= r_sign.length;

            ret = r_sign + prefix + pad(r_abs, min_width, filler, '>');
        }else{
            r_abs = prefix + r_abs;
            if(r_sign === '+' && sign !== '+'){
                r_sign = sign === '-' ? '' : sign;
            }
            ret = pad(r_sign + r_abs, min_width, filler, fill_type);
        }

        return ret;
    }else {
        fill_type = fill_type || '<';
        if (fill_type === '=') throw `ValueError: '=' alignment not allowed in string format specifier`;
        val = ''+val;
        if(format === '') format = 's';
        if(!string_formats[format])
            throw `ValueError: Unknown format code '${format}' for object of type '${typeof val}'`;

        val = string_formats[format](val);

        let ret = pad('' + val, min_width, filler, fill_type);
        return precision !== false ? ret.slice(0, precision) : ret;
    }
}

let braces_re = /[{}]/;

/**
 * State machine formatter inspired by python `str.format()`
 *
 * Uses `format_value()` to format each entity.
 * Also provides some functions such as `{!for}` or `{!ifeq}`.
 * Look into tests of this module to see complete usage examples.
 *
 * Usages:
 * ```js
 * vformat("{} {}", [1,2]); //-> "1 2"
 * vformat("{1} {0}", [1,2]); //-> "2 1"
 * vformat("{a} {0}", [1,2], {a:"foo"}); //-> "foo 1"
 * vformat("{a}", {a:"foo"}); //-> "foo"
 * ```
 *
 * @param {String}      str     template to populate.
 * @param {Array|*}     argc    optional array of positional arguments, if arrayLike, it will be cast to array.
 * @param {Object=argc} argv    optional k-v args, if not provided and argc is object, uses argc instead.
 * @returns {String}
 */
export function vformat(str, argc, argv) {
    let values = arrayLike(argc) ? toArray(argc) : [];
    let kvargs = isObject(argv) ? argv : isObject(argc) ? argc : {};
    let values_shift = 0;

    let state = 'root';
    let rest = str;
    let start = '';
    let expression;
    let closure = {};

    let stack = [];

    function get_val(keys, type, arg) {
        let point;
        if(closure.is_muted) return;
        if(type === '~'){
            if(keys[0] === '') keys.shift(); // case of {~}, {~.foo.bar} whereas the last is equal to {~foo.bar}

            let c = closure;
            while(keys[0] === '<'){
                keys.shift();
                if(!c.previous || !stack[c.previous]) throw 'Too many back arrows in keychain';
                c = stack[c.previous];
            }

            point = c.val;

            if(!keys.length){ // case of {~}
                return point;
            }
        }else {
            if (arguments.length > 2)
                point = arg;
            else if (isNumber(keys[0]))
                point = values;
            else if (keys[0] === '') {
                keys[0] = values_shift++;
                point = values;
            } else
                point = kvargs;
        }

        for(let i of keys){
            point = point[i];
        }
        return point;
    }

    let functions = {
        'if'(type, params, rest){
            let is_muted = closure.is_muted;
            stack.push(closure);

            closure = {};
            closure.ender = 'endif';
            closure.previous = stack.length - 1;
            closure.val = params[0];
            closure.clause_counter = 0;
            closure.prev_is_muted = is_muted;
            closure.is_muted = is_muted || !(closure.val);

            if(closure.is_muted){
                closure.start = start;
                start = '';
            }
        },
        'typeof'(type, params, rest){
            return functions['if'](type, [typeof params[0] == params[1]], rest);
        },
        'ifeq'(type, params, rest){
            return functions['if'](type, [params[0] == params[1]], rest);
        },
        'ifseq'(type, params, rest){
            return functions['if'](type, [params[0] === params[1]], rest);
        },
        'ifgt'(type, params, rest){
            return functions['if'](type, [params[0] > params[1]], rest);
        },
        'ifge'(type, params, rest){
            return functions['if'](type, [params[0] >= params[1]], rest);
        },
        'else'(){
            if(closure.ender !== 'endif' || closure.clause_counter > 0) throw 'Unexpected "else"';
            closure.clause_counter++;

            if(closure.is_muted){
                start = closure.start;
            }else{
                closure.start = start;
                start = '';
            }
            closure.is_muted = closure.prev_is_muted || !closure.is_muted;
        },
        'endif'(){
            if(closure.is_muted){
                start = closure.start;
            }
            if(closure.previous !== stack.length - 1) throw 'Stack corrupt';
            closure = stack.pop();
        },
        'key'(type, params, rest){
            let c = closure;
            if(closure.is_muted) return;
            if(params && params.length > 0){
                for(let i=0;i<params[0];++i){
                    if(!c.previous || !stack[c.previous]) throw `key(${params[0]}) is too many`;
                    c = stack[c.previous];
                }
            }
            if(rest && rest[0] === ':')
                return format_value(closure.key, rest.slice(1));
            return format_value(closure.key, '');
        },
        'print'(type, params, rest){
            let c = closure;
            if(closure.is_muted) return;
            if(rest && rest[0] === ':')
                return format_value(params[0], rest.slice(1));
            return format_value(params[0], '');
        },
        '(loop)'(generator){
            let is_muted = closure.is_muted;
            stack.push(closure);

            closure = {};
            closure.ender = 'endloop';
            closure.previous = stack.length - 1;
            closure.is_muted = is_muted;
            closure.started_with_shift = values_shift;
            closure.rest = rest;
            closure.generator = generator;
            functions[closure.ender]();
        },
        '>'(type, params, rest){
            let is_muted = closure.is_muted;
            stack.push(closure);

            closure = {};
            closure.ender = '<';
            closure.previous = stack.length - 1;
            closure.is_muted = is_muted;

            closure.val = params[0];
        },
        '<'(){
            if(closure.previous !== stack.length - 1) throw 'Stack corrupt';
            closure = stack.pop();
        },
        'for'(type, params, rest){
            functions['(loop)']((function*(val, is_muted) {
                if(!isNumber(val.length)) throw `Iteration isn't possible without a proper 'length' attribute`;
                if(!is_muted)
                for(let i=0; i<val.length; ++i){
                    yield [i, val[i]];
                }
            })(params[0], closure.is_muted));
        },
        'in'(type, params, rest){
            functions['(loop)']((function*(val, is_muted) {
                if(!is_muted)
                for(let i in val){
                    yield [i, val[i]];
                }
            })(params[0], closure.is_muted));
        },
        'in_own'(type, params, rest){
            functions['(loop)']((function*(val, is_muted) {
                if(!is_muted)
                for(let i in val){
                    if(own(val, i))
                        yield [i, val[i]];
                }
            })(params[0], closure.is_muted));
        },
        'of'(type, params, rest){
            functions['(loop)']((function*(val, is_muted) {
                let counter = 0;
                if(!is_muted)
                for(let i of val){
                    yield [counter++, i];
                }
            })(params[0], closure.is_muted));
        },
        'endloop'(){
            if(closure.finished){
                start = closure.start;
                if(closure.previous !== stack.length - 1) throw 'Stack corrupt';
                closure = stack.pop();
            }else {
                let ret = closure.generator.next();
                rest = closure.rest;
                if (!ret.done) {
                    [closure.key, closure.val] = ret.value;
                } else {
                    closure.start = start;
                    start = '';
                    closure.is_muted = true;
                    closure.finished = true;
                }
            }
        },
        '='(){
            if(closure.ender) return functions[closure.ender].apply(this, arguments);
        }
    };

    let state_machine = {
        'root': {
            '': ()=> 'end',
            'default'(symbol){
                let brace_pos = rest.search(braces_re);
                if(brace_pos >= 0){
                    start += symbol + rest.slice(0, brace_pos);
                    rest = rest.slice(brace_pos);
                }else{
                    start += symbol + rest;
                    rest = '';
                }
            },
            '{': ()=>state_machine['{'](),
        },
        'end': {},
        '{'() {
            let s = rest[0];
            if(s === '{'){
                start += '{';
                rest = rest.slice(1);
                return;
            }

            stack.push([state, expression, start]);
            expression = {};
            start = '';

            expression.type = '';
            if(s === '='){
                expression.type = '=';
                rest = rest.slice(1);
                return 'func';
            }
            if(s === '~'){
                expression.type = '~';
                rest = rest.slice(1);
            }
            return 'key_literal';
        },
        'key_literal': {
            'enter'(){
                // stack.push(from);
                expression.key = [];
            },
            '"': ()=> state_machine['"'](),
            '{': ()=> state_machine['{'](),
            'end_key'(){
                this.end_key_part();
                expression.val = get_val(expression.key, expression.type);
            },
            '}'(){
                this.end_key();
                return state_machine['}']();
            },
            ':'(){
                this.end_key();
                return 'fmt'
            },
            '!'(){
                this.end_key();
                return 'func'
            },
            'end_key_part'(){
                if(!expression.key) expression.key = [];
                expression.key.push(start);
                start='';
            },
            '.'(){this.end_key_part()},
            'default'(s){
                start += s;
            }
        },
        'fmt': {
            '{': ()=> state_machine['{'](),
            '}'(){
                expression.format = start;
                start = '';
                return state_machine['}']();
            },
            'default'(s){
                start += s;
            },
        },
        'func': {
            'exit'(to){
                if(['func', 'key_literal'].indexOf(to) >= 0) return;
                expression.function = start;
                start = '';
            },
            '"': ()=> state_machine['"'](),
            '{': ()=> state_machine['{'](),
            '}': ()=> state_machine['}'](),
            '(': ()=> 'function_params',
            ':'(s){
                rest = s + rest;
                return 'function_rest';
            },
            'default'(s){
                start += s;
            },
        },
        'function_params':{
            'enter'(){
                if(!('function_params' in expression))
                    expression.function_params = [];
            },
            '"': ()=> state_machine['"'](),
            ','(){
                expression.function_params.push(start);
                start='';
            },
            ')'(){
                expression.function_params.push(start);
                start='';
                return 'function_rest';
            },
            '='(){
                if(start!== '') throw 'Unexpected =';
                expression.function_param_key_type = '';
                return 'function_param_key';
            },
            '~'(){
                if(start!== '') throw 'Unexpected ~';
                expression.function_param_key_type = '~';
                return 'function_param_key';
            },
            '{': ()=> state_machine['{'](),
            '}': ()=> state_machine['}'](),
            'exit'(to){
                if(['func', 'key_literal', 'function_param_key', 'function_rest'].indexOf(to) >= 0) return;
                throw 'Unexpected termination';
            },
            'default'(s){
                start += s.trim();
            }
        },
        'function_param_key':{
            'enter'(){
                expression.function_param_key = [];
            },
            '.'(){
                expression.function_param_key.push(start);
                start='';
            },
            '"': ()=> state_machine['"'](),
            ','(){
                expression.function_param_key.push(start);
                expression.function_params.push(get_val(expression.function_param_key,
                    expression.function_param_key_type));
                start='';
                return 'function_params';
            },
            ')'(){
                expression.function_param_key.push(start);
                expression.function_params.push(get_val(expression.function_param_key,
                    expression.function_param_key_type));
                start='';
                return 'function_rest';
            },
            '{': ()=> state_machine['{'](),
            '}': ()=> state_machine['}'](),
            'exit'(to){
                if(['func', 'key_literal', 'function_params', 'function_rest'].indexOf(to) >= 0) return;
                throw 'unexpected termination!'
            },
            'default'(s){
                start += s;
            }
        },
        'function_rest':{
            '"': ()=> state_machine['"'](),
            '{': ()=> state_machine['{'](),
            '}'(){
                expression.function_rest = start;
                start = '';
                return state_machine['}']();
            },
            'default'(s){
                start += s;
            }
        },
        '"'(){
            let pos;
            let str = '"';
            while(true) {
                pos = rest.search(/[\\"]/);
                if(pos === -1) throw 'Unclosed string literal!';

                let el = rest[pos];
                if(el === '\\') ++pos;// skip next symbol;
                str += rest.slice(0, pos + 1);
                rest = rest.slice(pos + 1);

                if(el === '"') break;
            }
            str = JSON.parse(str);

            start += str;
        }, // string literal
        '}'(){
            let s = rest[0];
            if(state === 'root') {
                if (s === '}') {
                    start += '}';
                    rest = rest.slice(1);
                    return;
                }else{
                    throw "Single '}' encountered in format string";
                }
            }

            return 'eval'
            // stack.push([from, expression, start]);
            // expression = {};
            // start = '';
        },
        'eval'(s){
            rest = s + rest;

            let val, expr = expression, from;
            [from, expression, start] = stack.pop();

            if(expr.key){
                val = expr.val;
                if(!expr.function_params)
                    expr.function_params = [];
                expr.function_params.unshift(val);
            }

            if (expr.function) {
                if(functions[expr.function]){
                    val = functions[expr.function](
                        expr.type,
                        expr.function_params,
                        expr.function_rest
                        ) || '';
                }else{
                    throw `Function ${expr.function} not found`;
                }
            } else {
                val = format_value(val, expr.format || '');
            }
            start += val;

            return from;
        }
    };

    function call_state(symbol) {
        if(state_machine[state]){
            if(isFunction(state_machine[state]))
                return state_machine[state](symbol);

            if(isFunction(state_machine[state][symbol]))
                return state_machine[state][symbol](symbol);

            return state_machine[state]['default'](symbol);
        }else throw `Unknown state ${state}`;
    }

    function change_state(new_state) {
        if(state !== new_state){
            if(state_machine[new_state]){
                if(state_machine[state]['exit'])
                    state_machine[state]['exit'](new_state);
                let from = state;
                state = new_state;
                if(state_machine[state]['enter'])
                    state_machine[state]['enter'](from);
            }else throw `Unknown state ${new_state}`;
        }
    }

    while(state !== 'end'){
        let symbol = rest[0] || '';
        rest = rest.slice(1);

        let ret = call_state(symbol);

        if(ret)
            change_state(ret);
    }

    return start;
}


/**
 * State machine formatter inspired by python `str.format()`
 *
 * `format(str, arg1, arg2, ...)` is the same as `vformat(str, [arg1, arg2, ...])`
 * See more there.
 *
 * Usages:
 * ```js
 * format("{} {}", 1, 2); //-> "1 2"
 * format("{1} {0}", 1, 2); //-> "2 1"
 * ```
 *
 * @param {String}     string   template to populate.
 * @param {*...}                arguments
 * @returns {String}
 */
export function format(string) {
    let args = toArray(arguments);
    let str = args.shift();
    return vformat(str, args);
}
