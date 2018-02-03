import{strftime}from "../strftime.js";
let formatter = strftime;
Date.prototype.__format__ = (fstr)=>strftime(this, fstr);
export {formatter};
