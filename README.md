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

**Stack:** Python · FastAPI · SQLAlchemy · Alembic · PostgreSQL

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
cd backend
python -m scripts.seed

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
