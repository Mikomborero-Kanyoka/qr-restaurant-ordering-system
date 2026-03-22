from database import engine, SessionLocal
import models
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_db():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if admin exists
    admin = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin:
        hashed_password = pwd_context.hash("admin123")
        new_admin = models.User(
            username="admin",
            hashed_password=hashed_password,
            role=models.UserRole.ADMIN
        )
        db.add(new_admin)
        
        # Add sample branch
        sample_branch = models.Branch(name="Main Branch", address="123 Food Street")
        db.add(sample_branch)
        db.commit()
        print("Database initialized with admin:admin123 and 'Main Branch'")
    
    db.close()

if __name__ == "__main__":
    init_db()
