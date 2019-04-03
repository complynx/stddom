/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
let zodiac_cfg = [20,19,20,20,21,21,22,23,23,23,22,21];  // rollover days of month
let zodiac_names = [
    "Capricorn",
    "Aquarius",
    "Pisces",
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Ophiuchus"
];

/**
 * returns zodiac number, where:
 * Capricorn = 0
 * Aquarius = 1
 * ...
 * Sagittarius = 11
 *
 * If `ophiuchus` is true, then 12 will be returned in it's dates
 * @param   {Date}      birth_date
 * @param   {boolean=}  ophiuchus       check for 13'th sign
 * @return {number}*/
export function Z(birth_date, ophiuchus) {
    let month = birth_date.getMonth() + 1;
    let day = birth_date.getDate();

    if(ophiuchus && ((month === 11 && day > 29) || (month === 12 && day < 18))) return 12;

    return day > zodiac_cfg[month-1] ? (month) % 12 : (month - 1);
}

/**
 * returns zodiac name regarding the date provided
 * If `ophiuchus` is true, then it will be returned as well.
 * @param   {Date}      birth_date
 * @param   {boolean=}  ophiuchus       check for 13'th sign
 * @returns {string}    zodiac sign
 */
export function zodiac(birth_date, ophiuchus) {
    return zodiac_names[Z(birth_date, ophiuchus)];
}
