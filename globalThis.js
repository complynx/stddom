/**
 Created by Complynx on 12.10.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk

 based on https://mathiasbynens.be/notes/globalthis
 */

(function() {
    // if it's set, great
    if (typeof globalThis === 'object') return;

    // else, let's use some magic
    Object.defineProperty(Object.prototype, '__magic__', {
        get: function() {
            return this;
        },
        configurable: true // This makes it possible to `delete` the getter later.
    });
    __magic__.globalThis = __magic__; // lolwat
    delete Object.prototype.__magic__;
}());
