let stopper = (func) => {
    return function (ev) {
        ev.stopPropagation();
        ev.preventDefault();

        return func.apply(this, arguments);
    };
};
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
