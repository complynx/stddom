/**
 Created by Complynx on 09.03.2022,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */

export function queryXPath(xpath, context, document = document) {
    if(arguments.length < 2) {
        context = document;
    }
    return document.evaluate(xpath, context,
        null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

export function xPathToArray(iterator) {
    let ret = [];
    let node = null;
    while(node = iterator.iterateNext()) {
        ret.push(node);
    }
    return ret;
}

export function queryXPathAll(xpath, context, document = document) {
    if(arguments.length < 2) {
        context = document;
    }
    return xPathToArray(document.evaluate(xpath, context,
        null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null));
}

