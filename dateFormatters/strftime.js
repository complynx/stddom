import{strftime}from "../strftime.js";
let formatter = strftime;
Date.prototype.__format__ = function(fstr){
    return strftime(this, fstr)
};
export {formatter};
