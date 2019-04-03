/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import{strftime}from "../strftime.js";
let formatter = strftime;
Date.prototype.__format__ = function(fstr){
    return strftime(this, fstr)
};
export {formatter};
