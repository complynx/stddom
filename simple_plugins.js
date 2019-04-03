"use strict";
/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import {isString, isFunction} from "./type_checks.js";


let plugins = {};

export {plugins};

export function plugin_call(plugin, method, ...args) {
    if (isString(plugin)) plugin = plugins[plugin];

    let field = plugin[method];
    if (field)
        return isFunction(field) ? field.apply(plugin, args) : field;
}

export function plugins_call() {
    let results = {};
    for (let plug_id in plugins) {
        let res = plugin_call.call(this, plug_id, ...arguments);
        if (res !== undefined) results[plug_id] = res;
    }
    return results;
}

export function process_node(node, params) {
    if (!node.tagName) return;

    plugins_call('process_node', node, params);
}

export function process_mutations(mutations) {
    for (let i of mutations) {
        if(i.addedNodes) for (let j of i.addedNodes) {
            process_node(j);
        }
    }
}
