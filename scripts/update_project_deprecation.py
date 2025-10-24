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
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Set
from xml.etree import ElementTree as ET

import requests
from ruamel.yaml import YAML
from ruamel.yaml.comments import CommentedSeq

PROJECT_DIR = Path(__file__).resolve().parent.parent / "_data" / "projects"
KEYWORD_PATTERNS = (
    re.compile(r"\bthis\s+(?:project|repository|module|package|tool)\s+is\s+deprecated\b", re.I),
    re.compile(r"\b(?:project|repository|module|package|tool)\s+is\s+deprecated\b", re.I),
    re.compile(r"\bdeprecated\s+(?:project|repository|module|package|tool)\b", re.I),
    re.compile(r"\bno\s+longer\s+maintained\b", re.I),
    re.compile(r"\bno\s+further\s+development\b", re.I),
    re.compile(r"\barchived\b[^\n.]*\bdeprecated\b", re.I),
)
TWO_YEARS_AGO = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=365 * 2)
HEADERS = {
    "User-Agent": "drupaltools-audit-script/1.0 (+https://drupaltools.github.io)"
}
REQUEST_TIMEOUT = 12
CONCURRENCY = 12

_executor = ThreadPoolExecutor(max_workers=CONCURRENCY)


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


def fetch_page(url: str) -> UrlCheck:
    try:
        response = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT, allow_redirects=True)
        valid = 200 <= response.status_code < 400
        text = response.text if valid else ""
    except requests.RequestException:
        return UrlCheck(valid=False, keyword_hit=False)

    keyword_hit = any(pattern.search(text) for pattern in KEYWORD_PATTERNS)
    return UrlCheck(valid=valid, keyword_hit=keyword_hit)


def fetch_commit_date(repo: str) -> Optional[dt.datetime]:
    url = f"https://github.com/{repo}/commits.atom"
    try:
        response = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT, allow_redirects=True)
    except requests.RequestException:
        return None
    if response.status_code >= 400:
        return None
    text = response.text

    try:
        root = ET.fromstring(text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}

        entry = root.find("atom:entry", ns)
        if entry is not None:
            for tag in ("atom:updated", "atom:published"):
                candidate = entry.find(tag, ns)
                if candidate is not None and candidate.text:
                    iso_value = candidate.text.replace("Z", "+00:00")
                    try:
                        return dt.datetime.fromisoformat(iso_value)
                    except ValueError:
                        continue

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
    loop = asyncio.get_running_loop()
    tasks = {url: loop.run_in_executor(_executor, fetch_page, url) for url in urls}
    results: Dict[str, UrlCheck] = {}
    for url, task in tasks.items():
        results[url] = await task
    return results


async def collect_commit_data(repos: Set[str]) -> Dict[str, Optional[dt.datetime]]:
    loop = asyncio.get_running_loop()
    tasks = {repo: loop.run_in_executor(_executor, fetch_commit_date, repo) for repo in repos}
    results: Dict[str, Optional[dt.datetime]] = {}
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
