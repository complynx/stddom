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

/**@return {number}*/
export function Z(birth_date, ophiuchus) {
    let month = birth_date.getMonth() + 1;
    let day = birth_date.getDate();

    if(ophiuchus && ((month === 11 && day > 29) || (month === 12 && day < 18))) return 12;

    return day > zodiac_cfg[month-1] ? (month) % 12 : (month - 1);
}

export function zodiac(birth_date, ophiuchus) {
    return zodiac_names[Z(birth_date, ophiuchus)];
}
