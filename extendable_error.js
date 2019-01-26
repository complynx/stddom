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
