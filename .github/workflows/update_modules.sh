#!/usr/bin/env bash
##
# Created by Complynx on 22.03.2019,
# http://complynx.net
# <complynx@yandex.ru> Daniel Drizhuk


cd "$SERVER_CONFIGS_PATH"/data/stddom

echo Updating outsource modules...


function update_0 () {
    file="$1"".js"
    echo "Updating $1 from $2"
    curl -s "$2" > "$file"
}


update_0 luxon https://moment.github.io/luxon/es6/luxon.js

init_exports="let exports={},module={exports:{}};"
def_export=$'\nlet def_export=module.exports; export default def_export;'

function update () {
    file="$1"".js"
    echo "Updating $1 from $2"
    echo "$init_exports" > "$file"
    curl -s "$2" >> "$file"
    echo "$def_export" >> "$file"
}
function update_c () {
    file="$1"".js"
    echo "Updating $1 from $2"
    echo "import {XConsole} from \"./console_enhancer.js\";let console=new XConsole(\""$1"\");" > "$file"
    echo "$init_exports" >> "$file"
    curl -s $2 >> "$file"
    echo "$def_export" >> "$file"
}

update spark-md5 https://raw.githubusercontent.com/satazor/js-spark-md5/master/spark-md5.min.js
update showdown https://raw.githubusercontent.com/showdownjs/showdown/master/dist/showdown.min.js
update hls https://cdn.jsdelivr.net/npm/hls.js@latest
sed -i 's/this.document/window.document/g' showdown.js
sed -i 's/this.window/window/g' showdown.js
update_c medium-editor https://raw.githubusercontent.com/yabwe/medium-editor/master/dist/js/medium-editor.min.js
update_c moment https://momentjs.com/downloads/moment.min.js

mkdir -p moment
upd="moment/moment-with-locales.js"
echo Updating "$upd"
echo "import {XConsole} from \"../console_enhancer.js\";let console=new XConsole(\"moment-loc\");" > "$upd"
echo "$init_exports" >> "$upd"
curl -s https://momentjs.com/downloads/moment-with-locales.min.js >> "$upd"
echo "$def_export" >> "$upd"

upd="moment/ru.js"
echo Updating moment ru locale
echo "import {XConsole} from \"../console_enhancer.js\";let console=new XConsole(\"moment-ru\");" > "$upd"
echo "import moment from \"../moment.js\";let require=()=>moment;" >> "$upd"
echo "$init_exports" >> "$upd"
curl -s https://raw.githubusercontent.com/moment/moment/develop/locale/ru.js >> "$upd"
echo "export default moment;moment.locale('ru');" >> "$upd"
