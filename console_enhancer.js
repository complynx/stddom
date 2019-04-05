/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import {getTrace} from "./trace.js";
import {isFunction} from "./type_checks.js";

let wrap = ["info", "log", "debug"];
let bind = ['error', 'warn'];

function msStr(ms){
    let sec = "" + (ms/1000.);
    return " ".repeat(Math.max(0, 9 - sec.length)) + sec;
}

/**
 * Tired of boring plain logs? Try this to enhance your logger readability.
 * Useful for modules.
 */
class XConsole{
    constructor(name = "XConsole", _console = console){
        this.module = name;
        this.console = _console;
        let self = this;
        this.start = Date.now();

        for(let i of bind){
            this[i] = this[i].bind(this);
        }
        for(let i of wrap){
            this[i] = function () {
                return _console[i].apply(_console, XConsole.concatenatePrefix(self.prefix(), arguments));
            };
        }
        for(let i in _console){
            if(!(i in this)){
                this[i] = function () {
                    return _console[i].apply(_console, arguments);
                };
            }
        }

        if(!this.trace)
            this.trace = function () {
                let tr = getTrace();
                tr.shift();
                this.log(tr);
            }
    }
    prefix(){
        return ["%c%s %c[%c%s%c]:\t", "color:#aaa;", msStr(Date.now() - this.start), "color:#000;", "color:#00f;", this.module, "color:#000;"];
    }
    static concatenatePrefix(prefix, args){
        args = Array.from(args);
        if(typeof args[0] === "string"){
            prefix[0] += args.shift();
        }
        return prefix.concat(args);
    }
    error(){
        let prefix = this.prefix();
        prefix[0] += '%c';
        prefix.push("color:#a4000f;");
        return this.console.error.apply(this.console, XConsole.concatenatePrefix(prefix, arguments));
    }
    warn(){
        let prefix = this.prefix();
        prefix[0] += '%c';
        prefix.push("color:#715100;");
        return this.console.warn.apply(this.console, XConsole.concatenatePrefix(prefix, arguments));
    }
}


export {XConsole};
