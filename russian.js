"use strict";
/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import {capitalizeFirstLetter} from "./utils.js";

let translit_dict = {
    'ё':'yo',
    'й':'j',
    'й':'j',
    'а':'a',
    'б':'b',
    'в':'v',
    'г':'g',
    'д':'d',
    'е':'e',
    'ё':'yo',
    'ж':'zh',
    'з':'z',
    'и':'i',
    'к':'k',
    'л':'l',
    'м':'m',
    'н':'n',
    'о':'o',
    'п':'p',
    'р':'r',
    'с':'s',
    'т':'t',
    'у':'u',
    'ф':'f',
    'х':'h',
    'ц':'ts',
    'ч':'ch',
    'ш':'sh',
    'щ':'sch',
    'ъ':'',
    'ы':'y',
    'ь':"'",
    'э':'e',
    'ю':'yu',
    'я':'ya'
};

/**
 * Translates cyrillic alphabet characters to latin, using Russian translit rules.
 * @param   {string}    cyr
 * @returns {string}
 */
export function translit(cyr) {
    // diacritics first
    return cyr.replace(/(ё|й|[а-яё])/g, a => translit_dict[a]||a)
        .replace(/(Ё|Й|[А-ЯЁ])/g, a => capitalizeFirstLetter(translit_dict[a.toLowerCase()])||a);
}

/**
 * Selects proper declention regarding provided number
 * @param   {[string, string, string]}      titles      the declentions of word for one, two and five of something
 * @param   {number}                        n           how many there are of something
 * @returns {string}                        proper declention of something
 */
export function declenctionOfNumerics(titles, n) {
    n = Math.abs(n);
    if(Number.isInteger(n))
        return titles[(n % 10 === 1 && n % 100 !== 11) ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2];
    return titles[1];
}
