/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import {isFunction} from "./type_checks.js";

// This is a fork of a giant magic workaround.
let injector = { // KiberInfinity's JS_InjToFunc_Lib v2.1
    FRegEx: /function[^(]*\(\s*([^)]*?)\s*\)[^{]*{([\s\S]+)}/i,
    DisableHistrory: false,
    History: {},
    wait: function (func, callback, check_timeout, check_count, fail_callback) {
        if (check_count === 0) {
            if (fail_callback)
                fail_callback('WaitForFunc out of allow checkes');
            return;
        }
        if (check_count)
            check_count--;
        let func_ = func;
        if (typeof func === 'string')
            func_ = eval(func);
        if (!check_timeout)
            check_timeout = 1000;
        if (func_)
            callback(func_);
        else
            return setTimeout(function () {
                injector.wait(func, callback, check_timeout, check_count, fail_callback)
            }, check_timeout);
        return false;
    },
    parse: function (func) {
        // определение распарсить переданную функцию или же найти по имени функции.
        let fn_name = isFunction(func) ? func.name : func;
        let fn = isFunction(func) ? func : eval('window.' + func);
        let res = fn ? String(fn).match(injector.FRegEx) : ['', '', ''];
        return {
            func_name: fn_name, // для последующего использования в make, функция должна быть передана в parse по строковому имени, либо обязательно переопредление этого параметра на нужное строковое имя.
            full: res[0],
            args: res[1],
            code: res[2],
            args_names: res[1].split(/\s*,\s*/) // используется для макрозамены обозначенных аргументов в коде
        }
    },
    make: function (parsed_func, code, args) {
        let h = Array.prototype.join.call(args, '#_#');
        let hs = h.replace(/[^A-Za-z0-9]+/g, ""); // генерим "хеш" инъекции. не идеально, но так быстрее, чем crc/md5 и и.д считать.
        if (code.indexOf(hs) !== -1) // проверяем, если ли уже метка этой инъекции в функции.
            return false;            // если инъекция уже была сделана ранее, то уходим.

        // Подстановка имён аргументов в места указанные в новом коде как #ARG1#, #ARG2# или __ARG0__, __ARG1__ и т.д
        code = code.replace(/(#|__)ARG(\d+)\1/g, function (s, prefix, idx) {
            let arg_idx = parseInt(idx);
            return parsed_func.args_names[arg_idx];
        });
        let ac = '\n"[inj_label]' + hs + '";';
        // добавляем косметический перенос строки перед родным кодом:
        if (!/^[\r\n\s]*['"]\[inj_label\]/.test(code))
            ac += '\n';
        // перезаписываем функцию новой:
        eval(parsed_func.func_name + '=function(' + parsed_func.args + '){' + ac + code + '}');
        return true;
    },
    start: function (func, inj_code) {
        let s = injector.parse(func);
        if (isFunction(inj_code))                 // ну а что? injector и так костыль, а с этим удобней местами - передали интересующий нас логически завершённый код завёрнутым в анонимную функцию
            inj_code = injector.parse(inj_code).code;   // и выдрали его из неё, а не строкой с экранированиями, без переносов и т.д
        return injector.make(s, inj_code + ' ' + s.code, arguments);
    },
    end: function (func, inj_code) {
        let s = injector.parse(func);
        if (isFunction(inj_code))
            inj_code = injector.parse(inj_code).code;
        return injector.make(s, s.code + ' ' + inj_code, arguments);
    },
    before: function (func, before_str, inj_code) {
        let s = injector.parse(func);

        if (isFunction(inj_code))
            inj_code = injector.parse(inj_code).code;

        let orig_code = ((typeof before_str) === 'string') ? before_str : s.code.match(before_str);
        s.code = s.code.split(before_str).join(inj_code + ' ' + orig_code + ' '); //maybe split(orig_code) ?
        //if (func=='nav.go') alert(s.code);
        return injector.make(s, s.code, arguments);
    },
    after: function (func, after_str, inj_code) {
        let s = injector.parse(func);

        if (isFunction(inj_code))
            inj_code = injector.parse(inj_code).code;

        let orig_code = ((typeof after_str) === 'string') ? after_str : s.code.match(after_str);
        s.code = s.code.split(after_str).join(orig_code + ' ' + inj_code + ' '); //maybe split(orig_code) ?
        //if (func=='stManager.add') alert(s.code);
        return injector.make(s, s.code, arguments);
    },

    before_r: function (func, before_rx, inj_code) {
        let s = injector.parse(func);

        if (isFunction(inj_code))
            inj_code = injector.parse(inj_code).code;

        s.code = s.code.replace(before_rx, inj_code + ' $&');
        return injector.make(s, s.code, arguments);
    },
    after_r: function (func, before_rx, inj_code) {
        let s = injector.parse(func);

        if (isFunction(inj_code))
            inj_code = injector.parse(inj_code).code;

        s.code = s.code.replace(before_rx, '$& ' + inj_code);
        return injector.make(s, s.code, arguments);
    },

    replace: function (func, rep_str, inj_code) {
        let s = injector.parse(func);
        s.code = s.code.replace(rep_str, inj_code); //split(rep_str).join(inj_code);
        return injector.make(s, s.code, arguments);
    }
};

export {injector};
