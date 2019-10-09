/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import {generate_id} from "./mongo.js";

if(!window.dyn_import) {
    /**
     * ES6 `import()` backport.
     * @param   {string}        url
     * @returns {Promise<*>}    imported module contents
     */
    window.dyn_import = function (url) {
        return new Promise((resolve, reject) => {
            if(!url || url === "") throw new Error("No URL specified");
            const script = document.createElement("script");
            const tempGlobal = "__tempModuleLoadingVariable" + generate_id();
            script.type = "module";

            new Promise((resolve2, reject2) => {
                window[tempGlobal] = {
                    resolve: resolve2,
                    reject: reject2
                };
            }).then((m) => {
                resolve(m);
                delete window[tempGlobal];
                script.remove();
            }, (m) => {
                reject(m);
                delete window[tempGlobal];
                script.remove();
            });

            script.textContent = `
            import * as m from "${url}";
            import default as d from "${url}";
            m['default'] = d;
            clearTimeout(window.${tempGlobal}.timer);
            window.${tempGlobal}.resolve(m);
            `;

            script.onerror = () => {
                clearTimeout(window[tempGlobal].timer);
                window[tempGlobal].reject(new Error("Failed to load module script with URL " + url));
            };
            window[tempGlobal].timer = setTimeout(script.onerror, window.dyn_import.timeout);

            document.documentElement.appendChild(script);
        });
    };
    window.dyn_import.timeout = 5000;
}

if(!window['import'] || typeof window['import'] !== "function") window['import'] = dyn_import;
else console.info("YAY, native import()!");
