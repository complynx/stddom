"use strict";
/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import {isObject, isString} from "./type_checks.js";

let types = [
    {'type': 'ЛИИ', 'name': 'Робеспьер', "name_full": 'Робеспьер', 'name_short': 'Роб'},
    {'type': 'ЭИИ', 'name': 'Достоевский', "name_full": 'Достоевский', 'name_short': 'Дост'},
    {'type': 'ЛСИ', 'name': 'Максим', "name_full": 'Максим Горький', 'name_short': 'Макс'},
    {'type': 'ЭСИ', 'name': 'Драйзер', "name_full": 'Драйзер', 'name_short': 'Драй'},
    {'type': 'ЛИЭ', 'name': 'Джек', "name_full": 'Джек Лондон', 'name_short': 'Джек'},
    {'type': 'ЭИЭ', 'name': 'Гамлет', "name_full": 'Гамлет', 'name_short': 'Гам'},
    {'type': 'ЛСЭ', 'name': 'Штирлиц', "name_full": 'Штирлиц', 'name_short': 'Штир'},
    {'type': 'ЭСЭ', 'name': 'Гюго', "name_full": 'Гюго', 'name_short': 'Гюг'},
    {'type': 'ИЛИ', 'name': 'Бальзак', "name_full": 'Бальзак', 'name_short': 'Баль'},
    {'type': 'ИЭИ', 'name': 'Есенин', "name_full": 'Есенин', 'name_short': 'Есь'},
    {'type': 'СЛИ', 'name': 'Габен', "name_full": 'Габен', 'name_short': 'Габ'},
    {'type': 'СЭИ', 'name': 'Дюма', "name_full": 'Александр Дюма', 'name_short': 'Дюма'},
    {'type': 'ИЛЭ', 'name': 'Дон Кихот', "name_full": 'Дон Кихот', 'name_short': 'Дон'},
    {'type': 'ИЭЭ', 'name': 'Гексли', "name_full": 'Гексли', 'name_short': 'Гек'},
    {'type': 'СЛЭ', 'name': 'Жуков', "name_full": 'Жуков', 'name_short': 'Жук'},
    {'type': 'СЭЭ', 'name': 'Наполеон', "name_full": 'Наполеон', 'name_short': 'Нап'}
];
let relations = [
    {'name_short': 'Тож', 'name': 'Тождественные', 'who_is': 'Тождик'},
    {'name_short': 'Дел', 'name': 'Деловые', 'who_is': 'Деловой'},
    {'name_short': 'Род', 'name': 'Родственные', 'who_is': 'Родственник'},
    {'name_short': 'СЭ', 'name': 'Супер-эго', 'who_is': 'Супер-эго'},
    {'name_short': 'ПП', 'name': 'Полной противоположности', 'who_is': 'ПП'},
    {'name_short': 'ПД', 'name': 'Полудуальные', 'who_is': 'Полудуал'},
    {'name_short': 'Мир', 'name': 'Миражные', 'who_is': 'Миражник'},
    {'name_short': 'Д', 'name': 'Дуальные', 'who_is': 'Дуал'},
    {'name_short': 'КТ', 'name': 'Квазитождество', 'who_is': 'Квазитодик'},
    {'name_short': 'ПЗ', 'name': 'Заказ (П)', 'who_is': 'Подзаказный'},
    {'name_short': 'Зак', 'name': 'Заказ (З)', 'who_is': 'Заказчик'},
    {'name_short': 'Акт', 'name': 'Активации', 'who_is': 'Активатор'},
    {'name_short': 'Зер', 'name': 'Зеркальные', 'who_is': 'Зеркало'},
    {'name_short': 'Рев', 'name': 'Ревизия (Р)', 'who_is': 'Ревизор'},
    {'name_short': 'ПР', 'name': 'Ревизия (П)', 'who_is': 'Подревизный'},
    {'name_short': 'Кон', 'name': 'Конфликт', 'who_is': 'Конфликтёр'}
];

export {types, relations};

for (let i = 0; i < 16; ++i) {
    relations[i].index = i;
    types[i].index = i;
}


function bitswap(num) {
    if (!(num & 8)) return num;
    let f = (num & 1) << 1;
    let s = (num & 2) >> 1;
    return (num & 12) | f | s;
}

export function get_relative(t) {
    return bitswap(bitswap(t) ^ 2);
}

export function is_closest_quad(t1, t2) {
    return [t1, t1 ^ 7, t1 ^ 12, t1 ^ 11].indexOf(get_relative(t2)) >= 0;
}

export function relation_number(t1, t2) {
    if (is_closest_quad(t1, t2) || is_closest_quad(t1, t2 ^ 3))
        return get_relative(t1 ^ get_relative(t2));
    return t1 ^ t2;
}

function is_string_this_im_type(str, im_type) {
    str = str.toLowerCase();
    if (Number.isInteger(im_type)) im_type = types[im_type];
    return im_type.name_full.toLowerCase().search(str) >= 0
        || im_type.type.toLowerCase() === str
        || im_type.name_short.toLowerCase().search(str) >= 0;
}

export function im_type_to_number(im_type) {
    if (Number.isInteger(Number(im_type))) return im_type;
    if (isObject(im_type)) im_type = im_type.type || im_type.name || im_type.stype;
    if (isString(im_type)) {
        im_type = im_type.toLowerCase();
        for (let i = 0; i < types.length; ++i)
            if (is_string_this_im_type(im_type, i)) {
                return i;
            }
    }
    return -1;
}

export function im_type(im_type) {
    let t = im_type_to_number(im_type);
    return types[t];
}

export function relation_reversed(t2, t1) {
    return relation(t1, t2);
}

export function relation(t1, t2) {
    t1 = im_type_to_number(t1);
    t2 = im_type_to_number(t2);
    return relations[relation_number(t1, t2)];
}