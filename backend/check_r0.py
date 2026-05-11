from app.db.session import engine
from sqlalchemy import text

def check_region_0():
    with engine.connect() as connection:
        res = connection.execute(text("SELECT * FROM region WHERE reg_id = 0"))
        data = res.first()
        print(f"Region 0: {data}")

if __name__ == "__main__":
    check_region_0()
