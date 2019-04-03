# stddom
This is a repo for my collection of modules I use in various projects.
To use, just add:
```html
<script type="module" src="https://complynx.net/modules/[module-of-choice].js">
```
or
```js
import def_export as var1 from "https://complynx.net/modules/[module-of-choice].js";
import {other_func as var2} from "https://complynx.net/modules/[another-module].js";
```
This includes also third-party modules such as `showdown.js`, listed in `_trig/update_modules.sh`,
all the modules are ES6.

The title of the repo goes back to a library, I created a long time ago.
The most notable piece of which is `createFragment` from `create_dom.js`. It is extremely useful.

Some of the functions are documented, but most of them aren't, sorry.
