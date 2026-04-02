# DevOps Engineer Practical Task - Showcase

## System Architecture

The system is designed as a **production-style microservices stack** deployed on an AWS EC2 instance using Docker Compose for orchestration.

### 🔹 High-Level Architecture
```
                ┌───────────────────────────┐
                │        Internet           │
                └─────────────┬─────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │     Nginx      │
                     │ Reverse Proxy  │
                     └──────┬─────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Node API   │   │ Prometheus   │   │   Promtail   │
│  (Express)   │   │  Metrics     │   │ Log Collector│
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                  │
       ▼                  ▼                  ▼
               ┌────────────────────────────┐
               │         Grafana            │
               │ Dashboards (Logs + Metrics)│
               └────────────┬───────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │     Loki     │
                    │ Log Storage  │
                    └──────────────┘
```

---

## Core Components

### API Service

* Node.js Express application
* Endpoints:
  * `GET /status`
  * `POST /data`

### Reverse Proxy (Nginx)

* Entry point for all requests
* Handles:
  * SSL termination (optional)
  * Request buffering
  * Load balancing

### Monitoring (Prometheus)

* Scrapes performance metrics from API
* Tracks:
  * CPU usage
  * Memory usage
  * Request latency

### Logging (Loki + Promtail)

* Promtail collects logs from containers
* Loki aggregates logs centrally

### Visualization (Grafana)

* Unified dashboards for:
  * Metrics
  * Logs

---

## Containerization Approach

The application is packaged using a **multi-stage Docker build**.

* **Minimal Footprint** — Uses `node:20-alpine` to reduce size and attack surface
* **Security** — Runs as a **non-root user**
* **Configuration** — Uses environment variables for ports, secrets, and runtime configs

---

## Deployment & CI/CD Process

Automated using **GitHub Actions** with a *Shift-Left* strategy.

### 🔹 Pipeline Steps

1. **Quality Gate** — `npm run lint` + `npm test`
2. **Security Scan** — Image scanned using **Trivy**
3. **Automated Versioning** — Semantic versioning applied
4. **Secure Push** — Image pushed to **GitHub Container Registry (GHCR)**
5. **Deployment** — Uses **OIDC (OpenID Connect)** to assume IAM role — no long-lived credentials
6. **Execution** — Deployment via **AWS Systems Manager (SSM)** — no SSH (port 22) exposure

---

## Zero-Downtime Deployment

Uses a **Rolling Recreate Strategy**:
```bash
docker compose up -d --no-deps --build app
```

* Nginx remains active during updates
* Connection pooling prevents request loss
* Downtime limited to milliseconds

> **Scaling Note:** For full zero-downtime at scale, move to Kubernetes with RollingUpdate + multiple replicas.

---

## Performance: Handling ~100 Requests/sec

Optimized using three layers:

* **Asynchronous I/O** — Node.js handles high concurrency via the event loop
* **Reverse Proxy Buffering** — Nginx buffers slow clients, protecting the backend from overload
* **Resource Limits** — Docker CPU/RAM constraints ensure stable latency

---

## Challenges & Troubleshooting

### 1Shared Environment Port Conflicts

* **Problem:** Ports already in use (80, 3000, 9090)
* **Fix:** Remapped ports to `5115–5118`

### 2Loki "Timestamp Too Old" Errors

* **Problem:** Old logs rejected (>7 days)
* **Fix:** Applied regex filter `.*qtech.*` + adjusted initial ingestion settings

### Docker Daemon Connection (Promtail)

* **Problem:** Promtail couldn't detect containers
* **Fix:** Mounted `/var/run/docker.sock` and ran Promtail as `root`

---

## Logging & Monitoring Setup

Using the **PLG Stack (Prometheus + Loki + Grafana)**:

| Layer | Tool | What It Tracks |
|---|---|---|
| Metrics | Prometheus | CPU, Memory, Request Latency |
| Logs | Loki + Promtail | Nginx access logs, App logs |
| Visualization | Grafana | Unified dashboards |

---

## Summary

This project demonstrates:

* Production-ready DevOps architecture
* Secure CI/CD pipeline with no long-lived credentials
* Full observability — metrics + logs in one place
* Zero-downtime deployment strategy
* Real-world troubleshooting experience