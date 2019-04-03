/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
let formatter;
if(Date.prototype.toLocaleFormat){
    Date.prototype.__format__ =Date.prototype.toLocaleFormat;
}
Date.prototype.__format__ = function(){
    return this.toLocaleString();
};

formatter = (date, fstr)=>date.__format__(fstr);

export {formatter};
