"use strict";
/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
/**
 * Generates Mongo-compliant ID
 * @returns {string}
 */
export function generate_id() {
    let timestamp = (new Date().getTime() / 1000 | 0).toString(16);
    return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, function() {
        return (Math.random() * 16 | 0).toString(16);
    }).toLowerCase();
}

/**
 * extracts string from MongoID
 * @param   {*}         id  MongoID
 * @returns {string}    ID representation
 */
export function id_to_string(id){
    if(typeof id === 'string')  return id;

    if('$oid' in id) return id_to_string(id['$oid']);
    if('$id' in id) return id_to_string(id['$id']);
    if('$uid' in id) return id_to_string(id['$uid']);
    if('_id' in id) return id_to_string(id['_id']);
}
