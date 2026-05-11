from app.db.session import engine
from sqlalchemy import text

def check_regions():
    with engine.connect() as connection:
        res = connection.execute(text("SELECT do_not_show, COUNT(*) as count FROM region GROUP BY do_not_show"))
        data = [dict(r._mapping) for r in res]
        print(f"Region counts: {data}")

if __name__ == "__main__":
    check_regions()
