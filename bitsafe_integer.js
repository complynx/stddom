// if there will be any browser support for more, this will be reviewed.

const MAX_BITSAFE_INTEGER =  0x7fffffff;
const MIN_BITSAFE_INTEGER = -0x80000000;

export {MAX_BITSAFE_INTEGER, MIN_BITSAFE_INTEGER};

export function isBitsafeInteger(x) {
    return !isNaN(x) && (x=parseFloat(x), (x|0)===x);
}

if(isBitsafeInteger(MAX_BITSAFE_INTEGER*2))
    console.warn('%c!!! TODO: TIME TO UPGRADE MAX_BITSAFE_INTEGER !!!', 'font-weight:bold;color:#F00');
