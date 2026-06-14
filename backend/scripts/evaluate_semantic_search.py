"""Evaluate semantic search with a fixed set of representative questions."""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services import issue_index  # noqa: E402


DEFAULT_QUESTIONS = [
    "承認フローの仕様揺れ",
    "PM判断待ち",
    "リリースリスク",
    "性能劣化の原因",
]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--format", choices=["markdown", "json"], default="markdown")
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument(
        "--question",
        action="append",
        dest="questions",
        help="評価する質問。複数指定可。未指定なら代表質問セットを使う。",
    )
    args = parser.parse_args()

    questions = args.questions or DEFAULT_QUESTIONS
    results = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "top_k": args.top_k,
        "questions": [
            {
                "question": question,
                "results": issue_index.search(question, top_k=args.top_k),
            }
            for question in questions
        ],
    }

    if args.format == "json":
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        print(_to_markdown(results))
    return 0


def _to_markdown(results: dict) -> str:
    lines = [
        "# Semantic Search Evaluation",
        "",
        f"- generated_at: `{results['generated_at']}`",
        f"- top_k: `{results['top_k']}`",
        "",
    ]
    for block in results["questions"]:
        lines.extend([
            f"## {_escape_markdown(block['question'])}",
            "",
            "| rank | issue_id | score | subject |",
            "| ---: | ---: | ---: | --- |",
        ])
        for rank, item in enumerate(block["results"], start=1):
            lines.append(
                f"| {rank} | {item['id']} | {item['score']:.3f} | {_escape_markdown(item['subject'])} |"
            )
        if not block["results"]:
            lines.append("| - | - | - | no results |")
        lines.append("")
    return "\n".join(lines).rstrip()


def _escape_markdown(value: str) -> str:
    return str(value).replace("|", "\\|").replace("\n", " ")


if __name__ == "__main__":
    raise SystemExit(main())
