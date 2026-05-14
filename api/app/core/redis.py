from redis import Redis

from app.core.config import get_settings

_redis_client: Redis | None = None
_rq_redis_client: Redis | None = None


REDIS_TIMEOUT_SECONDS = 2


def connect_redis() -> Redis:
    global _redis_client
    if _redis_client is not None:
        return _redis_client

    settings = get_settings()
    _redis_client = Redis.from_url(
        settings.redis_url,
        decode_responses=True,
        socket_connect_timeout=REDIS_TIMEOUT_SECONDS,
        socket_timeout=REDIS_TIMEOUT_SECONDS,
    )
    _redis_client.ping()
    return _redis_client


def connect_rq_redis() -> Redis:
    global _rq_redis_client
    if _rq_redis_client is not None:
        return _rq_redis_client

    settings = get_settings()
    _rq_redis_client = Redis.from_url(
        settings.redis_url,
        decode_responses=False,
        socket_connect_timeout=REDIS_TIMEOUT_SECONDS,
        socket_timeout=REDIS_TIMEOUT_SECONDS,
    )
    _rq_redis_client.ping()
    return _rq_redis_client


def get_redis() -> Redis:
    if _redis_client is None:
        return connect_redis()
    return _redis_client


def get_rq_redis() -> Redis:
    if _rq_redis_client is None:
        return connect_rq_redis()
    return _rq_redis_client


def close_redis() -> None:
    global _redis_client, _rq_redis_client
    if _redis_client is not None:
        _redis_client.close()
    _redis_client = None
    if _rq_redis_client is not None:
        _rq_redis_client.close()
    _rq_redis_client = None
