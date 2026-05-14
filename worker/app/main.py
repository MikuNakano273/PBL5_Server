from redis import Redis
from rq import Worker

from app.config.settings import settings


def run_worker() -> None:
    redis_connection = Redis.from_url(settings.redis_url, decode_responses=False)
    worker = Worker([settings.vision_queue_name], connection=redis_connection)
    worker.work(with_scheduler=True)


if __name__ == "__main__":
    run_worker()
