FROM python:3.12-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pyproject.toml .
RUN mkdir -p app watcher && touch app/__init__.py watcher/__init__.py
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -e .

COPY . .

FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 quantmark && \
    adduser --system --uid 1001 quantmark

WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app /app

USER quantmark

EXPOSE 8080

CMD python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
