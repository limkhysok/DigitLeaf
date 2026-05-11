from app.db.session import engine
from sqlalchemy import text

def check_data():
    with engine.connect() as connection:
        res = connection.execute(text("SELECT p_id, p_name, region FROM purchaser WHERE region IS NOT NULL AND region != 0 LIMIT 10"))
        data = [dict(r._mapping) for r in res]
        print(f"Purchasers with regions: {data}")

if __name__ == "__main__":
    check_data()
