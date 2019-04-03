/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import {isFunction} from "./type_checks.js";
import {add_css as _add_css} from "./dom_utils.js";
import {toArray} from "./utils.js";
import {injector} from "./code_injector.js";

/**
 * workaround for those cases where backquote strings are of no use.
 * @param   {Function}  func    container of comments
 * @returns {*}         parsed comment strings
 */
export function get_block_comments(func) { // извлекаем из кода функции содержимое блоковых комментариев
    let code = injector.parse(func).code;
    let obj_rx = /\*([a-z0-9_]+):\s*([\s\S]+?)\s*\*\//ig; // при нахождении /*comment_name: содержимое */ всё будет распарсенно в объект {comment_name: содержимое}
    let arr_rx = /\*(\s*)([\s\S]+?)\s*\*\//g;             // иначе всё будет в виде массива
    let is_obj = obj_rx.test(code);
    let comments = is_obj ? {} : [];
    code.replace(is_obj ? obj_rx : arr_rx, function (s, name, comment) { // просто взял replace вместо while..regexp.exec
        if (is_obj)
            comments[name] = comment;
        else
            comments.push(comment);
        return s;
    });
    return comments;
}

/**
 * adds extracted CSS from function comments.
 */
export function add_css() {
    let args = toArray(arguments);
    if(isFunction(args[0])){
        args[0] = get_block_comments(args[0]);
    }
    return _add_css.apply(this, args);
}
