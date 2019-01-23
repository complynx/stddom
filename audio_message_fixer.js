import {createFragment as $C} from "./create_dom.js";
let $=(s,e=document)=>e.querySelector(s);
let $A=(s,e=document)=>e.querySelectorAll(s);
import {add_css} from "./dom_utils.js";

// language=CSS
add_css(`
    .clx-amsg-progress {
        height:100%;
        width:100%;
        position:absolute;
        top:0;
        z-index:1;
        background:rgba(255,255,255,0.31);
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
    .clx-amsg-buttons .dl::before{
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
    .clx-amsg-buttons .dl{
        float: right;
        font-size: 0.6em;
        margin-right: 0.8em;
        opacity: 0.7;
        text-decoration: none;
    }
    .clx-amsg-buttons .dl:hover {
        opacity: 1;
    }
    .clx-amsg-buttons .playback-rate{
        color: #2a5885;
        cursor: pointer;
        user-select: none;
        -moz-user-select: none;
        -webkit-user-select: none;
    }
    .clx-amsg-buttons .playback-rate span{
    }
    .clx-amsg-buttons .playback-rate .slower,
    .clx-amsg-buttons .playback-rate .faster{
        width: 0.8em;
        text-align: center;
        display: inline-block;
    }
    .clx-amsg-buttons .playback-rate .speed{
        width: 2.8em;
        text-align: center;
        display: inline-block;
    }
    .clx-amsg-buttons .playback-rate .speed::after{
        content: 'x';
    }
`);

let old = window.AudioMessagePlayer;
let audio_el = document.createElement('audio');

function minSec(time){
    time = Math.floor(time);
    let s = time % 60;
    let m = (time - s) /60;
    return m + ":" + (s<10?"0":'') + s;
}

let reverseTime = localStorage.AudioMessagePlayerFixReverseTime;
let stopper = (func)=>{
    return function(ev){
        ev.stopPropagation();
        ev.preventDefault();

        return func.apply(this, arguments);
    };
};
let playbackRate = localStorage.AudioMessagePlayerFixPlaybackRate || 1;
audio_el.playbackRate = playbackRate;

