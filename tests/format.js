/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
import {vformat, format_value} from "../format.js";
import {Group} from "./tester.js";

let group;

function test_vformat_v(fmt, args, result, exception) {
    let str = `Testing vformat: "${fmt}" < ${JSON.stringify(args)}`;
    if(result) {
        str += ` ?= ${result}`;
    }else if(exception) str += `, should fail...`;
    else str += `, is working?`;
    try{
        args.unshift(fmt);
        let res = vformat.apply(undefined, args);
        if(exception){
            group.fail(str, `returned: ${res} without failing`);
        }else if(result){
            if(result === res) group.ok(str);
            else group.fail(str, `returned: ${res}`);
        }
    }catch (e){
        if(exception) group.ok(str + ` failed with ${e}`);
        else group.fail(str, e);
    }
}

function test_vformat() {
    let args = Array.from(arguments);
    let res = args.pop();
    test_vformat_v(args.shift(), args, res);
}
function test_vformat_fail() {
    let args = Array.from(arguments);
    test_vformat_v(args.shift(), args, false, true);
}

function test_format_value(fmt, val, result, exception, limit) {
    let str = `Testing format_value: "${fmt}" < ${val}`;
    if(result){
        str += ` ?= ${result}`;
        if(limit) str += ` matching at least ${limit} chars`;
    }else if(exception) str += `, should fail...`;
    else str += `, is working?`;
    try{
        let res = format_value(val, fmt);
        if(result){
            if(limit && result.slice(0,limit) === res.slice(0,limit) && result.length === res.length)
                group.ok(str);
            else if(result === res) group.ok(str);
            else group.fail(str, `returned: ${res}`);
        }
    }catch (e){
        if(exception) group.ok(str + ` failed with ${e}`);
        else group.fail(str, e);
    }
}

function test_basic_substitutions(t) {
    group = t;
    let text = 'abcde';

    test_vformat("foo", "foo");
    test_vformat("foo{0}", ["bar"], "foobar");
    test_vformat("foo{1}{0}-{1}", ["bar", 6], "foo6bar-6");
    test_vformat_fail(undefined, []);

    test_vformat("-{arg}-", {arg:'test'}, '-test-');
    test_vformat("-{this}-", {'this':'test'}, '-test-');
    test_vformat("-{format_string}-", {format_string:'test'}, '-test-');

    // while Python fails in these JS is intentionally different in accessing variables, thus -undefined-
    test_vformat("-{arg}-", '-undefined-');
    test_vformat("-{this}-", '-undefined-');
    test_vformat("-{format_string}-", '-undefined-');

    test_vformat('foo{}{}', ['bar', 6], 'foobar6');
    test_vformat('foo{1}{num}{1}', [null, 'bar'], {num:6}, 'foobar6bar');
    test_vformat('{:^{}}', ['bar', 7], '  bar  ');
    test_vformat('{:^{}} {}', ['bar', 7, 'X'], '  bar   X');
    test_vformat('{:^{pad}}{}', ['foo', 'bar'], {pad:7}, '  foo  bar');


    test_vformat('foo{1}{}', ['bar', 6], 'foo6bar');
    test_vformat('foo{}{1}', ['bar', 6], 'foobar6');

    test_vformat('{0.foo}{0.bar}', [{foo:'bar',bar:'buz'}], 'barbuz');
    // again, unlike Python, here we can access to 'undefined'
    test_vformat('{0.foo}{0.bar}', [''], 'undefinedundefined');
    // but this one should fail
    test_vformat_fail('{0.foo}{0.bar}', []);

    test_vformat('{0.2}{0.0}', [["eggs", "and", "spam"]], 'spameggs');
    // not like Python...
    test_vformat('{0.2}{0.0}', [[]], 'undefinedundefined');
    test_vformat('{0.2}{0.0}', [{}], 'undefinedundefined');
    // but this's true
    test_vformat_fail('{0.2}{0.0}', []);

    test_vformat("{0}", [text], text);
    test_vformat("{0:s}", [text], text);
    test_vformat("{0:.5s}", [text], text);
    test_vformat("{0:.10s}", [text], text);
    test_vformat("{0:1s}", [text], text);
    test_vformat("{0:5s}", [text], text);

    test_vformat("{}", [text], text);

    test_vformat("{text}", {text:text}, text);
    test_vformat("{text:s}", {text:text}, text);
}

