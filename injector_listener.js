/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import {XConsole} from "./console_enhancer.js";

export function listen(func, name=func.name) {
    let c = new XConsole(name);
    return function(){
        c.log(...arguments);
        return func.apply(this, arguments);
    };
}

export function make_proxy(object, cname="Object") {
    let reflector = Object.create(Reflect);
    let c = new XConsole(cname);
    reflector.apply = function (tgt, thisArg, argArg) {
        c.log("Calling with:", ...argArg);
        return Reflect.apply(tgt, thisArg, argArg);
    };
    reflector.construct = function(tgt, args){
        c.log("Creating %cnew%c instance with:", 'font-style: italic;', 'font-style: normal;', ...args);
        return Reflect.construct(tgt, args);
    };
    reflector.get = function(t,prop){
        if(typeof t[prop] === "object" || typeof t[prop] === "function"){
            return make_proxy(t[prop], cname + "." + prop);
        }else{
            c.log("Getting %c%s%c =","color:#00f;", prop, "color:#000;", t[prop]);
            return Reflect.get(...arguments);
        }
    };
    reflector.set = function(t,prop,val) {
        c.log("Setting %c%s%c =","color:#00f;", prop, "color:#000;", val);
        return Reflect.set(...arguments);
    };
    reflector.deleteProperty = function(t,prop){
        c.log("Deleting %c%s%c","color:#00f;", prop, "color:#000;");
        return Reflect.deleteProperty(...arguments);
    };
    reflector.defineProperty = function (t, prop, descr) {
        c.log("Defining %c%s%c with","color:#00f;", prop, "color:#000;", descr);
        return Reflect.defineProperty(...arguments);
    };
    reflector.preventExtensions = function (t) {
        c.log("Preventing extensions.");
        return Reflect.preventExtensions(...arguments);
    };
    reflector.getPrototypeOf = function () {
        c.log("Getting prototype.");
        return make_proxy(Reflect.getPrototypeOf(...arguments), cname + ".<prototype>");
    };
    reflector.setPrototypeOf = function (t, proto) {
        c.log("Setting prototype to", proto);
        return Reflect.setPrototypeOf(...arguments);
    };
    return new Proxy(object, reflector);
}

export function inject_proxy(object, name, cname=name) {
    let old = object[name];
    let proxy = make_proxy(old, cname);
    let c = new XConsole(cname);
    let definition = Object.getOwnPropertyDescriptor(object, name);
    Object.defineProperty(object, name, {
        enumerable: definition ? definition.enumerable : true,
        configurable: definition ? definition.configurable : true,
        get: ()=>{
            return proxy;
        },
        set: (v)=>{
            c.log("=",v);
            old = v;
            proxy = make_proxy(old, cname);
        }
    });
}
