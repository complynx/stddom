
function storableProp(obj, name, path, def_val=undefined, storage=localStorage) {
    let current;
    let path_name = path + ":" + name;
    try{
        let item = localStorage.getItem(path_name)
        if(typeof item === "string")
            current = JSON.parse(item);
        else current = def_val;
    }catch (e) {
        current = def_val;
    }
    Object.defineProperty(obj, name, {
        get: () => current,
        set: v => {
            current = v;
            localStorage.setItem(path_name, JSON.stringify(v));
        },
        configurable:true,
        enumerable:true
    });
}

function storableObject(template, path, storage=localStorage){
    let ret = {};
    for(let el in template){
        storableProp(ret, el, path, template[el], storage);
    }
    return ret;
}
export {storableObject, storableProp};
