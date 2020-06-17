import {storableObject} from "./storable_props.js";
import {generate_id} from "./mongo.js";
import {parseQuery} from "./utils.js";
import {XConsole} from "./console_enhancer.js";
let console = new XConsole("vk_api");

let settings=storableObject({
    version: "5.110",
    token: false,
    hash: "",
    application: 0,
    user:0,
    permissions:0,
    state: ""
}, "clx:vk_api:settings");

function paramsQuery(params){
    let params_arr = [];
    for(let i in params){
        params_arr.push(encodeURIComponent(i)+ "=" + encodeURIComponent(params[i]));
    }
    return params_arr.join("&");
}

function jsonp(url, timeout=30000){
    let cb_name="cb"+generate_id();
    if(!window.vk_callbacks) {
        window.vk_callbacks = {};
    }
    let scr = document.createElement("script");
    let clearcb = ()=>{
        document.head.removeChild(scr);
        delete window.vk_callbacks[cb_name];
    }
    let ret = new Promise((resolve,reject)=>{
        let timer = setTimeout(()=>{
            clearTimeout(timer);
            clearcb();
            reject({
                error: "timeout"
            });
        }, timeout);
        window.vk_callbacks[cb_name] = (result)=>{
            clearTimeout(timer);
            clearcb();
            resolve(result);
        };
    });
    scr.src = url + "&callback=" + encodeURIComponent("vk_callbacks."+cb_name);
    document.head.appendChild(scr);
    return ret;
}


let api_url = 'https://api.vk.com/method/';
async function api_call_empty(method, params) {
    return jsonp(
        api_url+method + "?" + paramsQuery(params)
    );
}
async function api_call(method, params) {
    return api_call_empty(method, Object.assign({}, {
        access_token: settings.token,
        v: settings.version
    }, params))
}

function init_redirect() {
    settings.state = generate_id();
    settings.token = false;
    settings.user = 0;
    let redirector = window.location.href.split("#")[0];
    if(window.location.hash.length > 1){
        settings.hash = window.location.hash.substring(1);
        window.location.hash = "";
    }
    window.location.href = "https://oauth.vk.com/authorize?" + paramsQuery({
        client_id: settings.application,
        redirect_uri: redirector,
        scope: settings.permissions,
        response_type: "token",
        state: settings.state,
    });
}


function init() {
    return new Promise((resolve, reject)=>{
        if(settings.token && settings.user>0){
            api_call("account.getAppPermissions", {
                user_id: settings.user
            }).then(r=>{
                console.log("vk getAppPermissions returned", r);
                if(r.response && r.response==settings.permissions){
                    resolve(true);
                } else{
                    init_redirect();
                }
            })
        }else init_redirect();
    });
}

if(window.location.hash.length>1) {
    let q = parseQuery(window.location.hash.substr(1));
    if(q.access_token && q.state){
        console.log("vk access", q);
        window.location.hash = "";
        if(q.state==settings.state) {
            settings.user = q.user_id;
            settings.token = q.access_token;
            if(settings.hash.length){
                window.location.hash = "#" + settings.hash;
            }
        }
    }
}

export {init, api_call, api_call_empty, settings};

