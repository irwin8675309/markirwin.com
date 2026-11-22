#!/usr/bin/env bash
# Grandkids' Magic TV launcher for Linux (tested design target: Fedora).
#
#   scripts/start.sh              open fullscreen (kiosk) on this computer
#   scripts/start.sh --windowed   open in a normal app window instead
#   scripts/start.sh --rebuild    rebuild the app first (after updating the code)
#
# Optional environment variables:
#   MAGICTV_PORT=5173        port for the local server
#   MAGICTV_BROWSER=cmd      browser command to use (default: auto-detect)
#   MAGICTV_AUTO_CAMERA=1    let the browser use the camera without asking
#                            (only sensible on a dedicated TV computer)
#   MAGICTV_PROFILE=dir      browser profile folder (remembers the camera choice)

set -u

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${MAGICTV_PORT:-5173}"
URL="http://127.0.0.1:${PORT}/"
PROFILE_DIR="${MAGICTV_PROFILE:-$HOME/.config/magic-tv-browser}"
KIOSK=1
REBUILD=0

for arg in "$@"; do
  case "$arg" in
    --windowed) KIOSK=0 ;;
    --rebuild) REBUILD=1 ;;
    -h | --help)
      sed -n '2,15p' "$0"
      exit 0
      ;;
  esac
done

cd "$APP_DIR" || exit 1

port_open() {
  (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null
}

# 1. Make sure the app is built (production build, not the dev server).
if [ "$REBUILD" = 1 ] || [ ! -f dist/index.html ]; then
  echo "Building Grandkids' Magic TV (this only happens once)..."
  if ! command -v npm >/dev/null 2>&1; then
    echo "Node.js and npm are needed for the first build. On Fedora: sudo dnf install nodejs" >&2
    exit 1
  fi
  if [ ! -d node_modules ]; then
    npm install || { echo "npm install failed" >&2; exit 1; }
  fi
  npm run build || { echo "Build failed" >&2; exit 1; }
fi

# 2. Serve dist/ on this computer only.
SERVER_PID=""
if port_open; then
  echo "Something is already serving on port $PORT; using it."
else
  if command -v python3 >/dev/null 2>&1; then
    python3 "$APP_DIR/scripts/serve.py" "$APP_DIR/dist" "$PORT" &
    SERVER_PID=$!
  elif command -v npx >/dev/null 2>&1; then
    npx vite preview --host 127.0.0.1 --port "$PORT" --strictPort >/dev/null 2>&1 &
    SERVER_PID=$!
  else
    echo "Need python3 (or Node.js) to serve the app." >&2
    exit 1
  fi
  for _ in $(seq 1 50); do
    port_open && break
    sleep 0.2
  done
  if ! port_open; then
    echo "The local server did not start on port $PORT." >&2
    [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null
    exit 1
  fi
fi

cleanup() {
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null
}
trap cleanup EXIT INT TERM

# 3. Find a browser.
BROWSER="${MAGICTV_BROWSER:-}"
if [ -z "$BROWSER" ]; then
  for candidate in chromium-browser chromium google-chrome-stable google-chrome microsoft-edge; do
    if command -v "$candidate" >/dev/null 2>&1; then
      BROWSER="$candidate"
      break
    fi
  done
fi

if [ -z "$BROWSER" ]; then
  if command -v firefox >/dev/null 2>&1; then
    echo "Chromium/Chrome not found; trying Firefox (hand tracking works best in Chromium)."
    if [ "$KIOSK" = 1 ]; then firefox --kiosk "$URL"; else firefox --new-window "$URL"; fi
    exit 0
  fi
  echo "No browser found. On Fedora: sudo dnf install chromium" >&2
  exit 1
fi

# 4. Open the app. A dedicated profile keeps the camera permission between runs.
FLAGS=(
  "--user-data-dir=$PROFILE_DIR"
  --no-first-run
  --no-default-browser-check
  --noerrdialogs
  --disable-infobars
  --disable-session-crashed-bubble
  --autoplay-policy=no-user-gesture-required
  --ozone-platform-hint=auto
  "--app=$URL"
)
[ "$KIOSK" = 1 ] && FLAGS+=(--kiosk)
[ "${MAGICTV_AUTO_CAMERA:-0}" = 1 ] && FLAGS+=(--use-fake-ui-for-media-stream)

"$BROWSER" "${FLAGS[@]}"