function test_formatters_basic(t) {
    group = t;
    test_format_value('b', 0b1010111000, '1010111000');
    test_format_value('#b', 0b1010111000, '0b1010111000');

    test_format_value('c', 0x49, '\x49');
    test_format_value('c', 0x2007, '\u2007');

    test_format_value('d', 123, '123');
    test_format_value('d', -123, '-123');

    test_format_value('e', 123.456, '1.234560e+2');
    test_format_value('E', 123.456, '1.234560E+2');

    test_format_value('f', 123.456, '123.456000');

    test_format_value('g', 123.456, '123.456');

    test_format_value('n', 1234567890, '1234567890');
    test_format_value('n', 1.23e+45, '1.23e+45');

    test_format_value('o', 0o1234567, '1234567');
    test_format_value('#o', 0o1234567, '0o1234567');

    test_format_value('#x', 0xdeadface, '0xdeadface');
    test_format_value('X', 0xdeadface, 'DEADFACE');

    test_format_value('%', 123.456, '12345.600000%');
}

function test_formatters_string(t) {
    group = t;
    test_format_value('s', "it iS a Little TEST", "it iS a Little TEST");
    test_format_value('s', false, ''+false);
    test_format_value('s', 123, false, true);

    test_format_value('l', "it iS a Little TEST", "it is a little test");
    test_format_value('u', "it iS a Little TEST", "IT IS A LITTLE TEST");
    test_format_value('t', "it iS a Little TEST", "It Is A Little Test");
    test_format_value('S', "it iS a Little TEST", "It is a little test");
}

