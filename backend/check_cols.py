from app.db.session import engine
from sqlalchemy import text

def check_columns():
    with engine.connect() as connection:
        res = connection.execute(text("DESCRIBE purchaser"))
        columns = [r[0] for r in res]
        print(f"Columns in purchaser: {columns}")

if __name__ == "__main__":
    check_columns()
