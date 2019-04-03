/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
/**
 * Wrapper that stops the event
 * @param   {Function}          func
 * @returns {function(*): *}    wrapped func
 */
let stopper = (func) => {
    return function (ev) {
        ev.stopPropagation();
        ev.preventDefault();

        return func.apply(this, arguments);
    };
};
/**
 * Factory for mouse tracking functions where finishing events are tracked outside the element
 * @param   {Function}      func        main callback
 * @param   {Function=}     start       starter callback
 * @param   {Function=}     finish      finisher callback
 * @param   {string=}       mouseMove   trackable event name (default to mousemove)
 * @param   {string=}       mouseUp     finisher event name (dafault to mouseup)
 * @returns {function(*): *}            starter callback
 */
let mouseTracker = (func, start, finish, mouseMove="mousemove", mouseUp="mouseup")=>{
    return stopper(function (ev) {
        if(start && false === start.apply(this, arguments))
            return false;
        let mover = stopper(func);
        let finisher = function(ev){
            mover.apply(this, arguments);
            window.removeEventListener(mouseMove, mover, {capture:true});
            window.removeEventListener(mouseUp, finisher, {capture:true});
            if(finish) finish.apply(this, arguments);
        };
        window.addEventListener(mouseMove, mover, {capture:true});
        window.addEventListener(mouseUp, finisher, {capture:true});
    });
};
export {stopper, mouseTracker};