function test_formatters_extensive(t) {
    group = t;
    test_format_value("1d", 1, "1");
    test_format_value(`${Number.MAX_SAFE_INTEGER}d`, 1, false, true); //  # expect overflow
    test_format_value("0100d", 1, '00000000000000000000000000000000000000'+
             '000000000000000000000000000000000000000000000000000000'+
             '00000001');
    test_format_value("100d", 1, '                                      '+
             '                                                      '+
             '       1');
    test_format_value("#0117x", 1, '0x00000000000000000000000000000000000' +
        '0000000000000000000000000000000000000000000000000000000000000000' +
        '0000000000000001');
    test_format_value("#0118x", 1, '0x00000000000000000000000000000000000' +
        '0000000000000000000000000000000000000000000000000000000000000000' +
        '00000000000000001');

    test_format_value("f", 1.0, "1.000000");
    // # test some ridiculously large precision, expect overflow
    test_format_value('12.123456f', 1.0, false, true);

    test_format_value(".0f", 1.2, "1");
    test_format_value(".3f", 1.2, "1.200");

    test_format_value(".100g", -1.e+100/3.);
    test_format_value(".100G", -1.e+100/3.);
    test_format_value(".100f", -1.e+100/3.);
    test_format_value(".100F", -1.e+100/3.);
    test_format_value(".102g", -1.e+100/3., false, true);
    test_format_value(".102G", -1.e+100/3., false, true);
    test_format_value(".102f", -1.e+100/3., false, true);
    test_format_value(".102F", -1.e+100/3., false, true);
    // # Formatting of integers. Overflow is not ok
    test_format_value("x", 10, "a");
    test_format_value("x", 100000000000, "174876e800");
    test_format_value("o", 10, "12");
    test_format_value("o", 100000000000, "1351035564000");
    test_format_value("d", 10, "10");
    test_format_value("d", 100000000000, "100000000000");

    let big = 12345345350000000000000000000000000000000000;
    test_format_value(',.0f', big,     '12,345,345,3----------------------------------------------', false, 12);
    test_format_value(',.0f', big*10, '123,453,453,-----------------------------------------------', false, 12);
    test_format_value(',.0f', big/10,   '1,234,534,53---------------------------------------------', false, 12);
    test_format_value(',.10f', big,    '12,345,345,3----------------------------------------------.----------',
        false, 12);
    test_format_value(',.9f', big,     '12,345,345,3----------------------------------------------.---------',
        false, 12);
    test_format_value(',.11f', big,    '12,345,345,3----------------------------------------------.-----------',
        false, 12);

    big =                                      1234567890123456;
    test_format_value("d", big,               "1234567890123456");
    test_format_value("d", -big,             "-1234567890123456");
    test_format_value("5d", -big,            "-1234567890123456");
    test_format_value("17d", -big,           "-1234567890123456");
    test_format_value("18d", -big,          " -1234567890123456");
    test_format_value("<18d", -big,          "-1234567890123456 ");
    test_format_value("018d", -big,         "-01234567890123456");
    test_format_value("<018d", -big,         "-12345678901234560");
    test_format_value("020d", -big,       "-0001234567890123456");
    test_format_value("020d", big,        "00001234567890123456");
    test_format_value("+020d", big,       "+0001234567890123456");
    test_format_value("+20d", big,        "   +1234567890123456");
    test_format_value("20d", big,         "    1234567890123456");
    test_format_value("2d", big,              "1234567890123456");
    test_format_value("16d", big,             "1234567890123456");
    test_format_value("017d", big,           "01234567890123456");

    test_format_value("d", 12345678901234567890, "1234567890123456____", false, 16);

    big =                                    0x1234567890abcd;//  # 14 hex digits
    test_format_value("x", big,               "1234567890abcd");
    test_format_value("x", -big,             "-1234567890abcd");
    test_format_value("5x", -big,            "-1234567890abcd");
    test_format_value("15x", -big,           "-1234567890abcd");
    test_format_value("16x", -big,          " -1234567890abcd");
    test_format_value("<16x", -big,          "-1234567890abcd ");
    test_format_value("016x", -big,         "-01234567890abcd");
    test_format_value("<016x", -big,         "-1234567890abcd0");
    test_format_value("018x", -big,       "-0001234567890abcd");
    test_format_value("018x", big,        "00001234567890abcd");
    test_format_value("+018x", big,       "+0001234567890abcd");
    test_format_value("+18x", big,        "   +1234567890abcd");
    test_format_value("18x", big,         "    1234567890abcd");
    test_format_value("X", big,               "1234567890ABCD");
    test_format_value("#X", big,            "0X1234567890ABCD");
    test_format_value("#x", big,            "0x1234567890abcd");
    test_format_value("#x", -big,          "-0x1234567890abcd");
    test_format_value("#20x", big,      "    0x1234567890abcd");
    test_format_value("<#20x", big,         "0x1234567890abcd    ");
    test_format_value("#020x", big,     "0x00001234567890abcd");
    test_format_value("+#019x", big,     "+0x001234567890abcd");
    test_format_value(" #019x", big,     " 0x001234567890abcd");
    test_format_value("+#019X", big,     "+0X001234567890ABCD");

    big =                                    0o123456701234567012; //  # 18 octal digits
    test_format_value("o", big,               "123456701234567012");
    test_format_value("o", -big,             "-123456701234567012");
    test_format_value("5o", -big,            "-123456701234567012");
    test_format_value("19o", -big,           "-123456701234567012");
    test_format_value("20o", -big,          " -123456701234567012");
    test_format_value("<20o", -big,          "-123456701234567012 ");
    test_format_value("020o", -big,         "-0123456701234567012");
    test_format_value("<020o", -big,         "-1234567012345670120");
    test_format_value("022o", -big,       "-000123456701234567012");
    test_format_value("022o", big,        "0000123456701234567012");
    test_format_value("+022o", big,       "+000123456701234567012");
    test_format_value("+22o", big,        "   +123456701234567012");
    test_format_value("22o", big,         "    123456701234567012");
    test_format_value("o", big,               "123456701234567012");
    test_format_value("#o", big,            "0o123456701234567012");
    test_format_value("#o", -big,          "-0o123456701234567012");
    test_format_value("#24o", big,      "    0o123456701234567012");
    test_format_value("<#24o", big,         "0o123456701234567012    ");
    test_format_value("#024o", big,     "0o0000123456701234567012");
    test_format_value("+#024o", big,   "+0o000123456701234567012");

    // # Some small ints, in both Python int and flavors).
    test_format_value("d", 42, "42");
    test_format_value("d", -42, "-42");
    test_format_value("d", 42.0, "42");
    test_format_value("#x", 1, "0x1");
    test_format_value("#X", 1, "0X1");
    test_format_value("#o", 1, "0o1");
    test_format_value("#o", 0, "0o0");
    test_format_value("o", 0, "0");
    test_format_value("d", 0, "0");
    test_format_value("#x", 0, "0x0");
    test_format_value("#X", 0, "0X0");
    test_format_value("x", 0x42, "42");
    test_format_value("x", -0x42, "-42");
    test_format_value("o", 0o42, "42");
    test_format_value("o", -0o42, "-42");

    //let format_re = /^((.)?([><=^]))?([-+\s])?(#)?(0)?([1-9][0-9]*)?(\.([0-9]*))?(.)?$/;
    test_format_value('_>', 'abc', 'abc');
    test_format_value('7', 'abc',   'abc    ');
    test_format_value('_>7', 'abc', '____abc');
    test_format_value('_^7', 'abc', '__abc__');
    test_format_value('_<7', 'abc', 'abc____');

    test_format_value('=7d', -123,  '-   123');
    test_format_value('_=7d', -123, '-___123');
    test_format_value('7d', -123,   '   -123');

    test_format_value(' d', 123,   ' 123');
    test_format_value('+d', 123,   '+123');

    test_format_value('=+7d', 123,  '+   123');
    test_format_value(' d', -123,   '-123');
    test_format_value('+d', -123,   '-123');
    test_format_value('=+7d', -123, '-   123');

    test_format_value('g', 0.0000123, '1.23e-5');

    test_format_value('g', 0.0000123123123, '1.23123e-5');
    test_format_value('g', 0.000123123123, '0.000123123');

    test_format_value('g', 123123, '123123');
    test_format_value('g', 1231231, '1.23123e+6');

    test_format_value('.2g', 10, '10');
    test_format_value('.2g', 100, '1e+2');
    test_format_value('.2g', 0.012345, '0.012');
    test_format_value('.2g', 0.00012345, '0.00012');
    test_format_value('.2g', 0.000012345, '1.2e-5');
    test_format_value('.0g', 0.000012345, '1e-5');
    test_format_value('.0g', 0.00012345, '0.0001');
    test_format_value('.0g', 5, '5');
    test_format_value('.0g', 123, '1e+2');

    test_format_value('g', 1e+23124, 'inf');
    test_format_value('g', -1e+23124, '-inf');
    test_format_value('g', parseInt('NaN'), 'nan');

    test_format_value('.0G', 123, '1E+2');
    test_format_value('G', 1e+23124, 'INF');
    test_format_value('G', -1e+23124, '-INF');
    test_format_value('G', parseInt('NaN'), 'NAN');
}

