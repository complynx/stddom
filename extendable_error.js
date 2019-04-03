/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
/**
 * Proper Error extender class
 */
class ExtendableError extends Error {
    constructor() {
        super(...arguments);
        this.name = this.constructor.name;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(...arguments)).stack;
        }
    }
}
