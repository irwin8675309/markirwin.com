#!/usr/bin/env bash
# Makes Grandkids' Magic TV start by itself when you log in, and adds an
# "Grandkids' Magic TV" entry to the applications menu.
#
#   scripts/install-linux-autostart.sh            install
#   scripts/install-linux-autostart.sh --remove   remove again
set -eu

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AUTOSTART="$HOME/.config/autostart/magic-tv.desktop"
MENU="$HOME/.local/share/applications/magic-tv.desktop"

if [ "${1:-}" = "--remove" ]; then
  rm -f "$AUTOSTART" "$MENU"
  echo "Removed the Magic TV launcher entries."
  exit 0
fi

mkdir -p "$(dirname "$AUTOSTART")" "$(dirname "$MENU")"
chmod +x "$APP_DIR/scripts/start.sh"

cat >"$MENU" <<DESKTOP
[Desktop Entry]
Type=Application
Name=Grandkids' Magic TV
Comment=Wave your hands and make magic
Exec=bash "$APP_DIR/scripts/start.sh"
Path=$APP_DIR
Terminal=false
Categories=Game;
DESKTOP

cp "$MENU" "$AUTOSTART"
echo "X-GNOME-Autostart-enabled=true" >>"$AUTOSTART"

echo "Installed:"
echo "  menu entry : $MENU"
echo "  autostart  : $AUTOSTART"
echo "Run once by hand first (scripts/start.sh) so the app is built and the camera is allowed."
