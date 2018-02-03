let formatter;
if(Date.prototype.toLocaleFormat){
    Date.prototype.__format__ =Date.prototype.toLocaleFormat;
}
Date.prototype.__format__ =()=>this.toLocaleString();

formatter = (date, fstr)=>date.__format__(fstr);

export {formatter};
