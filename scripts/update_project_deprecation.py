#!/usr/bin/env python3
"""Audit project metadata for deprecation signals.

This script analyses each YAML file in `_data/projects` and verifies whether
its linked resources show indications of deprecation:

* The linked `source` or `homepage` mentions common deprecation keywords.
* The most recent commit on a GitHub repository is older than two years.
* The linked pages respond successfully.

Projects that fail the checks are marked as deprecated by adding the
`deprecated` category and removing the `recommended: true` flag when present.
"""

from __future__ import annotations

import asyncio
import datetime as dt
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Set
from xml.etree import ElementTree as ET

import aiohttp
from ruamel.yaml import YAML
from ruamel.yaml.comments import CommentedSeq

PROJECT_DIR = Path(__file__).resolve().parent.parent / "_data" / "projects"
KEYWORDS = ("deprecated", "obsolete", "no further development")
TWO_YEARS_AGO = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=365 * 2)
HEADERS = {
    "User-Agent": "drupaltools-audit-script/1.0 (+https://drupaltools.github.io)"
}
REQUEST_TIMEOUT = aiohttp.ClientTimeout(total=12)
CONCURRENCY = 12


def load_yaml(path: Path) -> Dict:
    yaml = YAML(typ="rt")
    yaml.preserve_quotes = True
    with path.open("r", encoding="utf-8") as handle:
        return yaml.load(handle)


def dump_yaml(path: Path, data: Dict) -> None:
    yaml = YAML(typ="rt")
    yaml.preserve_quotes = True
    yaml.indent(sequence=2, offset=2)
    yaml.width = 4096
    yaml.default_flow_style = False
    with path.open("w", encoding="utf-8") as handle:
        yaml.dump(data, handle)


@dataclass
class UrlCheck:
    valid: bool
    keyword_hit: bool


async def fetch_page(session: aiohttp.ClientSession, semaphore: asyncio.Semaphore, url: str) -> UrlCheck:
    async with semaphore:
        try:
            async with session.get(url, timeout=REQUEST_TIMEOUT) as response:
                valid = 200 <= response.status < 400
                text = await response.text(errors="ignore") if valid else ""
        except (aiohttp.ClientError, asyncio.TimeoutError):
            return UrlCheck(valid=False, keyword_hit=False)

    lower_text = text.lower()
    keyword_hit = any(keyword in lower_text for keyword in KEYWORDS)
    return UrlCheck(valid=valid, keyword_hit=keyword_hit)


async def fetch_commit_date(session: aiohttp.ClientSession, semaphore: asyncio.Semaphore, repo: str) -> Optional[dt.datetime]:
    url = f"https://github.com/{repo}/commits.atom"
    async with semaphore:
        try:
            async with session.get(url, timeout=REQUEST_TIMEOUT) as response:
                if response.status >= 400:
                    return None
                text = await response.text(errors="ignore")
        except (aiohttp.ClientError, asyncio.TimeoutError):
            return None

    try:
        root = ET.fromstring(text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        updated = root.find("atom:updated", ns)
        if updated is None or not updated.text:
            return None
        iso_value = updated.text.replace("Z", "+00:00")
        return dt.datetime.fromisoformat(iso_value)
    except ET.ParseError:
        return None
    except ValueError:
        return None


def github_repo(url: str) -> Optional[str]:
    match = re.match(r"https?://github\.com/([^/]+)/([^/#?]+)", url)
    if not match:
        return None
    owner, repo = match.group(1), match.group(2)
    repo = repo.rstrip(".git")
    return f"{owner}/{repo}"


async def collect_url_data(urls: Set[str]) -> Dict[str, UrlCheck]:
    connector = aiohttp.TCPConnector(limit=CONCURRENCY)
    semaphore = asyncio.Semaphore(CONCURRENCY)
    async with aiohttp.ClientSession(headers=HEADERS, connector=connector) as session:
        tasks = {url: asyncio.create_task(fetch_page(session, semaphore, url)) for url in urls}
        results = {}
        for url, task in tasks.items():
            results[url] = await task
    return results


async def collect_commit_data(repos: Set[str]) -> Dict[str, Optional[dt.datetime]]:
    connector = aiohttp.TCPConnector(limit=CONCURRENCY)
    semaphore = asyncio.Semaphore(CONCURRENCY)
    async with aiohttp.ClientSession(headers=HEADERS, connector=connector) as session:
        tasks = {repo: asyncio.create_task(fetch_commit_date(session, semaphore, repo)) for repo in repos}
        results = {}
        for repo, task in tasks.items():
            results[repo] = await task
    return results


def decide_deprecation(urls: Iterable[str], url_checks: Dict[str, UrlCheck], commit_dates: Dict[str, Optional[dt.datetime]]) -> Dict[str, bool]:
    results = [url_checks.get(url) for url in urls if url]
    keyword_hit = any(result.keyword_hit for result in results if result)
    valid = any(result.valid for result in results if result)
    stale = False

    if not keyword_hit:
        for url in urls:
            repo = github_repo(url)
            if not repo:
                continue
            commit_date = commit_dates.get(repo)
            if commit_date and commit_date < TWO_YEARS_AGO:
                stale = True
                break

    return {
        "keyword_hit": keyword_hit,
        "valid": valid,
        "stale": stale,
    }


def update_project(path: Path, data: Dict, assessment: Dict[str, bool]) -> bool:
    should_deprecate = assessment["keyword_hit"] or assessment["stale"] or not assessment["valid"]

    categories = data.get("category")
    if categories is None:
        categories = CommentedSeq()
        data["category"] = categories

    modified = False

    if should_deprecate:
        if "deprecated" not in categories:
            categories.append("deprecated")
            modified = True
        if data.get("recommended") is True:
            data.pop("recommended")
            modified = True
    else:
        if "deprecated" in categories:
            categories.remove("deprecated")
            modified = True

    if modified:
        dump_yaml(path, data)
    return modified


async def audit_projects(project_files: List[Path]) -> int:
    projects = []
    all_urls: Set[str] = set()
    for path in project_files:
        data = load_yaml(path)
        urls = []
        for key in ("source", "homepage"):
            value = data.get(key)
            if isinstance(value, str) and value.strip():
                urls.append(value.strip())
                all_urls.add(value.strip())
        projects.append((path, data, urls))

    url_checks = await collect_url_data(all_urls)
    repos = {repo for url in all_urls if (repo := github_repo(url))}
    commit_dates = await collect_commit_data(repos)

    deprecated_count = 0
    for path, data, urls in projects:
        assessment = decide_deprecation(urls, url_checks, commit_dates)
        if update_project(path, data, assessment):
            deprecated_count += 1
    return deprecated_count


def main() -> int:
    project_files = sorted(PROJECT_DIR.glob("*.yml"))
    deprecated_count = asyncio.run(audit_projects(project_files))
    print(f"Updated {deprecated_count} project files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