let AudioMessagePlayer = {
    fixElement: function (element) {
        if(!element.classList.contains("clx-fixed")){
            element.onclick = null;
            element.classList.add("clx-fixed");

            let b = element.querySelector('.audio-msg-track--btn');
            b.addEventListener('click', function (ev) {
                AudioMessagePlayer.togglePlay(this, ev);
            });
            $('.audio-msg-track--wave-wrapper', element)
                .appendChild($C("<div class='clx-amsg-progress'>&nbsp;</div>"));

            let checker = (func, end)=>stopper(function(ev){
                let el = this.closest('.audio-msg-track');
                if (el !== AudioMessagePlayer.element || (end && audio_el.ended)) {
                    AudioMessagePlayer.togglePlay(el);
                } else {
                    return func.apply(this, arguments);
                }
            });
            let checker_np = (func)=>stopper(function(ev){
                let el = this.closest('.audio-msg-track');
                if (el === AudioMessagePlayer.element) {
                    return func.apply(this, arguments);
                }
            });
            if(element.nextSibling.classList.contains("vk_audio_msg_btns")){
                element.parentNode.removeChild(element.nextSibling);
            }

            element.appendChild($C(`
<div class='clx-amsg-buttons'>
    <span class="playback-rate"><span class='slower'>-</span><span class='speed'>${audio_el.playbackRate}</span><span class='faster'>+</span></span>
    <a class="dl" href="${element.dataset.mp3}">mp3</a>
    <a class="dl" href="${element.dataset.ogg}">ogg</a>
</div>`));

            $('.clx-amsg-buttons .slower', element).addEventListener('click', checker((ev)=>{
                AudioMessagePlayer.playbackRateChange(-1);
            }));
            $('.clx-amsg-buttons .faster', element).addEventListener('click', checker((ev)=>{
                AudioMessagePlayer.playbackRateChange(1);
            }));
            $('.clx-amsg-buttons .speed', element).addEventListener('click', checker((ev)=>{
                AudioMessagePlayer.playbackRateChange(0);
            }));
            $('.audio-msg-track--duration', element).addEventListener('click', checker((ev)=>{
                this.reverseTime = !this.reverseTime;
                AudioMessagePlayer.timeUpdateListener();
            }, true));
            element.appendChild($C(`<div class="slider_hint audio_player_hint">0:00</div>`));

            $('.audio-msg-track--wave-wrapper', element).addEventListener('mousemove', checker_np((ev)=>{
                if(ev.buttons & 1) AudioMessagePlayer.seek(ev);
                AudioMessagePlayer.hint(ev);
            }));
            $('.audio-msg-track--wave-wrapper', element).addEventListener('mouseup', checker_np((ev)=>{
                AudioMessagePlayer.seek(ev);
            }));
            $('.audio-msg-track--wave-wrapper', element).addEventListener('click', checker((ev)=>{
                AudioMessagePlayer.seek(ev);
            }));
            $('.audio-msg-track--wave-wrapper', element).addEventListener('mouseenter', function (ev) {
                let el = this.closest('.audio-msg-track');
                if(el === AudioMessagePlayer.element) {
                    $('.slider_hint', element).classList.add("visible");
                }
            });
            $('.audio-msg-track--wave-wrapper', element).addEventListener('mouseleave', function (ev) {
                let el = this.closest('.audio-msg-track');
                if(el === AudioMessagePlayer.element) {
                    $('.slider_hint', element).classList.remove("visible");
                }
            });
        }
    },
    rates:[0.25,0.5,0.75,1,1.25,1.5,2,2.5,3,4],
    playbackRateChange:(shift)=>{
        if(shift === 0) audio_el.playbackRate = 1;
        else if(shift>0){
            for(let i of AudioMessagePlayer.rates){
                if(i>audio_el.playbackRate){
                    audio_el.playbackRate = i;
                    break;
                }
            }
        }else{
            for(let i=AudioMessagePlayer.rates.length-1;--i;i>=0){
                if(AudioMessagePlayer.rates[i]<audio_el.playbackRate){
                    audio_el.playbackRate = AudioMessagePlayer.rates[i];
                    break;
                }
            }
        }
        AudioMessagePlayer.playbackRate = audio_el.playbackRate;
        $('.clx-amsg-buttons .speed', AudioMessagePlayer.element).innerText = audio_el.playbackRate;
    },
    hint:function(ev){
        let rect = $('.audio-msg-track--wave', this.element).getBoundingClientRect();
        let x = Math.max(0, ev.clientX - rect.left);
        let time = audio_el.duration * (x/rect.width);
        let el = $('.slider_hint', this.element);
        let wrect = this.element.getBoundingClientRect();
        el.innerText = minSec(time);
        el.style.top = rect.top - wrect.top - el.offsetHeight - 8 + 'px';
        el.style.left = rect.left - wrect.left - (el.offsetWidth/2) + x + 'px';
    },
    seek:function(ev){
        let rect = $('.audio-msg-track--wave', this.element).getBoundingClientRect();
        let x = Math.max(0, ev.clientX - rect.left);
        audio_el.currentTime = audio_el.duration * (x/rect.width);
    },
    timeUpdateListener: function () {
        let progress = audio_el.duration > 0 ? audio_el.currentTime / audio_el.duration : 1;
        let el = $('.clx-amsg-progress', this.element);
        let w = parseInt(getComputedStyle($('.audio-msg-track--wave', this.element)).getPropertyValue('width'));
        el.style.left = (progress * w + 8) + "px";
        $('.audio-msg-track--duration', this.element).innerText = reverseTime ?
            '-' + minSec(audio_el.duration - audio_el.currentTime) :
            minSec(audio_el.currentTime);
    },
    endedListener: function () {
        let el = this.element;
        el.classList.remove('audio-msg-track_playing');
        $('.clx-amsg-progress', this.element).style.left = "100%";
        $('.audio-msg-track--duration', this.element).innerText = minSec(audio_el.duration);
        AudioMessagePlayer.checkNext();
    },
    checkNext: function(){
        let chat = this.element.closest('.im-page-chat-contain');
        let peer = this.element.closest('[data-peer]');
        let peer_voice_messages = $A('[data-peer="' +peer.dataset.peer+ '"] .audio-msg-track', chat);
        for(let i=0; i<peer_voice_messages.length-1; ++i)
            if(peer_voice_messages[i] === this.element) {
                this.togglePlay(peer_voice_messages[i+1]);
                break;
            }
    }
    ,
    pause: function(){
        let el = this.element;
        el.classList.remove('audio-msg-track_playing');
        audio_el.pause();
    },
    play: function(){
        let el = this.element;
        el.classList.add('audio-msg-track_playing');
        audio_el.play();
    },
    togglePlay: function (element, event) {
        if(event){
            event.stopPropagation();
            event.preventDefault();
        }
        if(!element.classList.contains('audio-msg-track')) {
            element = element.closest('.audio-msg-track');
        }
        this.fixElement(element);
        if(this.element !== element) {
            this.detachPlayer(this.element);
            this.attachPlayer(element);
        }

        if(element.classList.contains('audio-msg-track_playing')){
            this.pause();
        }else{
            this.play();
        }
    },
    attachPlayer: function (element){
        this.element = element;
        audio_el.src =  element.dataset.ogg;
        audio_el.playbackRate = this.playbackRate;
        $('.clx-amsg-buttons .speed', this.element).innerText = audio_el.playbackRate;
    },
    detachPlayer: function (element) {
        if(!element) return;
        element = element.closest('.audio-msg-track');
        this.pause();
        $('.clx-amsg-progress', this.element).style.left = "100%";
        $('.audio-msg-track--duration', this.element).innerText = minSec(audio_el.duration);
        $('.slider_hint', this.element).classList.remove("visible");
    },
    pauseGlobalMedia: function () {
        console.log("pauseGlobalMedia", arguments);
    },
    resumeGlobalMedia: function () {
        console.log("resumeGlobalMedia", arguments);
    },
    redrawWaves: old.redrawWaves,
    getWave: old.getWave
};
Object.defineProperty(AudioMessagePlayer, "reverseTime", {
    enumerable: true,
    configurable: true,
    get: () => reverseTime,
    set: (p) => {reverseTime = localStorage.AudioMessagePlayerFixReverseTime = !!p}
});

Object.defineProperty(AudioMessagePlayer, "playbackRate", {
    enumerable: true,
    configurable: true,
    get: () => playbackRate,
    set: (p) => {playbackRate = localStorage.AudioMessagePlayerFixPlaybackRate = p}
});

audio_el.addEventListener('timeupdate', AudioMessagePlayer.timeUpdateListener.bind(AudioMessagePlayer), {passive: true});
audio_el.addEventListener('ended', AudioMessagePlayer.endedListener.bind(AudioMessagePlayer), {passive: true});

function isLoaded(){
    if(old.loaded){
        AudioMessagePlayer.loaded=true;
    }else if(window.stManager){
        stManager.add('voice_message_player.js', ()=>{});
    }
}

Object.defineProperty(window, "AudioMessagePlayer", {
    enumerable: true,
    configurable: true,
    get: () => AudioMessagePlayer,
    set: (p)=>{
        old = p;
        isLoaded();
    }
});
isLoaded();
