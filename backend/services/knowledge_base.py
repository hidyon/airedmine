import os
import re
from pathlib import Path

DOCS_ROOT = Path(os.getenv("DOCS_ROOT", "/project"))
_DOC_FILES = ["README.md", "docs/roadmap.md", "docs/issues.md", "docs/issueslog.md"]

_KNOWN_TERMS = [
    "自然言語", "対話", "方針", "ロードマップ", "issue", "redmine",
    "知識ベース", "更新", "更新確認", "確認", "承認", "下書き", "根拠", "pm", "開発者",
]


def read_knowledge_base() -> list[dict]:
    entries = []
    for rel_path in _DOC_FILES:
        path = DOCS_ROOT / rel_path
        try:
            content = path.read_text(encoding="utf-8")
        except OSError:
            content = ""
        entries.append({"path": rel_path, "content": content})
    return entries


def find_references(question: str, knowledge: list[dict]) -> list[dict]:
    words = _query_terms(question)
    results = []
    for entry in knowledge:
        for section in _doc_sections(entry):
            score = _section_score(section, words)
            excerpt = _section_excerpt(section, words)
            if score > 0 and excerpt:
                results.append({
                    "type": "doc",
                    "id": f"{entry['path']}#{section['heading']}",
                    "title": entry["path"],
                    "source": "docs",
                    "heading": section["heading"],
                    "excerpt": excerpt,
                    "score": score,
                })
    results.sort(key=lambda r: r["score"], reverse=True)
    return results[:3]


def _doc_sections(entry: dict) -> list[dict]:
    sections: list[dict] = []
    current: dict = {"heading": entry["path"], "lines": []}

    for line in entry["content"].splitlines():
        m = re.match(r"^(#{1,4})\s+(.+)$", line)
        if m:
            if current["lines"]:
                sections.append(current)
            current = {"heading": m.group(2).strip(), "lines": [line]}
            continue
        current["lines"].append(line)

    if current["lines"]:
        sections.append(current)

    return [
        {**s, "body": "\n".join(line for line in s["lines"] if line)}
        for s in sections
    ]


def _section_score(section: dict, words: list[str]) -> int:
    heading = section["heading"].lower()
    body = section["body"].lower()
    score = 0
    for word in words:
        w = word.lower()
        if w in heading:
            score += 5
        if w in body:
            score += 2
    return score


def _query_terms(question: str) -> list[str]:
    normalized = question.lower()
    terms = [w for w in re.split(r"[^\w]+", normalized) if len(w) >= 2]
    for term in _KNOWN_TERMS:
        if term.lower() in normalized:
            terms.append(term.lower())
    return list(dict.fromkeys(terms))


def _section_excerpt(section: dict, words: list[str]) -> str:
    lines = [line for line in section["body"].splitlines() if line]
    matched = next(
        (line for line in lines if any(w in line.lower() for w in words)),
        lines[0] if lines else "",
    )
    return matched[:180]
