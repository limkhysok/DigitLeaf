# Activate Env
# 1. .\venv\Scripts\Activate.ps1
# 2. uvicorn app.main:app --reload

# Docs
# http://[IP_ADDRESS]/docs

# Seed scripts (manual, not run automatically by alembic)
# python -m scripts.seed
#   - Creates the 'limkhy' admin user (access_type='all') if it doesn't already exist.
#   - Run against whichever DB your .env / DATABASE_URL currently points to.
