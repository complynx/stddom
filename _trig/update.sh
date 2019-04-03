#!/usr/bin/env bash
##
# Created by Complynx on 22.03.2019,
# http://complynx.net
# <complynx@yandex.ru> Daniel Drizhuk

SOURCE="${BASH_SOURCE[0]}"
while [[ -h "$SOURCE" ]]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ "$SOURCE" != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"

cd "$DIR"/..
echo Updating repo...
git fetch --all && git reset --hard origin/master

bash "$DIR"/update_modules.sh

