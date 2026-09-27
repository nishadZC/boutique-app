"""
Prometheus metrics for skin-tone-service, matching the same
metric names/labels the Node.js services use (see e.g.
backend/services/auth/src/metrics/index.ts) so alert rules and Grafana
dashboards work consistently across all instrumented services.
"""

import time

from prometheus_client import (
    CollectorRegistry,
    Counter,
    GCCollector,
    Gauge,
    Histogram,
    PlatformCollector,
    ProcessCollector,
    generate_latest,
)
from starlette.requests import Request

SERVICE_NAME = "skin-tone-service"
SERVICE_VERSION = "1.0.0"

registry = CollectorRegistry()
ProcessCollector(registry=registry)
PlatformCollector(registry=registry)
GCCollector(registry=registry)

http_request_duration = Histogram(
    "http_request_duration_seconds",
    "Duration of HTTP requests in seconds",
    ["method", "route", "status_code", "service_name"],
    # Standard buckets, extended past 10s because face detection on a large upload can be slow.
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 20, 30],
    registry=registry,
)

http_requests_total = Counter(
    "http_requests_total",
    "Total number of HTTP requests",
    ["method", "route", "status_code", "service_name"],
    registry=registry,
)

http_requests_in_progress = Gauge(
    "http_requests_in_progress",
    "Number of HTTP requests in progress",
    ["method", "service_name"],
    registry=registry,
)

service_info = Gauge(
    "service_info",
    "Static information about service",
    ["service_name", "version"],
    registry=registry,
)
service_info.labels(service_name=SERVICE_NAME, version=SERVICE_VERSION).set(1)


# Health checks and the scrape itself would only add noise to the RED metrics.
UNINSTRUMENTED_PATHS = {"/metrics", "/health"}


async def metrics_middleware(request: Request, call_next):
    if request.url.path in UNINSTRUMENTED_PATHS:
        return await call_next(request)

    method = request.method
    in_progress = http_requests_in_progress.labels(method=method, service_name=SERVICE_NAME)
    in_progress.inc()
    start = time.perf_counter()
    status_code = "500"
    try:
        response = await call_next(request)
        status_code = str(response.status_code)
        return response
    finally:
        duration = time.perf_counter() - start
        in_progress.dec()

        # The matched route template keeps label cardinality bounded; requests that
        # matched no route are grouped together rather than labelled by raw path.
        route = request.scope.get("route")
        route_label = route.path if route is not None else "unmatched"
        labels = dict(method=method, route=route_label, status_code=status_code, service_name=SERVICE_NAME)
        http_request_duration.labels(**labels).observe(duration)
        http_requests_total.labels(**labels).inc()


def metrics_response() -> bytes:
    return generate_latest(registry)
