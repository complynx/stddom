/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import * as T from '../type_checks.js';
import {Group} from "./tester.js";

let t = new Group((t)=>{
    new Group((t)=>{
        t.returns(T.isNumber, '123', true);
        t.returns(T.isNumber, 123, true);
        t.returns(T.isNumber, 1e+124, true);
        t.returns(T.isNumber, 1e-2141414, true);//+zero
        t.returns(T.isNumber, -1e-2141414, true);//-zero
        t.returns(T.isNumber, Number.POSITIVE_INFINITY, true);// +inf
        t.returns(T.isNumber, Number.NEGATIVE_INFINITY, true);// -inf
        t.returns(T.isNumber, '2e3', true);
        t.returns(T.isNumber, '2e+3', true);
        t.returns(T.isNumber, ' 2 ', true);

        t.returns(T.isNumber, '', false);
        t.returns(T.isNumber, ' ', false);
        t.returns(T.isNumber, null, false);
        t.returns(T.isNumber, undefined, false);
        t.returns(T.isNumber, '2e', false);
        t.returns(T.isNumber, Number.NaN, false);
        t.returns(T.isNumber, parseInt('not a number'), false);
        t.returns(T.isNumber, parseFloat('not a number'), false);
        t.returns(T.isNumber, ()=>123, false);
        t.returns(T.isNumber, ()=>{}, false);
        t.returns(T.isNumber, {}, false);
        t.returns(T.isNumber, [], false);
        t.returns(T.isNumber, [1], false);
        t.returns(T.isNumber, {toString(){return'1';}}, false);
    }, 'isNumber checks').start();


    new Group('testing arrayLike',(t)=>{
        function get_arguments() {
            return arguments;
        }
        t.returns(T.arrayLike, [], true);
        t.returns(T.arrayLike, [1,2,3], true);
        t.returns(T.arrayLike, get_arguments(), true);
        t.returns(T.arrayLike, {length:1}, true);
        t.returns(T.arrayLike, {length:'123'}, true);
        t.returns(T.arrayLike, {length:0}, true);

        t.returns(T.arrayLike, '', false);
        t.returns(T.arrayLike, '123', false);
        t.returns(T.arrayLike, 'spam', false);
        t.returns(T.arrayLike, {length:''}, false);
        t.returns(T.arrayLike, {length:Number.MAX_SAFE_INTEGER+1}, false);
        t.returns(T.arrayLike, {length:null}, false);
        t.returns(T.arrayLike, {length:undefined}, false);
        t.returns(T.arrayLike, {length:Number.NaN}, false);
        t.returns(T.arrayLike, {length:-1}, false);
        t.returns(T.arrayLike, {length:Number.POSITIVE_INFINITY}, false);//+inf
        t.returns(T.arrayLike, {length:2.3}, false);
    }).start();

    new Group('testing isInteger',(t)=>{
        t.returns(T.isInteger, 1, true);
        t.returns(T.isInteger, 0, true);
        t.returns(T.isInteger, -1, true);
        t.returns(T.isInteger, Number.MAX_SAFE_INTEGER, true);
        t.returns(T.isInteger, -Number.MAX_SAFE_INTEGER, true);
        t.returns(T.isInteger, '1', true);
        t.returns(T.isInteger, '-1', true);
        t.returns(T.isInteger, 1e2, true);
        t.returns(T.isInteger, -1e2, true);
        t.returns(T.isInteger, '1e2', true);
        t.returns(T.isInteger, '-1e2', true);
        t.returns(T.isInteger, ' 1 ', true);
        t.returns("In this case, the delta can't be placed into the significand.",
            T.isInteger, 1 + Number.EPSILON/2, true);
        t.returns("Though not a number, it may be casted to integer through toString>parseFloat",
            T.isInteger, [1], true);
        t.returns("Though not a number, it may be casted to integer through toString>parseFloat",
            T.isInteger, {toString(){return'1';}}, true);

        t.returns(T.isInteger, 1.2, false);
        // next test is a bit complicated...
        t.returns(T.isInteger, 1 + Number.EPSILON, false);
        t.returns(T.isInteger, Number.MAX_SAFE_INTEGER+1, false);
        t.returns(T.isInteger, -Number.MAX_SAFE_INTEGER-1, false);
        t.returns(T.isInteger, '', false);
        t.returns(T.isInteger, ' ', false);
        t.returns(T.isInteger, '1a', false);
        t.returns(T.isInteger, '1e', false);
        t.returns(T.isInteger, '4e2a', false);
        t.returns(T.isInteger, null, false);
        t.returns(T.isInteger, undefined, false);
        t.returns(T.isInteger, Number.NaN, false);
        t.returns(T.isInteger, [], false);
        t.returns(T.isInteger, {}, false);
    }).start();
}, 'Type checks test');
export {t};
