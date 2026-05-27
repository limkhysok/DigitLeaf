import pymysql

conn = pymysql.connect(
    host='127.0.0.1',
    user='root',
    password='limkhiMYSQL@@28',
    database='kaic_db'
)
cursor = conn.cursor()
cursor.execute('SHOW PROCESSLIST')
for p in cursor.fetchall():
    print(p)
conn.close()
