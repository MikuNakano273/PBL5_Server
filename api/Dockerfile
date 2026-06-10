# syntax=docker/dockerfile:1
FROM python:3.11-slim AS builder

WORKDIR /tmp
COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --user --index-url https://download.pytorch.org/whl/cpu \
        torch==2.5.1 torchvision==0.20.1 && \
    pip install --user -r requirements.txt

FROM python:3.11-slim

WORKDIR /api
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgl1 \
        libglib2.0-0 \
        libxcb1 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONPATH=/api
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
