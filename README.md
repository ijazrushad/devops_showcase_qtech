# DevOps Engineer Practical Task - Showcase

## URL Test

* API Status (GET): http://app.18.143.227.177.nip.io:5115/status
* API Data (POST): http://app.18.143.227.177.nip.io:5115/data
* API Metrics: http://app.18.143.227.177.nip.io:5115/metrics
* Grafana Dashboard: http://monitor.18.143.227.177.nip.io:5117
* Prometheus UI: http://18.143.227.177:5116

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

## Advanced Infrastructure Showcase (Simulation)

While the live demo is hosted on a shared EC2 instance for cost-efficiency and immediate review, the repository includes Production-Ready Infrastructure-as-Code (IaC) and Orchestration manifests to demonstrate scalability.

* Infrastructure as Code (Terraform)
Located in /terraform, these files demonstrate the ability to provision a complete AWS environment automatically.

Resources: VPC, Public/Private Subnets, and Security Groups.

EKS Integration: Configurations for an AWS EKS Cluster with Managed Node Groups, moving away from single-instance risks.

* Container Orchestration (Kubernetes)
Located in /k8s, these manifests show a transition to cloud-native management.

Deployment: Features Horizontal Pod Autoscaling (HPA) and Rolling Updates.

Self-Healing: Liveness and Readiness probes ensure traffic only reaches healthy containers.

Security: Implements Non-Root execution policies and Resource Quotas (CPU/Memory limits) to prevent "noisy neighbor" issues.

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

> **Scaling Note:** For full zero-downtime at scale, need to move to Kubernetes with RollingUpdate + multiple replicas.

---

## Performance: Handling ~100 Requests/sec

Optimized using three layers:

* **Asynchronous I/O** — Node.js handles high concurrency via the event loop
* **Reverse Proxy Buffering** — Nginx buffers slow clients, protecting the backend from overload
* **Resource Limits** — Docker CPU/RAM constraints ensure stable latency

---

## Challenges & Troubleshooting

### Shared Environment Port Conflicts

* **Problem:** Ports already in use (80, 3000, 9090)
* **Fix:** Remapped ports to `5115–5118`

### Loki "Timestamp Too Old" Errors

* **Problem:** Old logs rejected (>7 days)
* **Fix:** Applied regex filter `.*qtech.*` + adjusted initial ingestion settings

### Docker Daemon Connection (Promtail)

* **Problem:** Promtail couldn't detect containers
* **Fix:** Mounted `/var/run/docker.sock` and ran Promtail as `root`

### The SSL / ACME Challenge Conflict

* **Problem:** Attempted to implement Let's Encrypt SSL via Certbot. However, the HTTP-01 challenge requires Port 80, which was managed by a host-level Nginx.

* **Failed Attempt:** Initially tried internal SSL termination, but it caused a 404 Unauthorized because the host Nginx intercepted the traffic.

* **The Pivot:** To maintain a clean and portable architecture, I reverted to a stable HTTP Reverse Proxy model. This demonstrates a "Separation of Concerns"—the application handles logic, while SSL is logically offloaded to an edge load balancer or host-level proxy.

### Monitoring Data Persistence

* **Problem:** Manual Grafana dashboards were lost during a docker compose down because volumes weren't initially persistent.

* **Fix:** Implemented Monitoring as Code by exporting the dashboard as a JSON model into GitHub (/grafana/dashboards/).
Added Named Docker Volumes for Grafana and Prometheus to ensure metrics survive restarts.


---

## Logging & Monitoring Setup

Using the **PLG Stack (Prometheus + Loki + Grafana)**:

| Layer | Tool | What It Tracks |
|---|---|---|
| Metrics | Prometheus | CPU, Memory, Request Latency |
| Logs | Loki + Promtail | Nginx access logs, App logs |
| Visualization | Grafana | Unified dashboards |

---
## Acess Credential

| Service | Username | Password |
|---------|----------|----------|
| Grafana Dashboard | admin | admin |
| Prometheus UI | No Auth (Internal) | N/A |

Note: For this evaluation, the Grafana instance has been reset to default credentials. In a production environment, these would be managed via AWS Secrets Manager or HashiCorp Vault

## Summary

This project demonstrates:

* Production-ready DevOps architecture
* Secure CI/CD pipeline with no long-lived credentials
* Full observability — metrics + logs in one place
* Zero-downtime deployment strategy
* Real-world troubleshooting experience