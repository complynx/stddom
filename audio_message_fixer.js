/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import {createFragment as $C} from "./create_dom.js";
import {add_css} from "./dom_utils.js";
import {XConsole} from "./console_enhancer.js";
import {stopper, mouseTracker} from "./event_utils.js";
import {unique_id} from "./dom_utils.js";

let console = new XConsole("Audio Fixer");

(()=>{
    if(!window.clx) window.clx = {};
    if(clx.audioFixer) return console.warn("Already running...");

    let skipProcessing = true;

    let AudioFixer = clx.audioFixer = {};

    let saveable = function(prop, def=null){
        let name = 'clx_AudioFixer_' + prop;
        let local = name in localStorage ? localStorage[name] : def;
        Object.defineProperty(AudioFixer, prop, {
            configurable: true,
            enumerable: true,
            get: () => local,
            set: (x) => local = localStorage[name] = x
        });
    };

    saveable('playbackRate', 1);
    saveable('reverseTime');
    saveable('autocontinue', true);
    saveable('skipOutgoing', true);
    saveable('stopOutOfScreen', true);
    saveable('stopOtherMedia', true);
    saveable('playNew', false);

    let $ = (s, e = document) => e.querySelector(s);
    let $A = (s, e = document) => e.querySelectorAll(s);
    let $R = (e) => e.parentNode && e.parentNode.removeChild(e);

    let overdrive_pos = .75;
    let overdrive_scale = 4;

    let stop_playing_ts = 10*60; //10 min

    // language=CSS
    {add_css(`
        :root {
            --clx-vk-header: #4a76a8;
        }
        
        .clx.amsg-controls{
            display: grid;
            grid-template: auto / auto 20%;
        }
        .clx.amsg-controls .dl-buttons{
            justify-self: center;
            grid-column: 2;
            grid-row:1;
        }
        
        .clx.amsg-controls .player{
            grid-row:1;
            grid-column: 1;
        }

        .clx-amsg-progress {
            height: 100%;
            width: 100%;
            position: absolute;
            top: 0;
            left: 100%;
            z-index: 1;
            background: rgba(255, 255, 255, 0.5);
        }

        .audio-msg-track--wave-wrapper {
            position: relative;
            overflow: hidden;
            user-select: none;
            -moz-user-select: none;
            -webkit-user-select: none;
        }

        .audio-msg-track {
            position: relative;
        }

        .clx.amsg-controls .dl::before {
            content: "";
            background-image: url(/images/blog/about_icons.png);
            background-repeat: no-repeat;
            width: 12px;
            height: 14px;
            background-position: 0px -309px;
            display: inline-block;
            margin-top: -5px;
            margin-bottom: -5px;
        }

        .clx.amsg-controls .dl {
            float: right;
            font-size: 0.6em;
            margin-right: 0.8em;
            opacity: 0.7;
            text-decoration: none;
        }

        .clx.amsg-controls .dl:hover {
            opacity: 1;
        }

        .audio-msg-track:not(.clx-player-attached) .clx.amsg-controls .playback-rate,
        .audio-msg-track:not(.clx-player-attached) .clx.amsg-controls .volume-slider,
        .audio-msg-track:not(.clx-player-attached) .clx.amsg-controls .menu {
            display: none;
        }

        .clx.amsg-controls .playback-rate {
            color: #2a5885;
            cursor: pointer;
            user-select: none;
            -moz-user-select: none;
            -webkit-user-select: none;
        }

        .clx.amsg-controls .playback-rate span {
        }

        .clx.amsg-controls .playback-rate .slower,
        .clx.amsg-controls .playback-rate .faster {
            width: 0.8em;
            text-align: center;
            display: inline-block;
        }

        .clx.amsg-controls .playback-rate .speed {
            width: 2.8em;
            text-align: center;
            display: inline-block;
        }

        .clx.amsg-controls .playback-rate .speed::after {
            content: 'x';
        }

        .clx.content-darkener {
            z-index: 8999;
            position: fixed;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            background: #00000033;
        }

        .clx.floating-window {
            --header-h: 2.5em;
            --padding: .7em;
            z-index: 9000;
            position: fixed;
            left: 50vw;
            top: 50vh;
            transform: translate(-50%, -50%);
            min-width: 8em;
            background: #fff;
            padding: var(--padding);
            padding-top: calc(var(--padding) + var(--header-h));
            border-radius: .3em;
            box-shadow: 0 0 4px #33333388;
        }

        .clx.floating-window h1 {
            position: absolute;
            display: block;
            font-size: 1em;
            margin: 0;
            line-height: var(--header-h);
            padding: 0 var(--padding);
            box-sizing: border-box;
            color: #fff;
            border-top-left-radius: .3em;
            border-top-right-radius: .3em;
            top: 0;
            height: var(--header-h);
            left: 0;
            right: 0;
            background: var(--clx-vk-header);
        }

        .clx.amsg-controls .volume-slider {
            --height: 2px;
            --width: ${skipProcessing?50:50/overdrive_pos}px;
            --thumb: 6px;
            --color-fg: #5181b8;
            --color-od-fg: #e21b00;
            --color-bg: #ffffffcc;
            height: var(--thumb);
            width: calc(var(--thumb) + var(--width));
            display: inline-block;
            position: relative;
            text-align: center;
            overflow: hidden;
            user-select: none;
            -moz-user-select: none;
            -webkit-user-select: none;
        }

        .clx.amsg-controls .volume-slider .range {
            width: var(--width);
            margin: calc((var(--thumb) - var(--height)) / 2) auto;
            height: var(--height);
            background: var(--color-fg);
            display: block;
        }
        .clx.amsg-controls .volume-slider.has-overdrive .range {
             background: linear-gradient(to right,
                    var(--color-fg) 0%,
                    var(--color-fg) ${overdrive_pos*100}%,
                    var(--color-od-fg) ${overdrive_pos*100 + 0.0001}%,
                    var(--color-od-fg) 100%);
         }

        .clx.amsg-controls .volume-slider .thumb::before {
            content: '';
            height: var(--thumb);
            width: var(--thumb);
            transform: translateX(-50%);
            border-radius: 50%;
            background: var(--color-fg);
            position: absolute;
            z-index: 2;
            display: block;
            opacity: 0;
            top: calc((var(--thumb) - var(--height)) / -2);
        }
        .clx.amsg-controls .volume-slider.overdrive .thumb::before {
            background: var(--color-od-fg);
        }

        .clx.amsg-controls .volume-slider:hover .thumb::before {
            opacity: 1;
        }

        .clx.amsg-controls .volume-slider .thumb {
            position: absolute;
            left: 0;
            height: var(--height);
            width: var(--width);
            background: var(--color-bg);
            z-index: 1;
            display: block;
            top: calc((var(--thumb) - var(--height)) / 2);
        }
        .clx.amsg-controls .menu {
            float: right;
            display: inline-block;
            position: relative;
            width: 22px;
            cursor: pointer;
            outline: none;
            height: 20px;
            margin-right: 5px;
            background: url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Crect%20width%3D%2224%22%20height%3D%2224%22%20opacity%3D%22.15%22%2F%3E%3Cpath%20fill%3D%22%23828A99%22%20d%3D%22M5%2C14%20C3.8954305%2C14%203%2C13.1045695%203%2C12%20C3%2C10.8954305%203.8954305%2C10%205%2C10%20C6.1045695%2C10%207%2C10.8954305%207%2C12%20C7%2C13.1045695%206.1045695%2C14%205%2C14%20Z%20M12%2C14%20C10.8954305%2C14%2010%2C13.1045695%2010%2C12%20C10%2C10.8954305%2010.8954305%2C10%2012%2C10%20C13.1045695%2C10%2014%2C10.8954305%2014%2C12%20C14%2C13.1045695%2013.1045695%2C14%2012%2C14%20Z%20M19%2C14%20C17.8954305%2C14%2017%2C13.1045695%2017%2C12%20C17%2C10.8954305%2017.8954305%2C10%2019%2C10%20C20.1045695%2C10%2021%2C10.8954305%2021%2C12%20C21%2C13.1045695%2020.1045695%2C14%2019%2C14%20Z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") 50% no-repeat;
            opacity: .7;
        }
        .clx.amsg-controls .menu:hover{
            opacity: 1;
        }
        .clx.amsg-controls .menu:hover .eltt_arrow_back{
            pointer-events: all;
        }
        .clx.amsg-controls .menu:hover .eltt{
            opacity: 1;
            pointer-events: all;
            transform: translate(0) !important;
        }
        
        .clx input[type=checkbox]:checked ~ .checkbox-open{
            opacity: 1;
            transition: 0.5s;
        }
        .clx input[type=checkbox]:not(:checked) ~ .checkbox-open{
            overflow: hidden;
            opacity: 0;
            display: none;
            transition: 0.5s;
            height: 0;
        }
        
        .clx input[type=checkbox] + label{
            cursor:pointer;
            position: relative;
            display:block;
            user-select: none;
            -moz-user-select: none;
            -webkit-user-select: none;
            padding: 0 1em;
            padding-right: 3em;
            height: 30px;
            line-height: 30px;
            color: #2a5885;
            white-space: nowrap;
        }
        .clx input[type=checkbox] + label:hover{
            background-color: #e4eaf0;
        }
        .clx input[type=checkbox]{
            display: none;
            opacity: 0;
            height: 0;
            width: 0;
        }
        .clx input[type=checkbox] + label:before{
            content: "";
            display: block;
            position: absolute;
            right: 7px;
            border-radius: 45px;
            bottom: 12px;
            width: 20px;
            height: 9px;
            background: #ced7e0;
            transition: .1s ease;
        }
        .clx input[type=checkbox]:checked + label:before{
            background: #bccde0;
        }
        .clx input[type=checkbox] + label:after{
            content: "";
            box-sizing: border-box;
            display: block;
            position: absolute;
            right: 16px;
            border-radius: 45px;
            border: 1px solid #ced7e0;
            bottom:10px;
            width: 13px;
            height: 13px;
            background: #fff;
            transition: .1s ease;
        }
        .clx input[type=checkbox]:checked + label:after{
            background-color: #5181b8;
            border-color: #5181b8;
            right: 5px;
        }
        #clx-pause{
            --size:3rem;
            position: fixed;
            display: block;
            color: #fff;
            text-align: center;
            padding: 0;
            font-size: 1.6em;
            bottom: calc(var(--size)*-1);
            right: 6rem;
            height: var(--size);
            width: var(--size);
            border-radius: 50%;
            background-color: #5181b8;
            cursor: pointer;
            user-select: none;
            -moz-user-select: none;
            -webkit-user-select: none;
            transition: .2s ease-out;
        }
        #clx-pause:after{
            --pause-size: 0.3em;
            content: "";
            display: block;
            position: absolute;
            left: .65em;
            top: .65em;
            width:var(--pause-size);
            height: calc(var(--pause-size)*3);
            border-left: var(--pause-size) solid #fff;
            border-right: var(--pause-size) solid #fff;
        }
        #clx-pause.visible{
            transform: translateY(calc(var(--size)/-1.3));
            transition: .2s ease-out;
        }
        #clx-pause.stop:after{
            background: #fff;
        }
        #clx-pause.play:after{
            width: 0;
            height: 0;
            border-left: calc(var(--pause-size)*.87) solid #fff;
            border-top: calc(var(--pause-size)/2) solid transparent;
            border-bottom: calc(var(--pause-size)/2) solid transparent;
            border-right: 0 none transparent;
        }
    `);}

    AudioFixer.version = 0.94;
    console.log("Current version is", AudioFixer.version);
    if(parseFloat(localStorage.clxAudioFixerVersion) < AudioFixer.version){
        console.log(`Previous version was ${localStorage.clxAudioFixerVersion}. Opening version message.`);
        localStorage.clxAudioFixerVersion = AudioFixer.version;
        AudioFixer.closeVersionMessage = function(){
            document.body.removeChild($('.clx.content-darkener'));
            document.body.removeChild($('.clx.floating-window'));
        };
        document.body.appendChild($C(`
            <div class="clx content-darkener" onclick="clx.audioFixer.closeVersionMessage()">&nbsp;</div>
            <div class="clx floating-window">
                <h1>Мы обновились!</h1>
                <div class="contents">
                    Появились настройки, увеличилась стабильность.<br>
                    Теперь плеер остановится во время аудиосообщения.<br>
                    А ещё мы добавили кнопку паузы, когда аудиосообщение<br>
                    не на экране;<br>
                    и режим автоматического воспроизведения новых сообщений.<br>
                    <br>
                    Спасибо, что плаваете поездами аэрофлота!
                </div>
            </div>
        `));

        if('AudioMessagePlayerFixReverseTime' in localStorage){
            AudioFixer.reverseTime = localStorage.AudioMessagePlayerFixReverseTime;
            AudioFixer.playbackRate = localStorage.AudioMessagePlayerFixPlaybackRate;
        }
    }
    delete localStorage.AudioMessagePlayerFixReverseTime;
    delete localStorage.AudioMessagePlayerFixPlaybackRate;

    let old = window.AudioMessagePlayer;

    // Create an audio processor
    let audio_el = AudioFixer.audioElement = document.createElement('audio');
    audio_el.crossOrigin = 'Anonymous';
    audio_el.playbackRate = AudioFixer.playbackRate;

    let AudioContext = window.AudioContext || window.webkitAudioContext;

    function minSec(time) {
        time = Math.floor(time);
        let s = time % 60;
        let m = (time - s) / 60;
        return m + ":" + (s < 10 ? "0" : '') + s;
    }

    AudioFixer.fixElement = function (element) {
        if (!element.classList.contains("clx-fixed")) {
            element.onclick = null;
            element.classList.add("clx-fixed");

            let b = element.querySelector('.audio-msg-track--btn');
            b.addEventListener('click', function (ev) {
                AudioFixer.togglePlay(this, ev);
            });
            $('.audio-msg-track--wave-wrapper', element)
                .appendChild($C("<div class='clx-amsg-progress'>&nbsp;</div>"));

            let checker = (func, end) => stopper(function (ev) {
                let el = this.closest('.audio-msg-track');
                if (el !== AudioFixer.element || (end && audio_el.ended)) {
                    AudioFixer.togglePlay(el);
                } else {
                    return func.apply(this, arguments);
                }
            });
            let checker_np = (func) => stopper(function (ev) {
                let el = this.closest('.audio-msg-track');
                if (el === AudioFixer.element) {
                    return func.apply(this, arguments);
                }
            });
            if (element.nextSibling && element.nextSibling.classList
                && element.nextSibling.classList.contains("vk_audio_msg_btns")) {
                $R(element.nextSibling);
                vkopt.messages.processNode = ()=>{};
            }

            element.appendChild($C(`
                <div class="clx amsg-controls">
                    <div class="dl-buttons">
                        <a class="dl" href="${element.dataset.mp3}">mp3</a>
                        <a class="dl" href="${element.dataset.ogg}">ogg</a>
                    </div>
                </div>
            `));

            element.appendChild($C(`<div class="slider_hint audio_player_hint clx-seek-hint">0:00</div>`));
            $('.audio-msg-track--duration', element).addEventListener('click', checker((ev) => {
                AudioFixer.reverseTime = !AudioFixer.reverseTime;
                AudioFixer.timeUpdateListener();
            }, true));

            $('.audio-msg-track--wave-wrapper', element).addEventListener('mousemove', checker_np((ev) => {
                AudioFixer.hint(ev);
            }));
            $('.audio-msg-track--wave-wrapper', element).addEventListener('mousedown', checker_np(mouseTracker((ev)=>{
                AudioFixer.seek(ev);
                AudioFixer.hint(ev);
            })));

            let hintToggle = function (ev) {
                let el = this.closest('.audio-msg-track');
                if (el === AudioFixer.element) {
                    $('.clx-seek-hint', element).classList[ev.type === 'mouseleave'?"remove":'add']('visible');
                }
            };
            $('.audio-msg-track--wave-wrapper', element).addEventListener('mouseenter', hintToggle);
            $('.audio-msg-track--wave-wrapper', element).addEventListener('mouseleave', hintToggle);
        }
    };
    AudioFixer.rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4];
    AudioFixer.playbackRateChange = (shift) => {
        if (shift === 0) audio_el.playbackRate = 1;
        else if (shift > 0) {
            for (let i of AudioFixer.rates) {
                if (i > audio_el.playbackRate) {
                    audio_el.playbackRate = i;
                    break;
                }
            }
        } else {
            for (let i = AudioFixer.rates.length - 1; --i; i >= 0) {
                if (AudioFixer.rates[i] < audio_el.playbackRate) {
                    audio_el.playbackRate = AudioFixer.rates[i];
                    break;
                }
            }
        }
        AudioFixer.playbackRate = audio_el.playbackRate;
        AudioFixer.playbackRateEl.innerText = audio_el.playbackRate;
    };
    AudioFixer.hint = function (ev) {
        let rect = $('.audio-msg-track--wave', this.element).getBoundingClientRect();
        let x = Math.min(Math.max(0, ev.clientX - rect.left), rect.width);
        let time = audio_el.duration * (x / rect.width);
        let el = $('.clx-seek-hint', this.element);
        let wrect = this.element.getBoundingClientRect();
        el.innerText = minSec(time);
        el.style.top = rect.top - wrect.top - el.offsetHeight - 8 + 'px';
        el.style.left = rect.left - wrect.left - (el.offsetWidth / 2) + x + 'px';
    };
    AudioFixer.seek = function (ev) {
        let rect = $('.audio-msg-track--wave', this.element).getBoundingClientRect();
        let x = Math.min(Math.max(0, ev.clientX - rect.left), rect.width);
        audio_el.currentTime = audio_el.duration * (x / rect.width);
    };
    AudioFixer.volume_hint = function (ev) {
        let rect = $('.range', this.volumeSlider).getBoundingClientRect();
        let vol = Math.min(Math.max(0, ev.clientX - rect.left) / rect.width, 1);
        let el = this.volumeSliderHint;
        let wrect = this.element.getBoundingClientRect();
        let volo = skipProcessing ? vol : this.volume_overdrive_calc(vol);
        el.innerText = Math.round(volo*100) + "%";
        el.style.top = rect.top - wrect.top - el.offsetHeight - 8 + 'px';
        el.style.left = rect.left - wrect.left - (el.offsetWidth / 2) + (vol * rect.width) + 'px';
    };
    AudioFixer.volume_overdrive_calc = function(vol){
        if(vol < overdrive_pos) return vol / overdrive_pos;
        let od = vol - overdrive_pos;
        return 1 + (od * overdrive_scale);
    };
    AudioFixer.volume_overdrive_back = function(vol){
        if(vol <= 1) return vol * overdrive_pos;
        let od = vol - 1;
        return overdrive_pos + (od / overdrive_scale);
    };
    AudioFixer.volume_set = function (ev) {
        let rect = $('.range', this.volumeSlider).getBoundingClientRect();
        let vol = Math.min(Math.max(0, ev.clientX - rect.left) / rect.width, 1);
        let wrect = this.volumeSlider.getBoundingClientRect();
        if(!skipProcessing){
            let volo = AudioFixer.volume.gain.value = this.volume_overdrive_calc(vol);
            this.volumeSlider.classList[volo>1?"add":'remove']('overdrive');
        }else{
            audio_el.volume = vol;
        }

        $('.thumb', this.volumeSlider).style.left = (vol * rect.width) + rect.left - wrect.left + 'px';
    };
    AudioFixer.timeUpdateListener = function () {
        let progress = audio_el.duration > 0 ? audio_el.currentTime / audio_el.duration : 1;
        let el = $('.clx-amsg-progress', this.element);
        let w = parseInt(getComputedStyle($('.audio-msg-track--wave', this.element)).getPropertyValue('width'));
        el.style.left = (progress * w + 8) + "px";
        $('.audio-msg-track--duration', this.element).innerText = AudioFixer.reverseTime ?
            '-' + minSec(audio_el.duration - audio_el.currentTime) :
            minSec(audio_el.currentTime);

        this.checkOutOfView();
    };
    AudioFixer.checkOutOfView = function(){
        let container = this.element.closest('.ui_scroll_overflow');
        let container_rect = container && container.getBoundingClientRect();
        let rect = this.element.getBoundingClientRect();
        let pb = this.element.closest('#page_body');
        if(!audio_el.paused && !audio_el.ended &&
            (pb == null || container_rect == null
                || (rect.top > container_rect.bottom || rect.bottom < container_rect.top))){
            this.staticPause.classList.add('visible');
        }else{
            this.staticPause.classList.remove('visible');
        }
    };
    AudioFixer.endedListener = function () {
        let el = this.element;
        el.classList.remove('audio-msg-track_playing');
        $('.clx-amsg-progress', this.element).style.left = "100%";
        $('.audio-msg-track--duration', this.element).innerText = minSec(audio_el.duration);
        this.staticPause.classList.remove('visible');
        AudioFixer.checkNext();
    };
    {
        AudioFixer.element_ts = Date.now() / 1000.;
        AudioFixer.checkNext = function () {
            if (this.autocontinue) {
                let chat = this.element ? this.element.closest('.im-page-chat-contain') : $('.im-page-chat-contain');
                // let mesg = this.element.closest('.im-mess');
                let container = chat && chat.closest('.ui_scroll_overflow');
                let container_rect = container && container.getBoundingClientRect();
                let voice_messages = chat && $A(`.im-mess-stack .im-mess${this.skipOutgoing ? ":not(.im-mess_out):not(.im_out)" : ""} .audio-msg-track`, chat);
                if (voice_messages)
                    for (let vm of voice_messages) {
                        let mesg_n = vm.closest('.im-mess');
                        if(parseInt(mesg_n.dataset.ts) > this.element_ts) {
                            let mesg_rect = mesg_n.getBoundingClientRect();
                            // if (Math.abs(parseInt(mesg_n.dataset.ts) - parseInt(mesg.dataset.ts)) < stop_playing_ts)
                            if (!this.stopOutOfScreen || mesg_rect.top < container_rect.bottom) {
                                this.togglePlay(vm);
                                return;
                            }
                            break;
                        }
                    }
            } else if (this.autocontinue) {
                let voice_messages = $(`.im-mess-stack .im-mess${this.skipOutgoing ? ":not(.im-mess_out):not(.im_out)" : ""} .audio-msg-track`);
                if (voice_messages)
                    for (let i of voice_messages) {
                        let mesg_n = i.closest('.im-mess');
                        if(parseInt(mesg_n.dataset.ts) > start) {
                            let mesg_rect = mesg_n.getBoundingClientRect();
                            // if (Math.abs(parseInt(mesg_n.dataset.ts) - parseInt(mesg.dataset.ts)) < stop_playing_ts)
                            if (!this.stopOutOfScreen || mesg_rect.top < container_rect.bottom) {
                                this.togglePlay(i);
                                return;
                            }
                        }
                    }
            }
            this.resumeGlobalMedia();
        };
    }
    {
        let ctx = null;
        Object.defineProperty(AudioFixer, "context", {
            configurable: true, enumerable: true,
            get: function () {
                if (!ctx) {
                    ctx = new AudioContext();
                    AudioFixer.source = ctx.createMediaElementSource(audio_el);

                    // Create a compressor node
                    AudioFixer.compressor = ctx.createDynamicsCompressor();
                    AudioFixer.compressor.threshold.value = -50;
                    AudioFixer.compressor.knee.value = 40;
                    AudioFixer.compressor.ratio.value = 12;
                    AudioFixer.compressor.attack.value = 0;
                    AudioFixer.compressor.release.value = 0.25;
                    AudioFixer.source.connect(AudioFixer.compressor);

                    // Create a master volume node
                    AudioFixer.volume = ctx.createGain();
                    AudioFixer.volume.gain.value = audio_el.volume;
                    AudioFixer.compressor.connect(AudioFixer.volume);

                    // Output
                    AudioFixer.volume.connect(ctx.destination);

                    audio_el.volume = 1;
                    AudioFixer.setVolumeSliderPosition();
                }
                return ctx;
            }
        });
    }
    AudioFixer.pause = function () {
        let el = this.element;
        if(el) {
            el.classList.remove('audio-msg-track_playing');
            this.staticPause.classList.remove('visible');
            audio_el.pause();
        }
    };
    AudioFixer.play = function () {
        let el = this.element;
        el.classList.add('audio-msg-track_playing');
        audio_el.play();
    };
    AudioFixer.togglePlay = function (element = this.element, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        if (!element.classList.contains('audio-msg-track')) {
            element = element.closest('.audio-msg-track');
        }
        this.fixElement(element);
        if (this.element !== element) {
            this.detachPlayer(this.element);
            this.attachPlayer(element);
        }

        if (element.classList.contains('audio-msg-track_playing')) {
            this.pause();
            this.resumeGlobalMedia();
        } else {
            this.play();
            this.pauseGlobalMedia();
        }
    };
    AudioFixer.attachPlayer = function (element) {
        this.element = element;
        this.element_ts = parseInt(this.element.closest('.im-mess').dataset.ts);
        audio_el.src = element.dataset.ogg;
        audio_el.playbackRate = this.playbackRate;
        let ctx = skipProcessing || AudioFixer.context;
        this.element.classList.add("clx-player-attached");
        $('.clx.amsg-controls', element).appendChild(this.playerControls);
        this.setVolumeSliderPosition();
    };
    AudioFixer.setVolumeSliderPosition = function (){
        let rect = $('.range', this.volumeSlider).getBoundingClientRect();
        let wrect = this.volumeSlider.getBoundingClientRect();
        $('.thumb', this.volumeSlider).style.left = (
            (skipProcessing || !(AudioFixer.volume) ? audio_el.volume
                : AudioFixer.volume_overdrive_back(AudioFixer.volume.gain.value))
            * rect.width) + rect.left - wrect.left + 'px';
    };
    AudioFixer.detachPlayer = function (element) {
        if (!element) return;
        element = element.closest('.audio-msg-track');
        this.pause();
        this.element.classList.remove("clx-player-attached");
        $('.clx-amsg-progress', this.element).style.left = "100%";
        $('.audio-msg-track--duration', this.element).innerText = minSec(audio_el.duration);
        $('.clx-seek-hint', this.element).classList.remove("visible");
    };
    AudioFixer.pauseGlobalMedia = function () {
        if(!this.stopOtherMedia) return;
        window.Notifier && Notifier.lcSend('video_start');
        let aud = window.ap || window.audio;
        let pl = aud.playing || aud.isPlaying;
        if(pl.call(aud)) {
            aud.pause();
            aud.pausedByMsg = true;
        }
    };
    AudioFixer.resumeGlobalMedia = function () {
        window.Notifier && Notifier.lcSend('video_hide');
        let aud = window.ap || window.audio;
        if(aud.pausedByMsg) {
            aud.play();
            delete aud.pausedByMsg;
        }
    };

    Object.defineProperty(AudioFixer, "vk_player", {
        enumerable: true,
        configurable: true,
        get: () => old
    });

    Object.defineProperty(AudioFixer, "redrawWaves", {
        enumerable: true,
        configurable: true,
        get: () => old.redrawWaves,
        set: (p) => {
            old.redrawWaves = p
        }
    });
    Object.defineProperty(AudioFixer, "getWave", {
        enumerable: true,
        configurable: true,
        get: () => old.getWave,
        set: (p) => {
            old.getWave = p
        }
    });

    {
        let player_id = unique_id("clx_player");
        let pc = $C(`
            <div class='player' id="${player_id}">
                <span class="playback-rate">
                    <span class='slower'>-</span>
                    <span class='speed'>${AudioFixer.playbackRate}</span>
                    <span class='faster'>+</span>
                </span>
                <div class="volume-slider${skipProcessing ? "" : " has-overdrive"}">
                    <span class="range">&nbsp;</span>
                    <span class="thumb">&nbsp;</span>
                </div>
                <div class="slider_hint audio_player_hint clx-vol-hint">0:00</div>
                <div class="menu">
                    <div class="eltt eltt_arrow_size_normal eltt_align_center eltt_bottom"
                        style="display: block; left: -48px; top: 23px;">
                        <div class="eltt_arrow_back">
                            <div class="eltt_arrow"></div>
                        </div>
                        <div class="eltt_content">
                            <div class="audio_row__more_actions">
                                <span>
                                    <input type="checkbox" id="${player_id}_autocontinue"${AudioFixer.autocontinue ? " checked" : ""}>
                                    <label for="${player_id}_autocontinue" title="Автоматически воспроизводить следующее аудиосообщение">Воспроизводить следующее</label>
                                    <span class="checkbox-open">
                                        <input type="checkbox" id="${player_id}_ap_skip_out"${AudioFixer.skipOutgoing ? " checked" : ""}>
                                        <label for="${player_id}_ap_skip_out" title="Пропускать отправленные вами сообшения">Пропускать исходящие</label>
                                        <input type="checkbox" id="${player_id}_ap_stop_overflow"${AudioFixer.stopOutOfScreen ? " checked" : ""}>
                                        <label for="${player_id}_ap_stop_overflow" title="Останавливаться, если следующее аудиосообщение за пределами экрана">Не выходить за экран</label>
                                        <input type="checkbox" id="${player_id}_ap_play_new"${AudioFixer.playNew ? " checked" : ""}>
                                        <label for="${player_id}_ap_play_new" title="Воспроизводить новые аудиосообщения, согласно настройкам (в пределах или за пределами экрана)">Воспроизводить новые</label>
                                    </span>
                                </span>
                                <input type="checkbox" id="${player_id}_ap_stop_media"${AudioFixer.stopOtherMedia ? " checked" : ""}>
                                <label for="${player_id}_ap_stop_media" title="Останавливать видео или аудио, если оно проигрывалось, во время воспроизведения аудиосообщения">Приостанавливать медиа</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
        pc = AudioFixer.playerControls = pc.querySelector('.player');

        $(`#${player_id}_autocontinue`, pc).addEventListener('change', (ev) => {
            AudioFixer.autocontinue = !!ev.target.checked;
        });
        $(`#${player_id}_ap_skip_out`, pc).addEventListener('change', (ev) => {
            AudioFixer.skipOutgoing = !!ev.target.checked;
        });
        $(`#${player_id}_ap_stop_overflow`, pc).addEventListener('change', (ev) => {
            AudioFixer.stopOutOfScreen = !!ev.target.checked;
        });
        $(`#${player_id}_ap_stop_media`, pc).addEventListener('change', (ev) => {
            AudioFixer.stopOtherMedia = !!ev.target.checked;
        });
        $(`#${player_id}_ap_play_new`, pc).addEventListener('change', (ev) => {
            AudioFixer.playNew = !!ev.target.checked;
        });

        AudioFixer.playbackRateDownButton = $('.slower', pc);
        AudioFixer.playbackRateDownButton.addEventListener('click', stopper((ev) => {
            AudioFixer.playbackRateChange(-1);
        }));
        AudioFixer.playbackRateUpButton = $('.faster', pc);
        AudioFixer.playbackRateUpButton.addEventListener('click', stopper((ev) => {
            AudioFixer.playbackRateChange(1);
        }));
        AudioFixer.playbackRateEl = $('.speed', pc);
        AudioFixer.playbackRateEl.addEventListener('click', stopper((ev) => {
            AudioFixer.playbackRateChange(0);
        }));
        AudioFixer.playbackRateEl.innerText = AudioFixer.playbackRate;

        AudioFixer.volumeSlider = $('.volume-slider', pc);

        AudioFixer.volumeSlider.addEventListener('mousemove', stopper((ev) => {
            AudioFixer.volume_hint(ev);
        }));
        AudioFixer.volumeSlider.addEventListener('mousedown', stopper(mouseTracker((ev) => {
            AudioFixer.volume_hint(ev);
            AudioFixer.volume_set(ev);
        })));
        AudioFixer.volumeSliderHint = $('.clx-vol-hint', pc);
        let hintToggle = function (ev) {
            AudioFixer.volumeSliderHint.classList[ev.type === 'mouseleave' ? "remove" : 'add']('visible');
        };
        AudioFixer.volumeSlider.addEventListener('mouseenter', hintToggle);
        AudioFixer.volumeSlider.addEventListener('mouseleave', hintToggle);

        AudioFixer.menuButton = $('.menu', pc);
        AudioFixer.menuWrapper = $('.menu .eltt', pc);

        AudioFixer.menuButton.addEventListener('mouseenter', (ev) => {
            let use_top = ev.clientY > window.innerHeight / 2;
            let menu = AudioFixer.menuWrapper;
            let menuArrow = $('.eltt_arrow_back', menu);
            menu.classList.remove(use_top ? "eltt_bottom" : 'eltt_top');
            menu.classList.add(use_top ? "eltt_top" : 'eltt_bottom');
            menu.style.top = (use_top ? -(menu.clientHeight + 5) : AudioFixer.menuButton.clientHeight + 2) + 'px';
            menu.style.left = -(menu.clientWidth - AudioFixer.menuButton.clientWidth) / 2 + 'px';
            menuArrow.style.left = (menu.clientWidth - menuArrow.offsetWidth) / 2 + 'px';
        });

        AudioFixer.setVolumeSliderPosition();
    }
    {
        document.body.appendChild($C(`<div id="clx-pause">&nbsp;</div>`));
        AudioFixer.staticPause = $("#clx-pause");
        AudioFixer.staticPause.addEventListener('click', ()=>{
            AudioFixer.togglePlay(AudioFixer.element);
        });
    }

    audio_el.addEventListener('timeupdate', AudioFixer.timeUpdateListener.bind(AudioFixer), {passive: true});
    audio_el.addEventListener('ended', AudioFixer.endedListener.bind(AudioFixer), {passive: true});

    function isLoaded() {
        if (old && old.loaded) {
            AudioFixer.loaded = true;
        } else if (window.stManager) {
            stManager.add('voice_message_player.js', () => {});
        }
    }

    if(window.ap){
        ap.on(AudioFixer, AudioPlayer.EVENT_PLAY, ()=>{
            delete ap.pausedByMsg;
            AudioFixer.pause();
        });
    }else if(window.audio){
        audio.onPlay(()=>{
            delete audio.pausedByMsg;
            AudioFixer.pause();
        })
    }
    if(window.Notifier){
        Notifier.addRecvClbk('audio_start', 'audio_msg', ()=>AudioFixer.pause());
        Notifier.addRecvClbk('video_start', 'audio_msg', ()=>AudioFixer.pause());
    }

    {
        AudioFixer.process_node = function (node) {
            if (node.querySelectorAll)
                for (let i of $A(".audio-msg-track", node)) {
                    this.fixElement(i);
                }
        };
        AudioFixer.page_observer = new MutationObserver((mutations) => {
            for (let i of mutations) {
                if (i.addedNodes) for (let j of i.addedNodes) {
                    AudioFixer.process_node(j);
                }
            }
            if(AudioFixer.playNew && (audio_el.paused || audio_el.ended)) AudioFixer.checkNext();
        });
        AudioFixer.page_observer.observe($('#page_body'), {childList: true, subtree: true});
        AudioFixer.process_node($('#page_body'));
        if (window.vkopt) {
            if (vkopt.messages)
                vkopt.messages.processNode = () => {};
        }
    }

    Object.defineProperty(window, "AudioMessagePlayer", {
        enumerable: true,
        configurable: true,
        get: () => AudioFixer,
        set: (p) => {
            old = p;
            isLoaded();
        }
    });
    isLoaded();
})();
