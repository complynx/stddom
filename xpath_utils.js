/**
 Created by Complynx on 09.03.2022,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */

export function queryXPath(xpath, context, Document = document) {
    return Document.evaluate(xpath, context ?? Document,
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

export function queryXPathAll(xpath, context, Document = document) {
    return xPathToArray(Document.evaluate(xpath, context ?? Document,
        null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null));
}

