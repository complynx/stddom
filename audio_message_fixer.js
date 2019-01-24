import {createFragment as $C} from "./create_dom.js";
import {add_css} from "./dom_utils.js";
import {XConsole} from "./console_enhancer.js";

let console = new XConsole("Audio Fixer");

(()=>{
    if(!window.clx) window.clx = {};
    if(clx.audioFixer) return console.warn("Already running...");

    let skipProcessing = true;

    let AudioFixer = clx.audioFixer = {};

    let $ = (s, e = document) => e.querySelector(s);
    let $A = (s, e = document) => e.querySelectorAll(s);


    // language=CSS
    {add_css(`
        :root{
            --clx-vk-header: #4a76a8;
        }


        .clx-amsg-progress {
            height: 100%;
            width: 100%;
            position: absolute;
            top: 0;
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

        .clx-amsg-buttons .dl::before {
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

        .clx-amsg-buttons .dl {
            float: right;
            font-size: 0.6em;
            margin-right: 0.8em;
            opacity: 0.7;
            text-decoration: none;
        }

        .clx-amsg-buttons .dl:hover {
            opacity: 1;
        }

        .audio-msg-track:not(.clx-player-attached) .clx-amsg-buttons .playback-rate,
        .audio-msg-track:not(.clx-player-attached) .clx-amsg-buttons .volume-slider{
            display: none;
        }

        .clx-amsg-buttons .playback-rate {
            color: #2a5885;
            cursor: pointer;
            user-select: none;
            -moz-user-select: none;
            -webkit-user-select: none;
        }

        .clx-amsg-buttons .playback-rate span {
        }

        .clx-amsg-buttons .playback-rate .slower,
        .clx-amsg-buttons .playback-rate .faster {
            width: 0.8em;
            text-align: center;
            display: inline-block;
        }

        .clx-amsg-buttons .playback-rate .speed {
            width: 2.8em;
            text-align: center;
            display: inline-block;
        }

        .clx-amsg-buttons .playback-rate .speed::after {
            content: 'x';
        }

        .clx-content-darkener{
            z-index: 9000;
            position: fixed;
            left: 0;
            top: 0;
            right:0;
            bottom: 0;
            background: #00000033;
        }
        .clx-version-message{
            --header-h: 2.5em;
            --padding: .7em;
            z-index: 9001;
            position: fixed;
            left: 50vw;
            top: 50vh;
            transform: translate(-50%,-50%);
            min-width: 8em;
            background: #fff;
            padding: var(--padding);
            padding-top: calc(var(--padding) + var(--header-h));
            border-radius: .3em;
            box-shadow: 0 0 4px #33333388;
        }
        .clx-version-message::before{
            content: "Мы обновились!";
            position: absolute;
            display: block;
            line-height: var(--header-h);
            padding: 0 var(--padding);
            box-sizing: border-box;
            color: #fff;
            border-top-left-radius: .3em;
            border-top-right-radius: .3em;
            top:0;
            height: var(--header-h);
            left: 0;
            right: 0;
            background: var(--clx-vk-header);
        }

        .clx-amsg-buttons .volume-slider{
            --height: 2px;
            --width: 50px;
            --thumb: 6px;
            --color-fg:#5181b8;
            --color-bg:#ffffffcc;
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
        .clx-amsg-buttons .volume-slider .range{
            width: var(--width);
            margin: calc((var(--thumb) - var(--height)) / 2) auto;
            height: var(--height);
            background: var(--color-fg);
            display: block;
        }
        .clx-amsg-buttons .volume-slider .thumb::before{
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
        .clx-amsg-buttons .volume-slider:hover .thumb::before{
            opacity: 1;
        }
        .clx-amsg-buttons .volume-slider .thumb{
            position: absolute;
            left: 0;
            height: var(--height);
            width: var(--width);
            background: var(--color-bg);
            position: absolute;
            z-index:1;
            display: block;
            top:calc((var(--thumb) - var(--height)) / 2);
        }
        
    `);}

    AudioFixer.version = 0.9;
    console.log("Current version is", AudioFixer.version);
    if(parseFloat(localStorage.clxAudioFixerVersion) < AudioFixer.version){
        console.log(`Previous version was ${localStorage.clxAudioFixerVersion}. Opening version message.`);
        localStorage.clxAudioFixerVersion = AudioFixer.version;
        AudioFixer.closeVersionMessage = function(){
            document.body.removeChild($('.clx-content-darkener'));
            document.body.removeChild($('.clx-version-message'));
        };
        document.body.appendChild($C(`
<div class="clx-content-darkener" onclick="clx.audioFixer.closeVersionMessage()">&nbsp;</div>
<div class="clx-version-message">
     Я запилил пару апдейтов. Добавил громкость, удалил пару багов.<br>
     Пишите мне, если что не работает или чего-то хочется добавить!<br><br>
     Спасибо, что летаете нашими авиалиниями!
</div>`));
    }

    let old = window.AudioMessagePlayer;

    // Create an audio processor
    let audio_el = AudioFixer.audioElement = document.createElement('audio');
    audio_el.crossOrigin = 'Anonymous';
    let AudioContext = window.AudioContext || window.webkitAudioContext;


    function minSec(time) {
        time = Math.floor(time);
        let s = time % 60;
        let m = (time - s) / 60;
        return m + ":" + (s < 10 ? "0" : '') + s;
    }

    let reverseTime = localStorage.AudioMessagePlayerFixReverseTime;
    let stopper = (func) => {
        return function (ev) {
            ev.stopPropagation();
            ev.preventDefault();

            return func.apply(this, arguments);
        };
    };
    let playbackRate = localStorage.AudioMessagePlayerFixPlaybackRate || 1;
    audio_el.playbackRate = playbackRate;


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
            if (element.nextSibling && element.nextSibling.classList.contains("vk_audio_msg_btns")) {
                element.parentNode.removeChild(element.nextSibling);
            }

            element.appendChild($C(`
<div class='clx-amsg-buttons'>
    <span class="playback-rate"><span class='slower'>-</span><span class='speed'>${audio_el.playbackRate}</span><span class='faster'>+</span></span>
    <div class="volume-slider">
        <span class="range">&nbsp;</span>
        <span class="thumb">&nbsp;</span>
    </div>
    <a class="dl" href="${element.dataset.mp3}">mp3</a>
    <a class="dl" href="${element.dataset.ogg}">ogg</a>
</div>`));

            $('.clx-amsg-buttons .slower', element).addEventListener('click', checker((ev) => {
                AudioFixer.playbackRateChange(-1);
            }));
            $('.clx-amsg-buttons .faster', element).addEventListener('click', checker((ev) => {
                AudioFixer.playbackRateChange(1);
            }));
            $('.clx-amsg-buttons .speed', element).addEventListener('click', checker((ev) => {
                AudioFixer.playbackRateChange(0);
            }));
            $('.audio-msg-track--duration', element).addEventListener('click', checker((ev) => {
                this.reverseTime = !this.reverseTime;
                AudioFixer.timeUpdateListener();
            }, true));
            element.appendChild($C(`<div class="slider_hint audio_player_hint">0:00</div>`));

            $('.audio-msg-track--wave-wrapper', element).addEventListener('mousemove', checker_np((ev) => {
                if (ev.buttons & 1) AudioFixer.seek(ev);
                AudioFixer.hint(ev);
            }));
            $('.audio-msg-track--wave-wrapper', element).addEventListener('mouseup', checker_np((ev) => {
                AudioFixer.seek(ev);
            }));
            $('.audio-msg-track--wave-wrapper', element).addEventListener('click', checker((ev) => {
                AudioFixer.seek(ev);
            }));

            let hinter = function (ev) {
                let el = this.closest('.audio-msg-track');
                if (el === AudioFixer.element) {
                    $('.slider_hint', element).classList[ev.type === 'mouseleave'?"remove":'add']('visible');
                }
            };
            $('.audio-msg-track--wave-wrapper', element).addEventListener('mouseenter', hinter);
            $('.audio-msg-track--wave-wrapper', element).addEventListener('mouseleave', hinter);
            $('.volume-slider', element).addEventListener('mouseenter', hinter);
            $('.volume-slider', element).addEventListener('mouseleave', hinter);
            $('.volume-slider', element).addEventListener('mousemove', checker_np((ev) => {
                if (ev.buttons & 1) AudioFixer.volume_set(ev);
                AudioFixer.volume_hint(ev);
            }));
            $('.volume-slider', element).addEventListener('mouseup', checker_np((ev) => {
                AudioFixer.volume_set(ev);
            }));
            $('.volume-slider', element).addEventListener('click', checker((ev) => {
                AudioFixer.volume_set(ev);
            }));
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
        $('.clx-amsg-buttons .speed', AudioFixer.element).innerText = audio_el.playbackRate;
    };
    AudioFixer.hint = function (ev) {
        let rect = $('.audio-msg-track--wave', this.element).getBoundingClientRect();
        let x = Math.max(0, ev.clientX - rect.left);
        let time = audio_el.duration * (x / rect.width);
        let el = $('.slider_hint', this.element);
        let wrect = this.element.getBoundingClientRect();
        el.innerText = minSec(time);
        el.style.top = rect.top - wrect.top - el.offsetHeight - 8 + 'px';
        el.style.left = rect.left - wrect.left - (el.offsetWidth / 2) + x + 'px';
    };
    AudioFixer.seek = function (ev) {
        let rect = $('.audio-msg-track--wave', this.element).getBoundingClientRect();
        let x = Math.max(0, ev.clientX - rect.left);
        audio_el.currentTime = audio_el.duration * (x / rect.width);
    };
    AudioFixer.volume_hint = function (ev) {
        let rect = $('.volume-slider .range', this.element).getBoundingClientRect();
        let vol = Math.min(Math.max(0, ev.clientX - rect.left) / rect.width, 1);
        let el = $('.slider_hint', this.element);
        let wrect = this.element.getBoundingClientRect();
        el.innerText = Math.round(vol*100) + "%";
        el.style.top = rect.top - wrect.top - el.offsetHeight - 8 + 'px';
        el.style.left = rect.left - wrect.left - (el.offsetWidth / 2) + (vol * rect.width) + 'px';
    };
    AudioFixer.volume_set = function (ev) {
        let rect = $('.volume-slider .range', this.element).getBoundingClientRect();
        audio_el.volume = Math.min(Math.max(0, ev.clientX - rect.left) / rect.width, 1);
        let wrect = $('.volume-slider', this.element).getBoundingClientRect();
        $('.volume-slider .thumb', this.element).style.left = (audio_el.volume * rect.width) + rect.left - wrect.left + 'px';
    };
    AudioFixer.timeUpdateListener = function () {
        let progress = audio_el.duration > 0 ? audio_el.currentTime / audio_el.duration : 1;
        let el = $('.clx-amsg-progress', this.element);
        let w = parseInt(getComputedStyle($('.audio-msg-track--wave', this.element)).getPropertyValue('width'));
        el.style.left = (progress * w + 8) + "px";
        $('.audio-msg-track--duration', this.element).innerText = reverseTime ?
            '-' + minSec(audio_el.duration - audio_el.currentTime) :
            minSec(audio_el.currentTime);
    };
    AudioFixer.endedListener = function () {
        let el = this.element;
        el.classList.remove('audio-msg-track_playing');
        $('.clx-amsg-progress', this.element).style.left = "100%";
        $('.audio-msg-track--duration', this.element).innerText = minSec(audio_el.duration);
        AudioFixer.checkNext();
    };
    AudioFixer.checkNext = function () {
        let chat = this.element.closest('.im-page-chat-contain');
        let peer = this.element.closest('[data-peer]');
        let peer_voice_messages = $A('[data-peer="' + peer.dataset.peer + '"] .audio-msg-track', chat);
        for (let i = 0; i < peer_voice_messages.length - 1; ++i)
            if (peer_voice_messages[i] === this.element) {
                this.togglePlay(peer_voice_messages[i + 1]);
                break;
            }
    };
    let ctx = null;
    Object.defineProperty(AudioFixer, "context", {
        configurable:true, enumerable:true,
        get: function () {
            if(!ctx){
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
                AudioFixer.volume.gain.value = 1;
                AudioFixer.compressor.connect(AudioFixer.volume);

                // Output
                AudioFixer.volume.connect(ctx.destination);
            }
            return ctx;
        }
    });
    AudioFixer.pause = function () {
        let el = this.element;
        el.classList.remove('audio-msg-track_playing');
        audio_el.pause();
    };
    AudioFixer.play = function () {
        let el = this.element;
        let ctx = skipProcessing || AudioFixer.context;
        el.classList.add('audio-msg-track_playing');
        audio_el.play();
    };
    AudioFixer.togglePlay = function (element, event) {
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
        } else {
            this.play();
        }
    };
    AudioFixer.attachPlayer = function (element) {
        this.element = element;
        audio_el.src = element.dataset.ogg;
        audio_el.playbackRate = this.playbackRate;
        $('.clx-amsg-buttons .speed', this.element).innerText = audio_el.playbackRate;
        this.element.classList.add("clx-player-attached");
        let rect = $('.volume-slider .range', this.element).getBoundingClientRect();
        let wrect = $('.volume-slider', this.element).getBoundingClientRect();
        $('.volume-slider .thumb', this.element).style.left = (audio_el.volume * rect.width) + rect.left - wrect.left + 'px';
    };
    AudioFixer.detachPlayer = function (element) {
        if (!element) return;
        element = element.closest('.audio-msg-track');
        this.pause();
        this.element.classList.remove("clx-player-attached");
        $('.clx-amsg-progress', this.element).style.left = "100%";
        $('.audio-msg-track--duration', this.element).innerText = minSec(audio_el.duration);
        $('.slider_hint', this.element).classList.remove("visible");
    };
    AudioFixer.pauseGlobalMedia = function () {
        console.log("pauseGlobalMedia", arguments);
    };
    AudioFixer.resumeGlobalMedia = function () {
        console.log("resumeGlobalMedia", arguments);
    };

    Object.defineProperty(AudioFixer, "reverseTime", {
        enumerable: true,
        configurable: true,
        get: () => reverseTime,
        set: (p) => {
            reverseTime = localStorage.AudioMessagePlayerFixReverseTime = !!p
        }
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

    Object.defineProperty(AudioFixer, "playbackRate", {
        enumerable: true,
        configurable: true,
        get: () => playbackRate,
        set: (p) => {
            playbackRate = localStorage.AudioMessagePlayerFixPlaybackRate = p
        }
    });

    audio_el.addEventListener('timeupdate', AudioFixer.timeUpdateListener.bind(AudioFixer), {passive: true});
    audio_el.addEventListener('ended', AudioFixer.endedListener.bind(AudioFixer), {passive: true});

    function isLoaded() {
        if (old && old.loaded) {
            AudioFixer.loaded = true;
        } else if (window.stManager) {
            stManager.add('voice_message_player.js', () => {});
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
