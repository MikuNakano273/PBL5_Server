# syntax=docker/dockerfile:1
# Stage 1: Builder with pip cache mount for faster builds
FROM python:3.11-slim AS builder
WORKDIR /tmp
COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --user -r requirements.txt

# Stage 2: Runtime (minimal)
FROM python:3.11-slim
WORKDIR /worker
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
CMD ["python", "-m", "app.main"]
