/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import {isFunction, isObject} from "./type_checks.js";
import {toArray} from "./utils.js";
import {generate_id} from "./mongo.js";
import {XConsole} from "./console_enhancer.js";

/**
 * Gets em size in pixels.
 * @param   {Element}   el
 * @returns {number}    em size
 */
let Em2Px = (el=document.body)=>parseFloat(window.getComputedStyle(el).fontSize);

export {Em2Px};

/**
 * Returns offset measurements of the element regarding the provided parent.
 * @param   {Element}   el          element to measure
 * @param   {Element=}  parent      element of reference, or document.documentElement if not provided
 * @returns {{left: number, top: number, height: number, width: number}}
 */
export function get_offset(el, parent){
    parent = parent || document.documentElement;
    let ret = {
        left:0,
        top:0
    };

    ret.height = el.offsetHeight;
    ret.width = el.offsetWidth;

    while(el !== parent){
        ret.top += el.offsetTop;
        ret.left += el.offsetLeft;
        el = el.parentElement;
        if(el === document.documentElement){
            let p_offset = get_offset(parent);
            ret.top -= p_offset.top;
            ret.left -= p_offset.left;
            return ret;
        }
    }

    return ret;
}

let validate_id_regex = /^[-_a-z0-9]*$/gi;

/**
 * Generates a unique, yet unused DOM ID
 * @param   {string=}   prefix
 * @returns {string}    ID
 */
export function unique_id(prefix) {
    prefix = String(prefix || '');
    if(!validate_id_regex.test(prefix)) prefix = '';
    let id = prefix + generate_id();
    while(document.getElementById(id)){
        id = prefix + generate_id();
    }
    return id;
}

/**
 * Returns index of provided element in it's DOM
 * @param   {Node}      el
 * @returns {number}    index
 */
export function parentIndexOf(el) {
    if(!el.parentNode) return -1;
    return Array.prototype.indexOf.call(el.parentNode.childNodes, el);
}

let scrollbar_size = -1;

/**
 * Measures (on a first run) scrollbar size for this browser.
 * @returns {number}
 */
export function getScrollbarSize() {
    if(scrollbar_size < 0) {
        let d = document.createElement('div');

        d.innerHTML = `
            <div style="width: 100px;height: 100px;position: fixed; top:-200px; left: -200px;">
                <div style="overflow-y: scroll; width: 100%;">
                     <div style="width: 100%;" class="getScrollbarSize-target">&nbsp;</div>
                </div>
            </div>`;
        document.body.appendChild(d);
        let targ = d.querySelector('.getScrollbarSize-target');
        scrollbar_size = 100 - targ.offsetWidth;
        d.remove();
    }
    return scrollbar_size;
}

/**
 * Does this element have something outside it's box?
 * @param   {Node}      element
 * @returns {boolean}
 */
export function isOverflown(element) {
    return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
}

/**
 * Inserts element into DOM by index offset
 * @param   {Node}      parent      where to insert
 * @param   {Node}      el          what to insert
 * @param   {number}    index       offset of insert (negative numbers offset from the end)
 * @returns {Node}      el          inserted element or emptied DocumentChunk
 */
export function insertAt(parent, el, index) {
    if(index<0){
        index = parent.childNodes.length - index;
    }
    if(index<0){
        index = 0;
    }
    if(parent.childNodes.length > index){
        return parent.insertBefore(el, parent.childNodes[index]);
    }else{
        return parent.appendChild(el);
    }
}

/**
 * Validates DOM ID and ensures it's unique.
 * @param   {string}    try_id      ID to validate
 * @param   {string=}   prefix      prefix to generate, if the ID is bad
 * @returns {string}    validated ID
 */
export function fix_id(try_id, prefix) {
    try_id = String(try_id || '');
    if(!validate_id_regex.test(try_id)) try_id = '';
    if(try_id.length > 0 && !document.getElementById(try_id))
        return try_id;
    return unique_id(prefix);
}

/**
 * Gets an attribute contents from closest element having this attribute.
 * @param   {Element}   el      where to start searching
 * @param   {string}    attr    attribute to search
 * @returns {string}    the value
 */
export function getFromClosest(el, attr) {
    return el.closest('[' + attr + ']').getAttribute(attr);
}

let ThrottledEvent = (function(event_name, element) {
    let console = new XConsole("ThrottledEvent");
    element = element || window;
    let callbacks = new Set(),
        running = false,
        args = null,
        self = null;

    function event() {
        args = arguments;
        self = this;
        if (!running) {
            running = true;

            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(runCallbacks);
            } else {
                setTimeout(runCallbacks, 66);
            }
        }

    }

    function runCallbacks() {
        callbacks.forEach(function(callback) {
            try {
                callback.apply(self, args);
            }catch (e){
                console.error(e);
            }
        });

        running = false;
    }

    function addCallback(callback) {
        if (callback) {
            callbacks.add(callback);
        }

    }

    return {
        // public method to add additional callback
        add: function(callback) {
            if (!callbacks.length) {
                element.addEventListener(event_name, event);
            }
            addCallback(callback);
        },
        remove:function (callback) {
            callbacks.delete(callback);
        }
    }
});

