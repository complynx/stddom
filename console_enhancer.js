let wrap = ["info", "log", "debug"];

class XConsole{
    constructor(name = "XConsole", _console = console){
        this.module = name;
        this.console = _console;
        let self = this;
        this.start = (new Date()).getMilliseconds();

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
    }
    prefix(){
        let ms = (new Date()).getMilliseconds() - this.start;
        return ["%c%8.3f%c [%c%s%c]:\t", "color:#aaa;", ms/1000., "color:#000;", "color:#00f;", this.module, "color:#000;"];
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
