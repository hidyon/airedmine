"""Sentence-transformers embedder (lazy singleton)."""
from __future__ import annotations

import io
import numpy as np

_model = None
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def is_model_loaded() -> bool:
    return _model is not None


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
