/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
let current_tester;

export class Group {
    constructor(func, name) {
        if(typeof func === 'string'){
            [func, name] = [name, func];
        }
        this.func = func;
        this.name = name || func.name;
        this.count = 0;
        this._fails = 0;
        this.with = undefined;
    }
    static parse_args(args){
        args = Array.from(args);
        let func = args.shift();
        let comment;
        if(typeof func === 'string'){
            comment = func;
            func = args.shift();
        }
        let explanation = `Trying function ${func.name} with ${JSON.stringify(args)}`;
        if(comment){
            explanation += ` (${comment})`;
        }
        return [func,explanation,args];
    }
    runs(){
        let args,func,str;
        [func,str,args] = Group.parse_args(arguments);
        str += `, should not fail ...`;
        try {
            let ret = func.apply(this.with, args);

            this.ok(str + ` returned ${ret}`);
        }catch (e) {
            this.fail(str, e);
        }
    }
    fails(){
        let args,func,str;
        [func,str,args] = Group.parse_args(arguments);
        str += `, should fail ...`;
        try {
            let ret = func.apply(this.with, args);

            this.fail(str + ` function returned...`, ret);
        }catch (e) {
            this.ok(str + ` Failed successfully with reason ${e}`);
        }
    }
    fails_maybe(){
        let args,func,str;
        [func,str,args] = Group.parse_args(arguments);
        str += `, may fail ...`;
        try {
            let ret = func.apply(this.with, args);

            this.ok(str + ` Returned ${JSON.stringify(ret)}`);
        }catch (e) {
            this.ok(str + ` Failed with reason ${e}`);
        }
    }
    returns(){
        let args = Array.from(arguments),
            func,str;
        let result = args.pop();
        [func,str,args] = Group.parse_args(args);
        str += `, should return ${JSON.stringify(result)} ...`;
        try {
            let ret = func.apply(this.with, args);

            if(ret !== result) {
                this.fail(str + `Wrong result.`, ret);
            }else this.ok(str);
        }catch (e) {
            this.fail(str, e);
        }
    }
    start(){
        if (current_tester) {
            this.parent = current_tester;
            current_tester.child = this;
        }
        this.count = 0;
        this._fails = 0;
        current_tester = this;
        console.groupCollapsed('Test group: ' + this.name);
        try {
            this.func(this);
        }catch(e){
            this.fail('Failed while running a test function...', e);
        }
        this.end();
    }
    ok(str) {
        this.count++;
        console.log("%s [%cOK%c]", str, 'color:#0f0;', 'color: #000');
    }
    fail(str, reason) {
        this.count++;
        this._fails++;
        console.error("%c%s [%cFAILURE%c]", 'color: #000', str, 'color:#f00;', 'color: #000');
        console.log('Failed with:', reason);
    }
    end () {
        this.ended = true;
        if(this.child){
            this.fail('Unclosed child present!', this.child);
            this.child.end();
        }
        console.groupEnd();

        let t = 'font-weight:normal;color:#000;';
        let n = 'font-weight:bold;color:#009';
        let fn = this._fails?'font-weight:bold;color:#900':n;
        let c = this._fails?'color:#f00;':'color:#0f0;';

        console.log(`%cGroup ${this.name}: passed %c${this.count - this._fails}%c of %c${this.count}%c tests,` +
         ` failed %c${this._fails}%c, [%c%s%c]`,
            t, n, t, n, t, fn, t, c, this._fails? 'FAILURE' : 'OK', t
        );
        if(this.parent) {
            this.parent.count++;
            this.parent._fails += this._fails ? 1 : 0;
            current_tester = this.parent;
            delete current_tester.child;
        }
    }
}
