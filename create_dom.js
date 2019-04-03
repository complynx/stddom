/**
 Created by Complynx on 22.03.2019,
 http://complynx.net
 <complynx@yandex.ru> Daniel Drizhuk
 */
/**
 * Reworked jQuery `$` function, that returns DocumentChunk instead of their special object.
 */

let xhtmlTagCloser = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
    tagName = /<([\w:\-]+)/,
    tagNameSpace = /([\w\-]+):/;

let wrapMap = {
    option: {
        level:1,
        prefix:"<select multiple='multiple'>",
        postfix:"</select>"
    },

    tbody: {
        level:1,
        prefix:"<table>",
        postfix:"</table>"
    },
    col: {
        level:2,
        prefix:"<table><colgroup>",
        postfix:"</colgroup></table>"
    },
    tr: {
        level:1,
        prefix:"<tbody>",
        postfix:"</tbody>",
        base:"tbody"
    },
    td: {
        level:1,
        prefix:"<tr>",
        postfix:"</tr>",
        base:"tr"
    },

    _default:{
        level:0,
        prefix:"",
        postfix:""
    }
};

wrapMap.optgroup = wrapMap.option;

wrapMap.thead = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.tbody;
wrapMap.th = wrapMap.td;

/**
 * Creates HTML chunk from string.
 * @return  {DocumentFragment}
 * @param   {*}                     html        html chunk to parse and create
 * @param   {Document=document}     doc         relative document
 * @param   {Object=}               iWrapMap    wrapMap to use in element creation
 */
export function createFromString(html,doc,iWrapMap){
    iWrapMap = iWrapMap || wrapMap;
    doc = doc || window.document;
    if(typeof(html) !== "string") html = ""+html;
    let frag = doc.createDocumentFragment();
    let tmp = frag.appendChild(doc.createElement("div")),
        tag,wrap,nodes,base,prefix="",postfix="",level=0;

    // Deserialize a standard representation
    tag = ( tagName.exec( html ) || [ "", "" ] )[ 1 ].toLowerCase();

    let NS=(tagNameSpace.exec(tag)||["",""])[1],NSWrap=iWrapMap[ NS +":"];
    wrap = iWrapMap[ tag ];

    if(NSWrap && NSWrap.remove) html = html.replace(new RegExp((NS+":").escapeRegExp(),"gi"),"");
    if(NSWrap && NSWrap.wrapMap) return createFromString(html,doc,NSWrap.wrapMap);

    if(wrap){
        base = wrap;
        prefix = wrap.prefix;
        postfix = wrap.postfix;
        level = wrap.level;
        while(base.base && (base = iWrapMap[base.base])){
            prefix = base.prefix + prefix;
            postfix = postfix + base.postfix;
            level += base.level;
        }
    }

    prefix = iWrapMap._default.prefix + prefix;
    postfix = postfix + iWrapMap._default.postfix;
    level += iWrapMap._default.level;
    tmp.innerHTML = prefix + html.replace( xhtmlTagCloser, "<$1></$2>" ) + postfix;

    // Descend through wrappers to the right content
    let j = level;
    while ( j-- ) {
        tmp = tmp.lastChild;
    }
    nodes = Array.prototype.slice.call(tmp.childNodes);

    frag.textContent="";
    for(let j = 0; j < nodes.length; ++j) frag.appendChild(nodes[j]);

    return frag;
}

export {wrapMap, xhtmlTagCloser};

/**
 * Renders chunk of HTML and wraps it into DocumentFragment to be inserted wherever we want.
 * @return  {DocumentFragment}
 * @param   {*}                     html        html chunk to parse and create
 * @param   {Document=document}     doc         relative document
 * @param   {Number=3}              depth       recursion depth
 * @param   {Object=}               iWrapMap    wrapMap to use in element creation
 */
export function createFragment(html,doc,depth,iWrapMap){
    if(depth === undefined) depth = 3;
    doc = doc || window.document;
    let ret = doc.createDocumentFragment();

    if(html instanceof DocumentFragment){
        return html;
    }else if(html instanceof Node){
        ret.appendChild(html);
    }else if(depth>0 && (html instanceof NodeList
        || html instanceof Array)){
        for(let i=0;i<html.length;++i){
            ret.appendChild(createFragment(html[i],doc,depth-1));
        }
    }else{
        ret.appendChild(createFromString(html,doc,iWrapMap));
    }

    if(ret.hasChildNodes())
        return ret;

    return null;
}
