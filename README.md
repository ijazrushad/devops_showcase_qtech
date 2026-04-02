# Qtec DevOps Practical Task

## System Architecture
This system is deployed on an AWS EC2 instance. It utilizes **Docker Compose** to orchestrate four containers:
1. **Node.js Application:** A lightweight Express API containing `GET /status`, `POST /data`, and a Prometheus `/metrics` endpoint.
2. **Nginx:** Acts as a reverse proxy, routing traffic on port 80 to the Node application.
3. **Prometheus:** Scrapes health and performance metrics from the Node.js API.
4. **Grafana:** Visualizes the metrics scraped by Prometheus.

## Containerization & Secrets Management
The Node.js application uses a multi-stage, production-ready `Dockerfile` based on Alpine Linux to ensure a minimal footprint. Security is handled securely via **GitHub Actions OIDC (OpenID Connect)**. No AWS credentials or SSH keys are hardcoded. GitHub assumes a temporary IAM role to deploy to the EC2 instance via AWS Systems Manager (SSM).

## Handling ~100 Requests/Sec
Node.js natively handles asynchronous, event-driven I/O, making it highly efficient for concurrent requests. Nginx sits in front of the API to handle connection pooling, buffering, and dropping malformed requests before they hit the Node runtime. Nginx is configured with optimized timeout settings to queue traffic efficiently, allowing this lightweight stack to easily exceed 100 req/sec even on lower-tier hardware.

## Zero-Downtime Deployment Strategy
The GitHub Actions pipeline pushes a new container image to the GitHub Container Registry (GHCR). It then triggers the EC2 instance to pull the image and run `docker compose up -d --no-deps --build app`.
This pulls the new image and swaps the container out. Nginx continues running during this swap. While a single-replica swap results in a few milliseconds of dropped connections, true zero-downtime is achievable in this architecture by scaling the `app` service to multiple replicas and rolling the update one container at a time behind the Nginx load balancer.