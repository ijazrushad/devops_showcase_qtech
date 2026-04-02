# Qtec DevOps Practical Task

This repository contains the solution for the Qtec DevOps Practical Task, demonstrating a production-ready containerized application, CI/CD automation, traffic management, and observability.

##  System Architecture & Services

The system is deployed on an AWS EC2 instance using **Docker Compose** to orchestrate the following services. Due to existing microservices on the host, custom high-number ports are utilized.

1. **Node.js Application:** A lightweight Express API exposing `GET /status`, `POST /data`, and a `/metrics` endpoint.
2. **Nginx (Port `5115`):** Acts as a reverse proxy, routing incoming traffic to the Node.js backend.
3. **Prometheus (Port `5116`):** Scrapes health and performance metrics from the API container.
4. **Grafana (Port `5117`):** Provides visual dashboards for the metrics scraped by Prometheus.

---

##  Containerization Approach

The application is containerized using a production-optimized `Dockerfile`:
* **Base Image:** Uses `node:18-alpine` to ensure a minimal footprint and reduce the attack surface.
* **Dependency Management:** Utilizes `npm ci` to strictly install lockfile dependencies and omits development dependencies to keep the image lightweight.
* **Immutability:** Environment variables (like `PORT=3000`) are injected, ensuring the container runs predictably across different environments.

---

##  Deployment Process & Security Management

The deployment process is entirely automated via **GitHub Actions** and strictly adheres to modern DevSecOps practices:

1. **Quality Checks:** The code is checked out, dependencies are installed, and automated linting/testing is run.
2. **Vulnerability Scanning:** The Docker image is built locally and scanned using **AquaSecurity Trivy**. If critical OS or library vulnerabilities are detected, the pipeline fails before anything is published.
3. **Registry Push:** The secure image is pushed to the GitHub Container Registry (GHCR).
4. **Secure AWS Deployment:** **No SSH keys or AWS long-lived credentials are hardcoded.** The pipeline uses **OIDC (OpenID Connect)** to assume a temporary IAM role in AWS. It then uses AWS Systems Manager (SSM) to securely execute deployment commands on the EC2 instance without exposing Port 22.

---

##  Handling ~100 Requests/Sec

The system easily scales to handle ~100 requests per second:
* **Node.js Backend:** Natively handles asynchronous, event-driven I/O, making it highly efficient for concurrent, non-blocking requests.
* **Nginx Reverse Proxy:** Sits in front of the application to handle connection pooling, buffering, and dropping malformed requests before they consume Node runtime resources. Nginx's asynchronous architecture efficiently queues sudden spikes in traffic, preventing the backend from being overwhelmed.

---

## Zero-Downtime Deployment Strategy

**Current Implementation:**
The current pipeline executes a deployment using `docker compose up -d --no-deps --build app`. This pulls the latest image and recreates the container in the background. Nginx continues running and queues requests during the brief container swap (resulting in a near-instantaneous swap with only milliseconds of potential latency).

**True Zero-Downtime at Scale:**
To achieve flawless zero-downtime deployment in a high-traffic production environment without dropping a single connection, the architecture would be expanded as follows:
1. Run multiple replicas of the `app` container using Docker Swarm or Kubernetes.
2. Implement a "Rolling Update" strategy.
3. The load balancer (Nginx or an AWS ALB) would drain traffic from one container, update it, wait for health checks to pass, and then route traffic back to it before moving on to the next replica. This ensures 100% availability for end-users during the deployment lifecycle.