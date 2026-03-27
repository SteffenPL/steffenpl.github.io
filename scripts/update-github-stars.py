#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml"]
# ///
"""Update github_stars in projects.yaml using the GitHub CLI (gh).

Usage:
    uv run scripts/update-github-stars.py

Requires: gh (GitHub CLI) to be installed and authenticated.
"""

import re
import subprocess
import sys
import yaml
from pathlib import Path

YAML_PATH = Path(__file__).parent.parent / "site/src/lib/data/projects.yaml"


def get_stars(owner_repo: str) -> int | None:
    r = subprocess.run(
        ["gh", "api", f"repos/{owner_repo}", "--jq", ".stargazers_count"],
        capture_output=True,
        text=True,
    )
    s = r.stdout.strip()
    if r.returncode != 0:
        print(f"    gh error for {owner_repo}: {r.stderr.strip()}", file=sys.stderr)
        return None
    return int(s) if s.isdigit() else None


def github_owner_repo(url: str) -> str | None:
    m = re.match(r"https://github\.com/([^/]+/[^/?#\s]+?)(?:\.git)?/?$", url)
    return m.group(1) if m else None


def main() -> None:
    text = YAML_PATH.read_text()
    data = yaml.safe_load(text)

    # Collect slug -> star count from first GitHub repo of each project
    updates: dict[str, int] = {}
    for section in ("research", "coding"):
        for proj in data.get(section, []):
            slug = proj["slug"]
            for repo in proj.get("repos", []):
                owner_repo = github_owner_repo(repo.get("url", ""))
                if owner_repo:
                    print(f"  fetching {owner_repo} ...", end=" ", flush=True)
                    stars = get_stars(owner_repo)
                    if stars is not None:
                        updates[slug] = stars
                        print(f"{stars} ★")
                    else:
                        print("failed")
                    break  # use only the first GitHub repo per project

    if not updates:
        print("No updates collected — is gh installed and authenticated?")
        sys.exit(1)

    # Patch the YAML text in-place (preserves comments and all formatting)
    lines = text.splitlines(keepends=True)
    out: list[str] = []
    current_slug: str | None = None
    inserted: set[str] = set()

    i = 0
    while i < len(lines):
        line = lines[i]

        # Track current project slug
        m = re.match(r"^  - slug: ['\"]?([^\s'\"]+)['\"]?\s*$", line)
        if m:
            current_slug = m.group(1)

        # Update existing github_stars line
        if current_slug in updates and re.match(r"^    github_stars:", line):
            out.append(f"    github_stars: {updates[current_slug]}\n")
            inserted.add(current_slug)
            i += 1
            continue

        out.append(line)

        # Insert github_stars after `year:` only if the project block has no github_stars yet
        if (
            current_slug in updates
            and current_slug not in inserted
            and re.match(r"^    year:", line)
        ):
            # Scan ahead within this project block (until next `  - slug:` or EOF)
            j = i + 1
            already_has_stars = False
            while j < len(lines):
                if re.match(r"^  - slug:", lines[j]):
                    break  # next project starts
                if re.match(r"^    github_stars:", lines[j]):
                    already_has_stars = True
                    break
                j += 1
            if not already_has_stars:
                out.append(f"    github_stars: {updates[current_slug]}\n")
                inserted.add(current_slug)

        i += 1

    YAML_PATH.write_text("".join(out))
    print(f"\nUpdated {len(inserted)} project(s) in {YAML_PATH.relative_to(Path.cwd())}")


if __name__ == "__main__":
    main()
