import sqlite3
import os

def run_migration():
    db_path = os.path.join(os.path.dirname(__file__), 'foodapp.db')
    print(f"Connecting to: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Running migrations...")

    # 1. Add columns to orders table
    try:
        cursor.execute("ALTER TABLE orders ADD COLUMN promo_code TEXT")
        print("Added promo_code column to orders")
    except sqlite3.OperationalError:
        print("promo_code column already exists or table doesn't exist")

    try:
        cursor.execute("ALTER TABLE orders ADD COLUMN discount_amount REAL DEFAULT 0")
        print("Added discount_amount column to orders")
    except sqlite3.OperationalError:
        print("discount_amount column already exists")

    # 2. Create new tables (though create_all handles this, we do it here to be safe)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS promo_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE,
            discount_percent REAL,
            is_active BOOLEAN,
            user_id INTEGER,
            branch_id INTEGER,
            created_at DATETIME,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(branch_id) REFERENCES branches(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT,
            message TEXT,
            is_read BOOLEAN,
            created_at DATETIME,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    run_migration()
