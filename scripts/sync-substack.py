import re
import sys
from datetime import date, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import urlopen
from xml.etree import ElementTree

PUBLICATION = "https://shippingtoprod.substack.com"
WRITING = Path(__file__).resolve().parents[1] / "content" / "writing.md"
# The latest entry already curated on the site.
ARCHIVE_CUTOFF = date(2026, 1, 12)


def sync(feed, writing):
    markdown = writing.read_text(encoding="utf-8")
    existing = set(re.findall(r"\]\((https://shippingtoprod\.substack\.com/p/[^)]+)\)", markdown))
    entries = []
    for item in ElementTree.fromstring(feed).findall("./channel/item"):
        link = urlsplit(item.findtext("link", "").strip())
        if link.scheme != "https" or link.netloc != urlsplit(PUBLICATION).netloc:
            continue
        if not re.fullmatch(r"/p/[a-zA-Z0-9_-]+/?", link.path):
            continue

        url = PUBLICATION + link.path.rstrip("/")
        if url in existing:
            continue
        published = parsedate_to_datetime(item.findtext("pubDate", "")).astimezone(timezone.utc)
        if published.date() <= ARCHIVE_CUTOFF:
            continue
        title = " ".join(item.findtext("title", "").split())
        if not title:
            continue
        title = re.sub(r"([^\w\s])", r"\\\1", title)
        display_date = f"{published:%B} {published.day}, {published.year}"
        entries.append((published, f"### [{title}]({url})\n*{display_date}*\n\n"))
        existing.add(url)

    if entries:
        heading, body = markdown.split("\n\n", 1)
        additions = "".join(entry for _, entry in sorted(entries, reverse=True))
        writing.write_text(f"{heading}\n\n{additions}{body}", encoding="utf-8")


if __name__ == "__main__":
    if len(sys.argv) == 2:
        feed = Path(sys.argv[1]).read_bytes()
    else:
        with urlopen(f"{PUBLICATION}/feed", timeout=20) as response:
            feed = response.read()
    sync(feed, WRITING)
