/**
 Created by Complynx on 09.03.2022,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import {createFragment as $C} from "./create_dom.js";
import {add_css} from "./dom_utils.js";
import {XConsole} from "./console_enhancer.js";
import {generate_id} from "./mongo.js";
import {unique_id} from "./dom_utils.js";

let console = new XConsole("notifications");
let default_notification = "https://complynx.net/modules/notification.ogg";

let filterIDs = null;
function getFilterID() {
    if(!filterIDs) {
        let red = unique_id("red_matrix");
        let solarized = unique_id("solarized_matrix");
        let filterInput = `<svg>
            <filter id="${red}">
                 <feColorMatrix type="matrix"
                    values="0 0 0 0 1
                            0 1 0 0 0
                            0 0 1 0 0
                            0 0 0 1 0"/>
            </filter>
            <filter id="${solarized}">
                 <feColorMatrix type="matrix"
                    values="7 0 0 0 0.1
                            0 7 0 0 0.1
                            0 0 7 0 0.1
                            0 0 0 1 0"/>
            </filter>
        </svg>`;
        filterIDs = [red, solarized];
        document.body.appendChild($C(filterInput));
    }
    return filterIDs;
}
let frames={};
function create_css_frames(steps=6) {
    if(frames[steps]) {
        return frames[steps];
    }
    let ids = getFilterID();
    let animation_title = `clx-frames-${steps}` + generate_id();
    let frames = [];
    for(let i=0;i<steps;++i) {
        let step = 99.99999*i;
        let frame = ` ${step}% {
            filter: url(#${ids[i%ids.length]});
        }`;
        frames.push(frame);
    }
    frames.push(` 100% {
        filter: none;
    }`);
    let animation = `@keyframes ${animation_title} {` + frames.join("\n") + `}`;
    add_css(animation);
    frames[steps] = animation_title;
    return animation_title;
}
let animations={};
function create_css_animation_class(duration='2s', steps=6) {
    let dKey = `d${duration}`;
    if(animations[dKey]) {
        return animations[dKey];
    }
    let frames = create_css_frames(steps);
    let animation_title = `clx-animation-${duration}` + generate_id();
    animations[dKey] = animation_title;
    add_css(`
        .${animation_title} {
            animation-name: ${frames};
            animation-duration: ${duration};
            animation-fill-mode: forwards;
        }
    `);
    return animation_title;
}

export class NotificatorAbstract{
    async notify() {
        throw new Error("unimplemented");
    }
    async breakNotification() {
        throw new Error("unimplemented");
    }
}

export class AudioNotificator extends NotificatorAbstract {
    constructor({audio_src=default_notification}) {
        super();
        this.audio_src = audio_src;
        this.notification_bell = new Audio(this.audio_src);
    }
    async notify() {
        this.notification_bell.currentTime=0;
        this.notification_bell.play().catch(console.error);
    }
    async breakNotification() {
        this.notification_bell.currentTime=0;
        this.notification_bell.pause();
    }
}

export class OscNotificator extends NotificatorAbstract {
    constructor({frequency=440, duration=.5}) {
        super();
        this.audio_context = new AudioContext;
        this.frequency = frequency;
        this.duration = duration;
        this.oscillator = this.audio_context.createOscillator();
        this.oscillator.connect(this.audio_context.destination);
    }
    async notify() {
        this.oscillator.frequency.setValueAtTime(this.frequency, this.audio_context.currentTime);
        this.oscillator.start();
        this.oscillator.stop(this.audio_context.currentTime + this.duration);
    }
    async breakNotification() {
        this.oscillator.stop();
    }
}

export class FlashNotificator extends NotificatorAbstract {
    constructor({duration='2s', steps=6}) {
        super();
        this.animation = create_css_animation_class(duration, steps);
    }
    async notify() {
        document.body.classList.remove(this.animation);
        document.body.classList.add(this.animation);
    }
    async breakNotification() {
        document.body.classList.remove(this.animation);
    }
}

export class NotifyNotificator extends NotificatorAbstract {
    constructor() {
        super();
        this.current = null;
    }
    async notify(text) {
        if(this.current) {
            this.current.close();
        }
        if (Notification.permission === "granted") {
            this.current = new Notification(text);
            return this.current;
        }
    }
    async breakNotification() {
        if(this.current) {
            this.current.close();
        }
    }
}

export class Notificator extends NotificatorAbstract {
    constructor({audio_type="oscillator", audio_options, flash, notify}) {
        super();
        this.notificators = [];
        if(audio_type === "oscillator") {
            this.notificators.push(new OscNotificator(audio_options ?? {}));
        }
        if(flash) {
            this.notificators.push(new FlashNotificator(flash));
        }
        if(notify) {
            this.notificators.push(new NotifyNotificator(notify));
        }
    }
    async notify(text) {
        return await Promise.all(this.notificators.map(el=>el.notify(text)));
    }
    async breakNotification() {
        return await Promise.all(this.notificators.map(el=>el.breakNotification()));
    }
}

