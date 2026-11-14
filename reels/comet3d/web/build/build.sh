#!/usr/bin/env bash
# Builds the one-file web page (engine + three.js + sound inlined) into web/build/comet-reel.html
# needs: npm i esbuild@0.24.0 mp4-muxer@5.1.3 in $TOOLS, and audio/mix.m4a
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; TOOLS="${TOOLS:-/tmp/claude-0/webbuild}"
NODE_PATH="$TOOLS/node_modules" "$TOOLS/node_modules/.bin/esbuild" "$HERE/../app.js" --bundle --format=esm --minify --target=es2020 --alias:three/addons=three/examples/jsm --outfile="$HERE/app.min.js" --log-level=warning
python3 - "$HERE" <<'PY'
import base64, sys
d = sys.argv[1] + '/'
t = open(d + 'page.tpl.html').read()
mix = base64.b64encode(open(d + '../../audio/mix.m4a', 'rb').read()).decode()
app = open(d + 'app.min.js').read().replace('</script', '<\\/script')
open(d + 'comet-reel.html', 'w').write(t.replace('__MIX__', mix).replace('__APP__', app))
PY
