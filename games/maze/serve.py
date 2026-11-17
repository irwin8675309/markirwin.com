#!/usr/bin/env python3
"""Tiny local web server for Maze Adventures.

The game uses ES modules, so it must be served over http:// (opening
index.html with file:// will not work in most browsers).

Usage:
    python3 serve.py            # http://127.0.0.1:8080
    python3 serve.py 9000       # custom port
"""

import http.server
import os
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("[maze] " + (fmt % args) + "\n")


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"Maze Adventures is running at http://127.0.0.1:{PORT}")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")