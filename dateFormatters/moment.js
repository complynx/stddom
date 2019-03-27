import moment from "../moment.js";
let formatter;
formatter = (date, fstr)=>moment(date).format(fstr);
moment.prototype.__format__ = moment.prototype.format;
moment.duration.__format__ = function (fstr){
    if(fstr === 'h') return this.humanize();
    return this.toISOString();
};
export {formatter};
