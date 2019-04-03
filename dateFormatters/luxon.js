/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import{DateTime, Duration, Interval}from "../luxon.js";
let formatter;
formatter = (d,f)=>DateTime.fromJSDate(d).toFormat(f);
DateTime.prototype.__format__ = DateTime.prototype.toFormat;
Duration.prototype.__format__ = Duration.prototype.toFormat;
Interval.prototype.__format__ = Interval.prototype.toFormat;
export {formatter};
