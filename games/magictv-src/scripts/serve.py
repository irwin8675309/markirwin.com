#!/usr/bin/env python3
"""Tiny local web server for the built app (dist/).

Listens on 127.0.0.1 only, so nothing else on the home network can reach it.
Usage: serve.py <directory> <port>
"""
import functools
import http.server
import mimetypes
import sys

mimetypes.add_type("application/wasm", ".wasm")
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/css", ".css")


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):  # keep the console quiet
        pass

    def end_headers(self):
        # Always serve the freshest files; the app is tiny and local.
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def main() -> None:
    directory = sys.argv[1] if len(sys.argv) > 1 else "dist"
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 5173
    handler = functools.partial(Handler, directory=directory)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
