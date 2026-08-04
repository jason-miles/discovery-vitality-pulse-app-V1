"""Tiny in-process TTL cache for expensive Genie / RAG calls.

Keeps the demo snappy: once an insight, narrative or RAG answer is generated it
is reused for the TTL window instead of paying the 10-20s Genie round-trip on
every page view or reload. Process-local (fine for a single-replica Databricks
App); clears on redeploy.
"""

from __future__ import annotations

import hashlib
import threading
import time
from typing import Any, Callable

_LOCK = threading.Lock()
_STORE: dict[str, tuple[float, Any]] = {}
DEFAULT_TTL_S = 1800  # 30 minutes


def _key(*parts: str) -> str:
    return hashlib.sha256("||".join(parts).encode()).hexdigest()[:32]


def get_or_set(parts: list[str], producer: Callable[[], Any], ttl_s: int = DEFAULT_TTL_S) -> Any:
    """Return a cached value for `parts`, or produce+store it. The producer runs
    outside the lock so slow Genie calls don't block other keys."""
    k = _key(*parts)
    now = time.time()
    with _LOCK:
        hit = _STORE.get(k)
        if hit and hit[0] > now:
            val = hit[1]
            # mark as cache hit without mutating the stored copy
            if isinstance(val, dict):
                return {**val, "cached": True}
            return val

    value = producer()  # may be slow; intentionally outside the lock
    # Only cache truthy results — a None/empty means the producer failed
    # (e.g. Genie timeout), and we want the next call to retry, not serve the miss.
    if value:
        with _LOCK:
            _STORE[k] = (now + ttl_s, value)
    return value


def clear() -> None:
    with _LOCK:
        _STORE.clear()
