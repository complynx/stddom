/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import {Group} from "./tester.js";

import * as format from './format.js'
import * as tc from './type_checks.js'

let all = new Group(()=>{
    for(let i of [format, tc]){
        for(let t in i){
            let _test = i[t];
            if(typeof _test === 'function'){
                _test();
            }else if(_test instanceof Group){
                _test.start();
                if(!_test.ended) _test.end();
            }else{
                this.fail(`Unprocessable test case ${t}`, _test);
            }
        }
    }
}, 'All tests');

export function run() {
    all.start();
}
