/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import {locales, setLocale} from "./strftime.js";

locales.ru = {
    a: ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
    A: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
    b: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
    B: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
    c: '%a, %d %b. %Y г., %T',
    p: ['AM', 'PM'],
    P: ['am', 'pm'],
    x: '%d.%m.%y',
    X: '%T'
};

locales['ru-RU'] = locales.ru;

export {locales};

setLocale('ru');
