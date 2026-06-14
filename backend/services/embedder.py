"""Sentence-transformers embedder (lazy singleton)."""
from __future__ import annotations

import io
from datetime import datetime, timezone
import numpy as np

_model = None
_warmup_status = {
    "state": "not_started",
    "started_at": None,
    "finished_at": None,
    "error": None,
}
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def is_model_loaded() -> bool:
    return _model is not None


def warm_up() -> dict:
    """Load the model and run a tiny encode so first user search is warm."""
    _warmup_status.update({
        "state": "running",
        "started_at": _now(),
        "finished_at": None,
        "error": None,
    })
    try:
        encode_one("warmup")
    except Exception as exc:
        _warmup_status.update({
            "state": "failed",
            "finished_at": _now(),
            "error": str(exc),
        })
    else:
        _warmup_status.update({
            "state": "ready",
            "finished_at": _now(),
            "error": None,
        })
    return warmup_status()


def warmup_status() -> dict:
    return {
        **_warmup_status,
        "model": MODEL_NAME,
        "loaded": is_model_loaded(),
    }


def encode(texts: list[str]) -> np.ndarray:
    """Return (N, D) float32 embedding matrix."""
    model = _get_model()
    return model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)


def encode_one(text: str) -> np.ndarray:
    return encode([text])[0]


def to_blob(vec: np.ndarray) -> bytes:
    buf = io.BytesIO()
    np.save(buf, vec.astype(np.float32))
    return buf.getvalue()


def from_blob(blob: bytes) -> np.ndarray:
    return np.load(io.BytesIO(blob))


def cosine_similarity_matrix(query: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    """query: (D,), matrix: (N, D) — returns (N,) similarities (already normalized)."""
    return matrix @ query


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()
