# SwasthGuru — Cloud-Native Microservices Architecture

> A production-ready, GCP-deployable telemedicine platform with JWT-secured endpoints, real-time WebRTC video calling, and GenAI-powered medicine assistance.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    GCP Load Balancer / GKE Ingress            │
└─────────────┬────────────┬─────────────┬──────────────────────┘
              │            │             │
    ┌─────────▼──┐  ┌──────▼──┐  ┌──────▼────────┐
    │  Frontend  │  │  Auth   │  │     Data      │
    │ (Next.js)  │  │ Service │  │   Service     │
    │  :3000     │  │  :5002  │  │    :5003      │
    └─────────────┘  └──────────┘  └──────────────┘
              │            │             │
    ┌─────────▼──────────────────────────▼──────────┐
    │          Signal Service (Socket.IO + WebRTC)   │
    │                      :5001                    │
    │   Room Registry | ICE Config | Heartbeat      │
    └───────────────────────┬───────────────────────┘
                            │
    ┌───────────────────────▼───────────────────────┐
    │           Core Engine (FastAPI + Gemini)       │
    │                     :8000                     │
    │   /doctor-match | /analyze-medicine | /docs   │
    └───────────────────────────────────────────────┘
              │
    ┌─────────▼──────────┐   ┌───────────────────┐
    │    Supabase        │   │      Redis         │
    │ (Auth + DB + Store)│   │  (Rate Limits +    │
    └────────────────────┘   │   Session Store)   │
                             └───────────────────┘
```

## Services

| Service | Port | Tech | Responsibility |
|---------|------|------|----------------|
| `frontend` | 3000 | Next.js 14 | Patient & Doctor UI |
| `backend` | 5000 | Express (API Gateway) | Local dev convenience, route proxy |
| `auth-service` | 5002 | Express + Svix | Clerk webhooks, user profile sync |
| `data-service` | 5003 | Express + Supabase | Appointments, records, doctors, OCR |
| `signal-service` | 5001 | Socket.IO | WebRTC signalling, 300+ sessions |
| `core-engine` | 8000 | FastAPI + Gemini | Doctor matching, medicine AI |
| `redis` | 6379 | Redis 7 | Rate limiting, session store |
| `mongodb` | 27017 | MongoDB 7 | Legacy fallback storage |

## Security

- **JWT Authentication**: All protected endpoints verify Clerk-issued JWTs via JWKS
- **RBAC**: Role-Based Access Control — patients vs doctors vs admins
- **Rate Limiting**: IP-based token bucket (120 req/min general, 20 req/min AI)
- **Webhook Verification**: Clerk webhooks validated with Svix signatures
- **Structured Logging**: GCP Cloud Logging-compatible JSON output

## Running Locally

### Prerequisites
- Node.js 18+
- Python 3.10+ (for core-engine)
- Docker & Docker Compose (optional)

### Start All Services (Docker)
```bash
cp backend/.env.example backend/.env    # Fill in your secrets
docker compose up --build
```

### Start Backend Only
```bash
cd backend
npm install
npm run dev     # Starts on port 5000
```

### Start Signal Service
```bash
cd services/signal-service
npm install
npm run dev     # Starts on port 5001
```

### Start Frontend
```bash
npm install
npm run dev     # Starts on port 3000
```

## Deploying to GCP (GKE)

1. **Create a GKE cluster** (e2-standard-4 nodes recommended)
2. **Build and push images** to Google Container Registry:
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/signal-service ./services/signal-service
   gcloud builds submit --tag gcr.io/PROJECT_ID/auth-service ./services/auth-service
   gcloud builds submit --tag gcr.io/PROJECT_ID/data-service ./services/data-service
   gcloud builds submit --tag gcr.io/PROJECT_ID/core-engine ./core-engine
   ```
3. **Create namespace and secrets**:
   ```bash
   kubectl apply -f k8s/secrets.template.yaml   # fill in real values first!
   ```
4. **Deploy all services**:
   ```bash
   kubectl apply -f k8s/
   ```

## Video Calling (WebRTC)

- Uses Google's public STUN servers by default
- Configure a TURN server (via `TURN_SERVER_URL` env var) for users behind strict NAT
- Signal service supports up to **300+ concurrent sessions** via horizontal scaling (HPA up to 20 replicas)
- Session affinity (`ClientIP`) ensures WebSocket connections stay on the same pod
- Room heartbeats every 30s detect stale connections and clean up automatically

## Environment Variables

See `backend/.env.example` for required variables. Key ones:
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
- `NEXT_PUBLIC_GEMINI_API_KEY`
- `TURN_SERVER_URL` (optional, for TURN relay)
