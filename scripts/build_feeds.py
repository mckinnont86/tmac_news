#!/usr/bin/env python3
"""Pre-build feeds.json for McGrid.

Runs in the GitHub Pages deploy workflow (on push and on a schedule). It reads
every feed URL from app.js (NEWS_FEEDS url:'...' and PODS_STATIC rss:'...'),
fetches them in parallel, and writes feeds.json in the same shape the page's
feed loader caches:

  {"generated": "<ISO UTC>", "feeds": {"<feed url>": [
      {"title", "link", "pubDate": "YYYY-MM-DD HH:MM:SS" (UTC), "description"}
  ]}}

The page reads feeds.json first and only calls rss2json for feeds that are
missing here (e.g. sites that block GitHub's servers) or when it is stale.
Standard library only. A feed that fails is just left out; the script never
fails the deploy.
"""
import concurrent.futures as cf
import datetime as dt
import email.utils
import gzip
import html
import json
import re
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from zoneinfo import ZoneInfo

_ET = ZoneInfo("America/New_York")

ROOT = Path(__file__).resolve().parent.parent
APP_JS = ROOT / "app.js"
OUT = ROOT / "feeds.json"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/130.0 Safari/537.36 McGridFeedBuilder")
MAX_ITEMS = 10
TIMEOUT = 20


def block(src, name):
    """Return the text of `const NAME = {...};` (balanced braces)."""
    i = src.index(f"const {name} = {{")
    depth = 0
    for j in range(src.index("{", i), len(src)):
        c = src[j]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return src[i:j + 1]
    raise ValueError(f"unbalanced {name}")


def feed_urls():
    src = APP_JS.read_text(encoding="utf-8")
    urls = re.findall(r"url:\s*'(https?://[^']+)'", block(src, "NEWS_FEEDS"))
    urls += re.findall(r"rss:\s*'(https?://[^']+)'", block(src, "PODS_STATIC"))
    return list(dict.fromkeys(urls))  # unique, keep order


class _Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self.skip:
            self.skip -= 1

    def handle_data(self, d):
        if not self.skip:
            self.parts.append(d)


def text(s, limit=None):
    """HTML fragment -> plain text (never markup)."""
    if not s:
        return ""
    p = _Text()
    try:
        p.feed(s)
        p.close()
        out = "".join(p.parts)  # HTMLParser already decoded entities
    except Exception:
        out = html.unescape(re.sub(r"<[^>]*>", " ", s))
    out = re.sub(r"\s+", " ", out).strip()
    return out[:limit] if limit else out


def utc(s):
    """RSS/Atom date -> 'YYYY-MM-DD HH:MM:SS' in UTC (rss2json's format)."""
    if not s:
        return ""
    s = s.strip()
    d = None
    try:
        d = email.utils.parsedate_to_datetime(s)
    except Exception:
        try:
            d = dt.datetime.fromisoformat(s.replace("Z", "+00:00"))
        except Exception:
            d = None
            for fmt in ("%b %d, %Y %I:%M%p", "%B %d, %Y %I:%M%p", "%b %d, %Y"):
                try:
                    # e.g. Fierce Healthcare "Nov 23, 2026 2:28pm" (US Eastern, no zone)
                    d = dt.datetime.strptime(s.upper(), fmt).replace(tzinfo=_ET)
                    break
                except ValueError:
                    pass
            if d is None:
                return ""
    if d.tzinfo is None:
        d = d.replace(tzinfo=dt.timezone.utc)
    return d.astimezone(dt.timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def local(tag):
    return tag.rsplit("}", 1)[-1].lower()


def child(el, *names):
    for c in el:
        if local(c.tag) in names:
            return c
    return None


def child_text(el, *names):
    c = child(el, *names)
    return (c.text or "").strip() if c is not None and c.text else ""


def parse(xml_bytes):
    root = ET.fromstring(xml_bytes)
    kind = local(root.tag)
    items = []
    if kind == "feed":  # Atom
        for e in root:
            if local(e.tag) != "entry":
                continue
            link = ""
            for l in e:
                if local(l.tag) == "link" and l.get("rel", "alternate") == "alternate":
                    link = l.get("href", "")
                    break
            desc = child_text(e, "summary") or child_text(e, "content")
            items.append({
                "title": text(child_text(e, "title")),
                "link": link,
                "pubDate": utc(child_text(e, "published") or child_text(e, "updated")),
                "description": text(desc, 400),
            })
    else:  # RSS 2.0 / RSS 1.0 (rdf)
        chan = child(root, "channel")
        pool = list(chan) if chan is not None else []
        pool += list(root)  # RSS 1.0 puts <item> at the root
        for e in pool:
            if local(e.tag) != "item":
                continue
            desc = child_text(e, "description") or child_text(e, "encoded")
            items.append({
                "title": text(child_text(e, "title")),
                "link": child_text(e, "link"),
                "pubDate": utc(child_text(e, "pubdate") or child_text(e, "date")),
                "description": text(desc, 400),
            })
    items = [i for i in items if i["title"] or i["link"]]
    return items[:MAX_ITEMS]


def fetch_once(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        body = r.read(5_000_000)
        if r.headers.get("Content-Encoding", "").lower() == "gzip" or body[:2] == b"\x1f\x8b":
            body = gzip.decompress(body)
    body = body.lstrip(b"\xef\xbb\xbf \t\r\n")
    return parse(body)


def fetch(url):
    try:
        return fetch_once(url)
    except urllib.error.HTTPError as e:
        if e.code in (401, 403, 404, 410):
            raise  # permanent; the page falls back to rss2json for this one
        time.sleep(2)
        return fetch_once(url)
    except Exception:
        time.sleep(2)
        return fetch_once(url)


def main():
    urls = feed_urls()
    feeds, failed = {}, []
    with cf.ThreadPoolExecutor(max_workers=12) as ex:
        futs = {ex.submit(fetch, u): u for u in urls}
        for f in cf.as_completed(futs):
            u = futs[f]
            try:
                items = f.result()
                if items:
                    feeds[u] = items
                else:
                    failed.append((u, "no items"))
            except Exception as e:  # noqa: BLE001 - one bad feed must not stop the rest
                failed.append((u, f"{type(e).__name__}: {e}"[:120]))
    out = {
        "generated": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "feeds": {u: feeds[u] for u in urls if u in feeds},
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"feeds.json: {len(out['feeds'])}/{len(urls)} feeds, {OUT.stat().st_size // 1024} KB")
    for u, why in sorted(failed):
        print(f"  skipped {u} ({why})")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # never block the deploy; the page falls back to rss2json
        print(f"build_feeds failed: {e}", file=sys.stderr)
        sys.exit(0)
