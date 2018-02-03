"use strict";

import {isString, isFunction} from "./type_checks.js";


let plugins = {};

export {plugins};

export function plugin_call() {
    let args = Array.prototype.slice.call(arguments);
    let plugin = args.shift();
    let method = args.shift();

    if (isString(plugin)) plugin = plugins[plugin];

    let field = plugin[method];
    if (field)
        return isFunction(field) ? field.apply(plugin, args) : field;
}

export function plugins_call() {
    let args = Array.prototype.slice.call(arguments);
    let results = {};
    for (let plug_id in plugins) {
        let res = plugin_call.apply(this, [plug_id].concat(args));
        if (res !== undefined) results[plug_id] = res;
    }
    return results;
}

export function process_node(node, params) {
    if (!node.tagName) return;

    plugins_call('process_node', node, params);
}

export function process_mutations(mutations) {
    for (let i = 0; i < mutations.length; ++i) {
        let nodes = mutations[i].addedNodes;
        for (let j = 0; j < nodes.length; ++j) {
            process_node(nodes[j]);
        }
    }
}
