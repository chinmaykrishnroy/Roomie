# Roomie ⚡

> **Meet the person before you judge the profile.**  
> Casual multi-party video & voice rooms with adaptive mesh streaming, semantic discovery, and a dual Cyberpunk aesthetic.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.23+-00ADD8?logo=go)](https://golang.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P%20Mesh-333333?logo=webrtc)](https://webrtc.org)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docker.com)

---

## Overview

**Roomie** is a privacy-conscious, real-time group video and audio hangout platform. It eliminates superficial swiping and rigid scheduling by letting people jump directly into topical, vibe-based live rooms. 

The application is built for low latency, high resilience, and cross-platform fidelity, packaged in a distinctive **Cyberpunk** visual identity featuring both an **Obsidian Neon Void (Dark Mode)** and an **Arasaka Industrial Blueprint (Light Mode)**.

---

## Key Features

- **Multi-Party Video & Voice**: Supports up to 16 live peers per stage with automated dynamic grid rebalancing (1–16 layout algorithms) and mobile stacking.
- **Pin-to-Stage Spotlight**: Click any participant to spotlight their stream into an expansive main viewport with a vertical secondary thumbnail strip.
- **Adaptive Bandwidth Saver**: One-click toggle that intelligently suspends background video feeds while preserving crisp audio streams in large groups.
- **Stage Text Chat**: Low-latency, peer-synchronized chat drawer with unread message badges.
- **Semantic Vibe Search**: Search rooms not just by keyword, but by concept or mood (e.g. *"late night chill lo-fi study session"*) powered by a Python vector embedding microservice and PostgreSQL `pgvector`.
- **Explore Radar & Stage Roulette**:
  - Live soundwave equalizers visualizing active speech audio.
  - Interactive "Surprise Me" dice roulette that drops you into an active room.
  - Geo-proximity distance indicators.
- **Dual Cyberpunk Aesthetic**:
  - **Dark Mode**: Deep obsidian HUD (`#07080b`), electric cyan glows, laser pink accents, and matrix green status beacons.
  - **Light Mode (Daytime Cyberpunk)**: Industrial technical blueprint grid, high-voltage safety yellow (`#ffe600`), stark jet-black borders, and brutalist offset shadows.
- **Theme-Adaptive Cyber Visor Mark**: Symmetrical dual-camera visor icon symbolizing two peers connecting across a stage, with embedded media queries that dynamically adjust between light and dark browser tab bars.
- **Instant Client-Side Identity**: No tedious passwords or accounts required to hang out. Pick a name, randomize with dice, customize video mirroring preferences, and start broadcasting.

---

## Architecture & Technology Stack

```
                     ┌────────────────────────┐
                     │    Caddy 2 Gateway     │
                     │  (SSL / Reverse Proxy) │
                     └───────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Next.js 16     │    │   Go Signaling   │    │  FastAPI Embed   │
│ React 19 Frontend│    │  Backend Server  │    │  (pgvector text) │
└──────────────────┘    └────────┬─────────┘    └────────┬─────────┘
                                 │                       │
                        ┌────────┴────────┐     ┌────────┴────────┐
                        │   Redis 8 Cache │     │  PostgreSQL 17  │
                        │ (Presence/State)│     │   (+ pgvector)  │
                        └─────────────────┘     └─────────────────┘
                                 ▲
                                 │ NAT Traversal
                        ┌────────┴────────┐
                        │ Pion TURN Server│
                        └─────────────────┘
```

- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Vanilla CSS Custom Properties.
- **Signaling & Orchestration**: Go 1.23+ high-concurrency WebSocket server handling room lifecycle, SDP handshakes, and ICE candidate relay.
- **NAT Traversal**: Built-in Pion TURN/STUN server allowing peer-to-peer connection establishment behind restrictive symmetric NATs and firewalls.
- **Semantic Search**: Python 3.11, FastAPI, and `sentence-transformers` generating vector embeddings for room topics.
- **Persistence & State**:
  - **PostgreSQL 17** with `pgvector` extension for room schemas and vector similarity distance searches.
  - **Redis 8** for distributed room presence, heartbeat TTLs, and live participant metrics.
- **Reverse Proxy**: Caddy 2 with automatic HTTPS certificates and WebSocket connection tunneling.

---

## Directory Structure

```
Roomie/
├── compose.yaml          # Multi-service Docker Compose specification
├── .env.example          # Environment variable template
├── .gitignore            # Git exclusion rules
├── LICENSE               # MIT Open Source License
├── scripts/              # Automation and developer workflows
│   ├── win/              # Windows PowerShell scripts (deploy.ps1, dev.ps1, clean.ps1)
│   └── unix/             # Unix/Linux/macOS Bash scripts (deploy.sh, dev.sh, clean.sh)
├── embed/                # Semantic embedding microservice (Python / FastAPI)
│   ├── app.py
│   ├── Dockerfile
│   └── requirements.txt
├── infra/                # Infrastructure definitions
│   ├── Caddyfile         # Reverse proxy routing rules
│   └── migrations/       # PostgreSQL SQL schemas and pgvector setup
├── server/               # Room coordination & WebRTC signaling (Go)
│   ├── cmd/
│   ├── internal/
│   ├── go.mod
│   └── Dockerfile
├── turn/                 # Self-hosted STUN/TURN server (Pion / Go)
│   ├── cmd/
│   ├── go.mod
│   └── Dockerfile
└── web/                  # Next.js 16 + React 19 web application
    ├── app/              # App router (pages, layout, globals.css, icon.svg)
    ├── components/       # UI components (call view, room tiles, identity, icons)
    ├── lib/              # WebRTC mesh client, audio visualizer, storage
    ├── public/           # Static assets (favicons, vector icons)
    └── package.json
```

---

## Quickstart & Local Development

### Prerequisites

- [Docker](https://www.docker.com/) & [Docker Compose v2](https://docs.docker.com/compose/)
- [Node.js 20+](https://nodejs.org/) (for optional local web development)
- [Go 1.23+](https://golang.org/) (for optional local server development)

### 1. Clone the Repository

```bash
git clone https://github.com/chinmaykrishnroy/Roomie.git
cd Roomie
```

### 2. Configure Environment & Start

You can use the platform-specific development scripts to initialize `.env` and start the stack:

```powershell
# Windows PowerShell
.\scripts\win\dev.ps1
```

```bash
# Unix / Linux / macOS
./scripts/unix/dev.sh
```

Or start manually with Docker Compose:

```bash
cp .env.example .env
docker compose up --build
```

The stack will initialize:
- **Web Client**: `http://localhost:3000`
- **Signaling Server**: `http://localhost:8080`
- **TURN Server**: `udp://localhost:3478`
- **Vector Embedding API**: `http://localhost:8000`
- **PostgreSQL**: `localhost:5433`
- **Redis**: `localhost:6380`

Open your browser to `http://localhost:3000`, pick a username, and start or join a room!

---

## Remote Deployment

Automated deployment scripts package source changes (excluding local artifacts and node modules), transfer them to your production host via SSH, and trigger zero-downtime container builds:

```powershell
# Windows PowerShell
.\scripts\win\deploy.ps1 -TargetHost "your-server-alias-or-ip" -RemoteDir "/home/user/roomie"
```

```bash
# Unix / Linux / macOS
./scripts/unix/deploy.sh your-server-alias-or-ip /home/user/roomie
```

---

## Maintenance & Cleanup

To stop containers and clean up local temporary logs:

```powershell
# Windows PowerShell
.\scripts\win\clean.ps1 [-Volumes]
```

```bash
# Unix / Linux / macOS
./scripts/unix/clean.sh [-v|--volumes]
```

---

## License

This project is open source and available under the [MIT License](LICENSE).
