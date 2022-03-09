/**
 Created by Complynx on 09.03.2022,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import {XConsole} from "./console_enhancer.js";
import {queryXPathAll} from "./xpath_utils.js";
import {Notificator} from "./notifications.js";

let console = new XConsole("binance_p2p_helper");

export function startAutoMon(currency, threshold) {
    let notified = false;
    let interval = false;
    let notificator = new Notificator({});

    function startMon(parentToMon, query, threshold) {
        stopMon();
        interval = setInterval(() => {
            let price = parseFloat(parentToMon.querySelector(query).innerText);
            if (price <= threshold && !notified) {
                notified = true;
                notificator.notify(`New price ${price}!!!`).then(console.log).catch(console.error);
            }
        }, 1000);
    }

    function stopMon() {
        if (interval !== false) {
            clearInterval(interval);
        }
    }


    let xpath = `//button[text()='Buy ${currency}']`;
    let btns = queryXPathAll(xpath);

    let re = /[0-9]+\s+orders\s*[0-9]+(\.[0-9]+)?%\s+completion\s*[0-9]+(\.[0-9]+)?\s*[A-Z]+\s+Available/gi;

    function getNextBtn(btns, it=0){
        for(let btn of btns){
            for(let p = btn.parentElement;p && p !== document.body;p = p.parentElement) {
                if(re.test(p.innerText)) {
                    if(it-- <= 0){
                        return p;
                    }else{
                        break;
                    }
                }
            }
        }
        return null;
    }
    let row = getNextBtn(btns,0);
    let row2 = getNextBtn(btns, 1);
    let parentToMon = (()=>{
        for(let p = row, p2 = row2;p && p2; p = p.parentElement, p2=p2.parentElement) {
            if(p === p2) {
                return p;
            }
        }
        return null;
    })();

    startMon(parentToMon, ":scope > :first-child > :first-child > :nth-child(2) > :first-child > :first-child > :first-child", threshold);
}


(()=> {
    if (!window.clx) window.clx = {};
    if (clx.binance_p2p_helper) return console.warn("Already running...");

    clx.binance_p2p_helper = startAutoMon;
})();