function test_if(t) {
    group = t;
    test_vformat('{!if}foo{=else}bar{==}', [true], 'foo');
    test_vformat('{!if}foo{=else}bar{==}', [false], 'bar');

    test_vformat('{!if}foo{==}noelse', [true], 'foonoelse');
    test_vformat('{!if}foo{==}noelse', [false], 'noelse');

    test_vformat('{!if}-{~}-{==}', [true], '-true-');
    test_vformat('{!if}-{~}-{==}', [5], '-5-');
    test_vformat('{!if}-{~}-{==}', ['foo'], '-foo-');

    test_vformat('{!ifeq(foo)}bar{=else}spam{==}', ['foo'], 'bar');
    test_vformat('{!ifeq("foo")}bar{=else}spam{==}', ['foo'], 'bar');
    test_vformat('{!ifeq(1)}bar{=else}spam{==}', [1], 'bar');
    test_vformat('{!ifeq(1)}bar{=else}spam{==}', ['1'], 'bar');
    test_vformat('{!ifeq(=1)}bar{=else}spam{==}', ['foo', 'foo'], 'bar');

    test_vformat('{!ifeq(bar)}bar{=else}spam{==}', ['foo'], 'spam');
    test_vformat('{!ifeq("bar")}bar{=else}spam{==}', ['foo'], 'spam');
    test_vformat('{!ifeq(5)}bar{=else}spam{==}', [1], 'spam');
    test_vformat('{!ifeq(5)}bar{=else}spam{==}', ['1'], 'spam');
    test_vformat('{!ifeq(=1)}bar{=else}spam{==}', [1, 'foo'], 'spam');

    test_vformat('{!typeof("string")}bar{=else}spam{==}', ['foo'], 'bar');
    test_vformat('{!typeof(string)}bar{=else}spam{==}', ['foo'], 'bar');
    test_vformat('{!typeof(=1)}bar{=else}spam{==}', [1, 'number'], 'bar');
    test_vformat('{!typeof(number)}bar{=else}spam{==}', ['foo'], 'spam');
    test_vformat('{!typeof(1)}bar{=else}spam{==}', ['1'], 'spam');

    test_vformat('{!ifseq(=1)}bar{=else}spam{==}', [1, 1], 'bar');
    test_vformat('{!ifseq(=1)}bar{=else}spam{==}', ['foo', 'foo'], 'bar');
    test_vformat('{!ifseq(=1)}bar{=else}spam{==}', ['1', 1], 'spam');
}

