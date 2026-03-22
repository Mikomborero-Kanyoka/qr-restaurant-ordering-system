import sqlite3
import os

db_path = 'backend/foodapp.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute('PRAGMA table_info(orders)')
columns = [row[1] for row in cursor.fetchall()]
print(f"Columns in 'orders' table: {columns}")
conn.close()
