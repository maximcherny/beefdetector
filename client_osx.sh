#!/bin/sh
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
killall -9 "Google Chrome" > /dev/null 2>&1
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
	--user-data-dir=$HOME/Desktop/beefometer \
	--no-first-run \
	--disable-new-tab-first-run \
	--load-extension=$DIR/src \
	http://127.0.0.1:3000/demos/basic.html
