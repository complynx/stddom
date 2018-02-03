
import {generate_id} from "./mongo.js";
import {escapeSpecialChars, dirname} from "./utils.js";

function isValidFnName( name ) {
    try {
        eval('(function() { function ' + name + '() {} })()');
    } catch( e ) {
        return false;
    }
    return true;
}

function test_list(list) {
    if(list === '*') return;
    for(let name of list){
        if(!isValidFnName(name))
            throw new SyntaxError('Invalid name: ' + name);
    }
}

function test_import_names(list) {
    if(list === '*') return list;
    if(typeof list === 'string') list = [list];
    for(let name of list){
        if(!isValidFnName(name))
            throw new SyntaxError('Invalid name: ' + name);
    }
    return list;
}

export function dynamic_import(list, module, url, execution_timeout) {
    return new Promise((resolve, reject) => {
        let id = generate_id() + '_dynamic_import';
        try {
            list = test_import_names(list);

            url = url || window.location.href;
            execution_timeout = execution_timeout > 0 ? execution_timeout : 5000;

            let path = document.createElement('a');
            path.href = url;

            if(module[0] === '/') module = path.origin + module;
            else if(module[0] === '.') module = dirname(path.href) + module;

            let import_stmnt = list === '*'? '* as _stub' : ('{' + list.join(',') + '}');
            let fetch_stmnt = list === '*'? '_stub' :
                ('{' + list.map(x=>'"' + escapeSpecialChars(x) + "\":" + x).join(',') + '}');

            let src = 'import '+ import_stmnt + ' from "' + escapeSpecialChars(module) + '";\n';
            src += 'try{\n';
            src += 'window[\'' + id + '\'].resolve(' + fetch_stmnt + ');\n';
            src += '}catch(e){\n';
            src += 'window[\'' + id + '\'].reject(e);\n';
            src += '}\n';

            let blob = new Blob([src], {type : 'text/javascript'});

            let head = document.getElementsByTagName('head')[0];
            let script = document.createElement('script');
            script.type = 'module';
            script.src = URL.createObjectURL(blob);
            // script.appendChild(document.createTextNode(src));
            head.insertBefore(script,head.firstChild);
            // head.removeChild(script);
            let timer;

            window[id] = {
                resolve: function (ret) {
                    clearTimeout(timer);
                    head.removeChild(script);
                    delete window[id];
                    return resolve(ret);
                },
                reject:function (e) {
                    clearTimeout(timer);
                    head.removeChild(script);
                    delete window[id];
                    reject(e);
                }
            };

            script.onload = function () {
                setTimeout(function () {
                    window[id].reject('Script execution timeout. Probably uncatchable error.');
                }, execution_timeout);
            };
            script.onerror = window[id].reject;
        }catch(e){
            delete window[id];
            reject(e);
        }
    });
}