function test_closure(t) {
    group = t;
    let a = ['ham', 'eggs'];
    let o = {
        a:{
            b:{
                c:{
                    d:'foo'},
                d:'bar'},
            d:'baz'},
        d:'spam'
    };

    test_vformat('{a!>}{~d}{==}', o, 'baz');
    test_vformat('{a.b!>}{~d}{==}', o, 'bar');
    test_vformat('{a.b.c!>}{~d}{==}', o, 'foo');
    test_vformat('{a.b.c!>}{d}{==}', o, 'spam');

    test_vformat('{a!>}{~d}{~b!>}{~d}{==}{==}', o, 'bazbar');
    test_vformat('{a!>}{~d}{~b!>}{~<.d}{==}{==}', o, 'bazbaz');
    test_vformat('{a!>}{~d}{0!>}{~}{==}{==}', a, o, 'bazham');

    test_vformat('{~}', 'undefined');
    test_vformat_fail('{a!>}{~.<}{==}', o);
}

function test_loops(t) {
    group = t;
    let parent = {
        me_too: 'please',
        hasOwnProperty: ()=>false
    };
    let fake_arr = Object.create(parent);
    Object.assign(fake_arr, {
        1: 'ham',
        2: 'spam',
        3: 'eggs',
        length: 4,
        foo: 'bar'
    });
    let arr = ['ham', 'spam', 'eggs'];
    let generator = function* () {
        let c = 100;
        while(--c > 1)
            yield `${c} bottles of beer`;

        yield `1 bottle of beer`;
        yield `no more bottles of beer`;
    };
    let test_bottles = '';
    let test_bottles_keys = '';
    let counter = 0;
    for(let i of generator()){
        test_bottles += (test_bottles.length ? i + ' on the wall.\n\n' : '')
            + i[0].toUpperCase() + i.slice(1) + ' on the wall, ' + i + '.\n' +
            ((i[0] !== 'n') ? 'Take one down and pass it around, ' :
                'Go to the store and buy some more, 99 bottles of beer on the wall.');
        test_bottles_keys += (counter++) + ' ';
    }

    test_vformat('{!for}{~} {==}in a bag', [arr], 'ham spam eggs in a bag');
    test_vformat('{!for}{=key} {==}in a bag', [arr], '0 1 2 in a bag');
    test_vformat('{!for}{~} {==}in a bag', [fake_arr], 'undefined ham spam eggs in a bag');
    test_vformat('{!for}{=key} {==}in a bag', [fake_arr], '0 1 2 3 in a bag');
    test_vformat_fail('{!for}{~} {==}in a bag', [generator()]);

    test_vformat('{!in}{~} {==}in a bag', [arr], 'ham spam eggs in a bag');
    test_vformat('{!in}{=key} {==}in a bag', [arr], '0 1 2 in a bag');
    test_vformat('{!in}{~} {==}in a bag', [fake_arr], vformat('ham spam eggs 4 bar please {} in a bag',
        [fake_arr.hasOwnProperty]));
    test_vformat('{!in}{=key} {==}in a bag', [fake_arr], '1 2 3 length foo me_too hasOwnProperty in a bag');
    test_vformat('{!in}{~} {==} not iterable', [generator()], ' not iterable');

    test_vformat('{!in_own}{~} {==}in a bag', [arr], 'ham spam eggs in a bag');
    test_vformat('{!in_own}{=key} {==}in a bag', [arr], '0 1 2 in a bag');
    test_vformat('{!in_own}{~} {==}in a bag', [fake_arr], 'ham spam eggs 4 bar in a bag');
    test_vformat('{!in_own}{=key} {==}in a bag', [fake_arr], '1 2 3 length foo in a bag');

    test_vformat('{!of}{~} {==}in a bag', [arr], 'ham spam eggs in a bag');
    test_vformat('{!of}{=key} {==}in a bag', [arr], '0 1 2 in a bag');
    test_vformat_fail('{!of}{~} {==}in a bag', [fake_arr]);

    test_vformat('{!of}{~!ifeq("99 bottles of beer")}{=else}{~.<} on the wall.\n\n{==}{~:S} on the wall, {~}.\n' +
        '{~!ifeq("no more bottles of beer")}Go to the store and buy some more,' +
        '{=else}Take one down and pass it around, {==}{==} 99 bottles of beer on the wall.',
        [generator()], test_bottles);
    test_vformat('I count {!of}{=key} {==} bottles on the wall.', [generator()],
        `I count ${test_bottles_keys} bottles on the wall.`);
}

function test_functions() {
    new Group(test_if).start();
    new Group(test_closure).start();
    new Group(test_loops).start();
}

export function test() {
    new Group(()=>{
        new Group(test_formatters_basic).start();
        new Group(test_formatters_string).start();
        new Group(test_formatters_extensive).start();
        new Group(test_basic_substitutions).start();
        new Group(test_functions).start();
    },'format').start();
}
