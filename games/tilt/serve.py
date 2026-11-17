#!/usr/bin/env python3
"""Small no-cache development server for Pet Tilt Adventures."""
import http.server
import socketserver
from pathlib import Path

os_dir = Path(__file__).resolve().parent


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(os_dir), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", 8080), Handler) as httpd:
        print("Pet Tilt Adventures running at http://127.0.0.1:8080")
        httpd.serve_forever()