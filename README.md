# DigitLeaf

A full-stack web application for managing tobacco leaf operations, including farmer contracts, sack registration, tobacco purchasing, and returns.

---

## Project Structure

```text
DigitLeaf/
├── backend/
└── frontend/
```

---

## Backend

**Stack:** Python · FastAPI · SQLAlchemy · Alembic · MySQL

```text
backend/
├── .env
├── alembic.ini
├── requirements.txt
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
├── app/
│   ├── main.py
│   ├── admin/
│   ├── api/
│   ├── core/
│   ├── db/
│   └── domains/
│       ├── audit/
│       ├── auth/
│       ├── farmer_contrast/
│       ├── farmers/
│       ├── rbac/
│       ├── sack_registration/
│       ├── tobacco_purchase/
│       ├── tobacco_return/
│       └── users/
├── scripts/
│   └── seed.py
└── uploads/
```

---

## Frontend

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Turborepo

```text
frontend/
├── package.json
├── turbo.json
├── apps/
│   └── web/
│       ├── next.config.mjs
│       ├── package.json
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── (dashboard)/
│       │   │   ├── layout.tsx
│       │   │   ├── layout-client.tsx
│       │   │   ├── dashboard/
│       │   │   ├── farmer-contrast/
│       │   │   ├── profile/
│       │   │   ├── sack-registration/
│       │   │   ├── tobacco-purchase/
│       │   │   └── tobacco-return/
│       │   ├── 2fa-verify/
│       │   ├── layout/
│       │   └── login/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       └── public/
└── packages/
    ├── ui/
    ├── eslint-config/
    └── typescript-config/
```

---

## Getting Started (Local)

Run the backend and frontend directly on your machine. For a containerized alternative, see [Docker (local Compose)](#docker-local-compose) below.

### Prerequisites

- Python 3.11+
- Node.js 20+ and npm
- MySQL 8+ running locally (or reachable at the host in `backend/.env`)

### 1. Clone

```bash
git clone <repo-url>
cd DigitLeaf
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\Activate.ps1
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# Create the database referenced by MYSQL_DB in .env, then run migrations
alembic upgrade head

# Optional: seed the initial 'limkhy' admin user
python -m scripts.seed

uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000` (docs at `http://localhost:8000/docs`). Adjust `backend/.env` for your local MySQL credentials before starting.

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`. It expects the API at the URL set in `frontend/.env` (`NEXT_PUBLIC_BACKEND_URL`, defaults to `http://localhost:8000/api/v1`).

---

## Docker (local Compose)

`docker-compose.yml` runs the **backend** and **frontend** in containers. **MySQL itself still runs on your host machine, not in a container** — the schema includes legacy tables that Alembic doesn't manage (see `backend/alembic/env.py`), so spinning up a throwaway MySQL container would give you an empty, incompatible database. Point `backend/.env` at your existing MySQL instance as usual; the backend container reaches it via `host.docker.internal`.

There is no image registry or CI/CD pipeline — this only builds images locally.

### Docker prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)
- MySQL running on your host, reachable from `backend/.env`, with the database already provisioned
- `backend/.env` and `frontend/.env` present (see local setup above)

### Run

```bash
docker compose up --build
```

- Backend: `http://localhost:8000` (docs at `/docs`), runs `alembic upgrade head` on startup before starting uvicorn
- Frontend: `http://localhost:3000`

Uploaded files are bind-mounted to `backend/uploads` so they persist across container restarts. Stop everything with `docker compose down`.
