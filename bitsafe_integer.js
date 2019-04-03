/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
/**
 * JS has different sizes of integers supported in different operations. This is for binary operations.
 */
// if there will be any browser support for more, this will be reviewed.

const MAX_BITSAFE_INTEGER =  0x7fffffff;
const MIN_BITSAFE_INTEGER = -0x80000000;

export {MAX_BITSAFE_INTEGER, MIN_BITSAFE_INTEGER};

/**
 * Checks the number to be bitsafe, performs real measurement.
 * @param   {number}  x     value to test
 * @returns {boolean}       is it bitsafe
 */
export function isBitsafeInteger(x) {
    return !isNaN(x) && (x=parseFloat(x), (x|0)===x);
}

if(isBitsafeInteger(MAX_BITSAFE_INTEGER*2))
    console.warn('%c!!! TODO: TIME TO UPGRADE MAX_BITSAFE_INTEGER !!!', 'font-weight:bold;color:#F00');
