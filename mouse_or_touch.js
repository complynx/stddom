"use strict";
/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
let cache;

/**
 * if first event is mouse event, it's mouse, if first event is touch event, it's touch.
 * @returns {Promise<string>}   "mouse"|"touch"
 */
export function detect() {
    return new Promise((resolve)=>{
        if(cache) return resolve(cache);
        let mouse_detector, remove_mouse_detector = () => {
            window.removeEventListener("mousemove", mouse_detector, {passive: true});
            window.removeEventListener("mousedown", mouse_detector, {passive: true});
            window.removeEventListener("mouseover", mouse_detector, {passive: true});
            window.removeEventListener("touchstart", mouse_detector, {once: false});
            window.removeEventListener("touchmove", mouse_detector, {once: false});
        };
        mouse_detector = ev => {
            if (ev.type.startsWith('mouse') && ev.buttons === 0) {
                resolve(cache = "mouse");
                remove_mouse_detector();
            } else if (ev.type.startsWith('touch')) {
                resolve(cache = "touch");
                remove_mouse_detector();
            }
        };
        window.addEventListener("mousemove", mouse_detector, {passive: true});
        window.addEventListener("mousedown", mouse_detector, {passive: true});
        window.addEventListener("mouseover", mouse_detector, {passive: true});
        window.addEventListener("touchstart", mouse_detector, {once: false});
        window.addEventListener("touchmove", mouse_detector, {once: false});
    });
}

