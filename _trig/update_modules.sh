#!/usr/bin/env bash
SOURCE="${BASH_SOURCE[0]}"
while [[ -h "$SOURCE" ]]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ "$SOURCE" != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"

cd "$DIR"/..

echo Updating outsource modules...

echo Updating luxon
curl -s https://moment.github.io/luxon/es6/luxon.min.js -o ./luxon.js

function update () {
    echo Updating $1 from $2
    echo "let exports={},module={exports:{}};" >> $1
    curl -s $2 >> $1
    echo "let def_export=module.exports; export default def_exports;" >> $1
}
function update_c () {
    echo Updating $1 from $2
    echo "import {XConsole} from \"./console_enhancer.js\";let console=new XConsole(\""$1"\");" > $1
    echo "let exports={},module={exports:{}};" >> $1
    curl -s $2 >> $1
    echo "let def_export=module.exports; export default def_exports;" >> $1
}

update spark-md5.js https://raw.githubusercontent.com/satazor/js-spark-md5/master/spark-md5.min.js
update showdown.js https://raw.githubusercontent.com/showdownjs/showdown/master/dist/showdown.min.js
update_c medium-editor.js https://raw.githubusercontent.com/yabwe/medium-editor/master/dist/js/medium-editor.min.js
update_c moment.js https://momentjs.com/downloads/moment.min.js

mkdir moment
upd="moment/moment-with-locales.js"
echo Updating $upd
echo "import {XConsole} from \"../console_enhancer.js\";let console=new XConsole(\"moment-loc\");" > $upd
echo "let exports={},module={exports:{}};" >> $upd
curl -s https://momentjs.com/downloads/moment-with-locales.min.js >> $upd
echo "let def_export=module.exports; export default def_exports;" >> $upd

upd="moment/ru.js"
echo Updating moment ru locale
echo "import {XConsole} from \"../console_enhancer.js\";let console=new XConsole(\"moment-ru\");" > $upd
echo "import moment from \"../moment.js\";let require=()=>moment;" >> $upd
echo "let exports={},module={exports:{}};" >> $upd
curl -s https://raw.githubusercontent.com/moment/moment/develop/locale/ru.js >> $upd
echo "export default moment;moment.locale('ru');" >> $upd