from __future__ import annotations

import argparse
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parent


class SpaPreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory: str | None = None, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path: str) -> str:
        parsed = urlparse(path)
        clean_path = unquote(parsed.path.lstrip("/"))
        resolved = (ROOT / clean_path).resolve()

        try:
            resolved.relative_to(ROOT)
        except ValueError:
            return str(ROOT / "__invalid__")

        return str(resolved)

    def do_GET(self) -> None:
        if self._serve_spa_fallback():
            return
        super().do_GET()

    def do_HEAD(self) -> None:
        if self._serve_spa_fallback(head_only=True):
            return
        super().do_HEAD()

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def log_message(self, format: str, *args) -> None:
        print(f"[preview] {self.address_string()} - {format % args}")

    def _serve_spa_fallback(self, head_only: bool = False) -> bool:
        parsed = urlparse(self.path)
        request_path = parsed.path

        if request_path.startswith("/backend/") or request_path.startswith("/api/"):
            return False

        target = Path(self.translate_path(request_path))
        if target.exists():
            return False

        index_path = ROOT / "index.html"
        if not index_path.exists():
            self.send_error(404, "index.html not found")
            return True

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(index_path.stat().st_size))
        self.end_headers()

        if not head_only:
            with index_path.open("rb") as file_handle:
                self.wfile.write(file_handle.read())

        return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Local SPA preview server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PREVIEW_PORT", "4173")))
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), SpaPreviewHandler)
    print(f"Preview server running at http://{args.host}:{args.port}")
    print(f"Serving files from {ROOT}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping preview server...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