/**
 * something generates too many events? Ok, we have a solution.
 */
export {ThrottledEvent};

/**
 * Adds style rules to a document.
 * @param   {string}    style   ruleset
 * @param   {string=}   id      mark attribute
 */
export function add_css(style, id) {
    let styleElement = document.createElement("style");
    styleElement.type = "text/css";
    if (id) styleElement.setAttribute('mark', id);
    styleElement.appendChild(document.createTextNode(style));
    document.getElementsByTagName("head")[0].appendChild(styleElement);
}

/**
 * Loads CSS from the given URL.
 * @param   {string}        uri     URL of the stylesheet
 * @param   {string=}       id      mark attribute
 * @returns {Promise<*>}    Resolves when the stylesheet is loaded
 */
export function load_css(uri, id) {
    return new Promise((resolve, reject)=> {
        let css = document.createElement('link');
        css.rel = 'stylesheet';
        css.type = 'text/css';
        css.onload = resolve;
        css.onerror = reject;
        if (id) css.setAttribute('mark', id);
        css.href = uri;
        document.querySelector('head').appendChild(css);
    });
}

function start_editing(ev) {
    let element = ev.currentTarget;
    if(!element.classList.contains('editing')){
        let prep_ev = new CustomEvent('prepare', {
            cancelable: true,
            bubbles: true
        });
        if(element.dispatchEvent(prep_ev))
            ev.currentTarget.classList.add('editing');
    }
}
function submit(element) {
    let submit_ev = new CustomEvent('submit', {
        cancelable: true,
        bubbles: true
    });
    if(element.dispatchEvent(submit_ev)) {
        element.classList.remove('editing');
        element.blur();
        let submit_ev = new CustomEvent('submitted', {
            cancelable: true,
            bubbles: true
        });
        element.dispatchEvent(submit_ev);
    }
}
function on_change(ev) {
    let element = ev.currentTarget;
    if(element.classList.contains('editing')){
        let options = JSON.parse(element.getAttribute('data-editable-options'));
        let changed_ev = new CustomEvent('changed', {
            'detail': ev,
            bubbles: true
        });
        element.dispatchEvent(changed_ev);

        let stop = false;
        if(ev.type === 'blur') stop = true;
        else if(ev.type === 'keypress'){
            if(ev.key === 'Enter')
            if(!(options.modifier) || ev[options.modifier]){
                stop = true;

                ev.preventDefault();
                ev.stopPropagation();
                ev.stopImmediatePropagation();
            }
        }

        if(stop){
            submit(element);
        }
    }
}

export function changeable_field(element, options) {
    if(element.getAttribute('data-clx-changeable-field')) return false;
    element.setAttribute('data-clx-changeable-field', true);

    element.classList[element.matches(":focus") ? 'add' : 'remove']('editing');

    options = Object.assign({}, isObject(options) ? options : {});

    element.setAttribute('contenteditable', true);
    element.setAttribute('spellcheck', options.spellcheck?'true':'false');
    element.setAttribute('data-editable-options', JSON.stringify(options));

    element.addEventListener('click', start_editing);

    element.addEventListener('blur', on_change);
    element.addEventListener('keypress', on_change, true);
    element.addEventListener('paste', on_change);

    if(!changeable_field.added_css) {
        changeable_field.added_css = true;
        add_css(`
        [data-clx-changeable-field]:empty::after{
            content:attr(placeholder);
            opacity:0.5;
            cursor:text;
        }
        [data-clx-changeable-field]{
            caret-color: currentColor;
        }
        `);
    }
    return true;
}

export function toggle_group(options) {
    options = Object.assign({}, isObject(options) ? options : {});

    let type = options.radio || options.type === 'radio' ? 'radio' : 'checkbox';
    let values = isObject(options.values) ? options.values : {};
    delete options.values;

    let id = fix_id(options.id, options.id_prefix);
    let name = options.name || 'name_' + id;

    let checked = toArray(options.checked || []);

    let container = (options.container instanceof Element)? options.container : document.createElement('div');
    container.id = id;
    container.classList.add('clx-toggle-group');
    container.setAttribute('data-toggle-group-options', JSON.stringify(options));

    for(let key in values){
        let value = values[key];

        let toggle = document.createElement('input');
        toggle.type = type;
        toggle.name = name;
        toggle.id = fix_id(id + key, 'input_');
        toggle.value = key;

        toggle.checked = (checked.indexOf(key) >= 0);

        let label = document.createElement('label');
        label.setAttribute('for', toggle.id);
        label.innerText = value;

        container.appendChild(toggle);
        container.insertBefore(label, options.label_first ? toggle : null);
    }

    return container;
}
