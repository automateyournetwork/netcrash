#!/usr/bin/env python3
"""Serve NETCRASH to other machines on the network (static files only, no build step).

    python3 serve.py [--port 8000] [--bind 0.0.0.0]

Open one of the printed addresses on another computer or phone on the same network. It never serves
the reference Flash archive (*.zip) or Windows download-marker files.
"""
import argparse
import http.server
import os
import socket


class Handler(http.server.SimpleHTTPRequestHandler):
    BLOCKED_SUFFIXES = ('.zip', ':zone.identifier', '.py', '.ps1')

    def _blocked(self):
        path = self.path.split('?', 1)[0].lower()
        return path.endswith(self.BLOCKED_SUFFIXES) or '/.' in path

    def do_GET(self):
        if self._blocked():
            self.send_error(404, 'Not served')
            return
        super().do_GET()

    def do_HEAD(self):
        if self._blocked():
            self.send_error(404, 'Not served')
            return
        super().do_HEAD()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')  # testers always get the latest build
        super().end_headers()

    def log_message(self, fmt, *args):
        print('%s - %s' % (self.address_string(), fmt % args))


def lan_addresses():
    found = set()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('10.255.255.255', 1))  # no packet is sent; this just selects the outgoing interface
        found.add(s.getsockname()[0])
        s.close()
    except OSError:
        pass
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            found.add(info[4][0])
    except OSError:
        pass
    return sorted(a for a in found if not a.startswith('127.'))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--port', type=int, default=8000)
    ap.add_argument('--bind', default='0.0.0.0', help='interface to listen on (default: all)')
    args = ap.parse_args()
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = http.server.ThreadingHTTPServer((args.bind, args.port), Handler)
    print(f'NETCRASH is being served on {args.bind}:{args.port}  (Ctrl+C to stop)')
    print(f'  this machine:  http://127.0.0.1:{args.port}/')
    for a in lan_addresses():
        print(f'  other devices: http://{a}:{args.port}/')
    print('Useful: add ?fps=1 for a frame-rate meter, ?format=mobile or ?format=desktop to force a layout.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nstopped')


if __name__ == '__main__':
    main()
