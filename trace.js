/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
let traceEntryRe = [
    { // Firefox 30+
        re:/^([^@]+)?@(.+):([0-9]+):([0-9]+)$/,
        groups: {
            func:1,
            file:2,
            line:3,
            column:4
        }
    },
    { // Chrome
        re:/^\s*at((\s+(\S+))?\s+\()?(.*):([0-9]+):([0-9]+)\)?$/,
        groups: {
            func:3,
            file:4,
            line:5,
            column:6
        }
    }
];

/**
 * trace string parser
 * @param   {string}    trace
 * @returns {[*]}       parsed trace
 */
export function parseTrace(trace){
    trace = trace.split('\n');
    if(trace[0] === 'Error'){ // Chrome
        trace.shift();
    }
    if(trace[trace.length - 1] === ''){ // Firefox
        trace.pop();
    }

    let re;
    for(re of traceEntryRe) if(re.re.test(trace[0])) break;

    return trace.map(e=>{
        let r = re.re.exec(e);
        if(!r) return e;
        let ret = {};
        for(let i in re.groups)
            ret[i] = r[re.groups[i]];
        return ret;
    });
}

/**
 * returns current callstack
 * @returns {[*]}
 */
export function getTrace(){
    let e = new Error();
    let trace = parseTrace(e.stack);

    trace.shift(); // Remove self

    return trace;
}
