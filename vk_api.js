import {storableObject} from "./storable_props.js";
import {generate_id} from "./mongo.js";
import {parseQuery} from "./utils.js";
import {XConsole} from "./console_enhancer.js";
let console = new XConsole("vk_api");
let login_error = null;

let settings=storableObject({
    version: "5.110",
    token: false,
    hash: "",
    application: 0,
    user:0,
    permissions:0,
    state: "",
    expiration: 0
}, "clx:vk_api:settings");

const rights={
    notify: 1,
    friends:1<<1,
    photos: 1<<2,
    audio:1<<3,
    video:1<<4,
    stories:1<<6,
    pages:1<<7,
    left_menu_link:1<<8,
    status:1<<10,
    notes:1<<11,
    messages:1<<12,
    wall:1<<13,
    ads:1<<15,
    offline:1<<16,
    docs:1<<17,
    groups:1<<18,
    notifications:1<<19,
    stats:1<<20,
    email:1<<22,
    market:1<<27
};
const rights_pages={
    stories: 1,
    photos: 1<<2,
    app_widget:1<<6,
    messages:1<<12,
    docs:1<<17,
    manage :1<<18
};

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
    ).then(r=>{
        if(r.error){
            throw r;
        }
        return r;
    });
}
async function api_call(method, params) {
    console.log("call: " + method);
    return api_call_empty(method, Object.assign({}, {
        access_token: settings.token,
        v: settings.version
    }, params))
}

function login() {
    settings.state = generate_id();
    settings.token = false;
    settings.user = 0;
    settings.login_error = null;
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


function init(min_expiration = 3600000) {
    return new Promise((resolve, reject)=>{
        if(login_error){
            reject(login_error);
        }else if(settings.token && settings.user>0 && settings.expiration > Date.now() + min_expiration){
            api_call("account.getAppPermissions", {
                user_id: settings.user
            }).then(r=>{
                console.log("vk getAppPermissions success");
                if(r.response && r.response==settings.permissions){
                    resolve({
                        expiration: (new Date()).setTime(settings.expiration),
                        user: settings.user,
                        permissions: settings.permissions
                    });
                } else{
                    login();
                }
            }).catch(reject);
        }else login();
    });
}

function logout() {
    settings.token = false;
    settings.user = 0;
}

if(window.location.hash.length>1) {
    let q = parseQuery(window.location.hash.substr(1));
    if(q.error && q.error_description){
        window.location.hash = "";
        login_error = q.error + ": " + q.error_description;
        console.error("vk access error: " + login_error);
    }else if(q.access_token && q.state){
        console.log("vk access");
        window.location.hash = "";
        if(q.state==settings.state) {
            settings.user = q.user_id;
            settings.token = q.access_token;
            settings.state = "";
            settings.expiration = Date.now() + parseInt(q.expires_in)*1000;
            if(settings.hash.length){
                window.location.hash = "#" + settings.hash;
            }
        }
    }
}

export {init, login, logout, api_call, api_call_empty, settings, rights, rights_pages};

