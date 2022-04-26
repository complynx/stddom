/**
 Created by Complynx on 26.04.2022,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import {isBlobPart, isString} from "./type_checks.js";
import {XConsole} from "./console_enhancer.js";

let console = new XConsole("DOM Local Save");

export function save_file(data, filename="unnamed.txt", mime) {
    let blob;
    mime = isString(mime) ? mime : null;
    if(data instanceof Blob) {
        blob = data;
        if(!mime) mime = blob.type;
    } else if(isBlobPart(data)) {
        if(!mime) mime = "application/octet-stream";
        blob = new Blob([data], {type: mime});
    } else {
        if(!mime) mime = "application/json";
        blob = new Blob([JSON.stringify(data, null, 2)], {type: mime});
    }

    let a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    console.log("Saving to", filename, mime);
    setTimeout(()=>{
        URL.revokeObjectURL(a.href);
        console.log("revoked URL");
    }, 1);
}
