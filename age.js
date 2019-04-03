/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
/**
 * Calculates age of a given date (in years)
 * @param   {Date}      birth_date
 * @returns {number}    age
 */
export function age_from_birth_date(birth_date) {
    let cur_date = new Date();
    let bDay = new Date(cur_date.getFullYear(), birth_date.getMonth(), birth_date.getDate());
    return cur_date.getFullYear() - birth_date.getFullYear() - (bDay > cur_date?1:0);
}

/**
 * Calculates birth date from age and day+month of birth
 * @param   {number}      age       age
 * @param   {number}      month     month of birth
 * @param   {number}      day       day of birth
 * @returns {Date}                  birth date
 */
export function birth_date_from_age(age, month, day) {
    let cur_date = new Date();
    let bDay = new Date(cur_date.getFullYear(), month, day);
    let year = cur_date.getFullYear() - age - (bDay > cur_date?1:0);
    return new Date(year, month, day);
}
