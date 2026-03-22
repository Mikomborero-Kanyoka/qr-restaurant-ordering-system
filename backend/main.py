import os
import shutil
import uuid
import qrcode
from io import BytesIO
import base64
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Response, File, UploadFile
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta

import models, schemas, database
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Mount uploads
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Auto-init admin for demo
@app.on_event("startup")
def startup_event():
    db = next(database.get_db())
    admin = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin:
        new_admin = models.User(
            username="admin",
            hashed_password="admin123",
            role=models.UserRole.ADMIN
        )
        db.add(new_admin)
        db.commit()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok"}

# JWT Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 600

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

def verify_password(plain_password, stored_password):
    return plain_password == stored_password

def get_password_hash(password):
    return password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

async def get_optional_user(token: str = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return db.query(models.User).filter(models.User.username == username).first()
    except:
        return None

def check_admin(user: models.User = Depends(get_current_user)):
    if user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def check_management(user: models.User = Depends(get_current_user)):
    if user.role not in [models.UserRole.ADMIN, models.UserRole.MANAGER, models.UserRole.SUPERVISOR]:
        raise HTTPException(status_code=403, detail="Management access required")
    return user

# Auth routes
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username, "role": user.role.value if hasattr(user.role, 'value') else user.role, "branch_id": user.branch_id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(check_management)):
    if current_user.role != models.UserRole.ADMIN:
        if current_user.branch_id != user.branch_id:
            raise HTTPException(status_code=403, detail="Cannot create users for other branches")
            
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        hashed_password=hashed_password,
        role=user.role,
        branch_id=user.branch_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users", response_model=List[schemas.User])
def list_users(db: Session = Depends(get_db), current_user: models.User = Depends(check_management)):
    if current_user.role == models.UserRole.ADMIN:
        return db.query(models.User).all()
    return db.query(models.User).filter(models.User.branch_id == current_user.branch_id).all()

@app.get("/roles")
def get_roles():
    return [role.value for role in models.UserRole]

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Simple file upload to uploads folder
    ext = file.filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join("uploads", filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"http://localhost:8000/uploads/{filename}"}

@app.post("/register/customer", response_model=schemas.User)
def register_customer(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = models.User(
        username=user.username,
        hashed_password=get_password_hash(user.password),
        role=models.UserRole.CUSTOMER,
        branch_id=None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Ensure role is returned as string value
    if hasattr(new_user.role, 'value'):
        new_user.role = new_user.role.value
        
    return new_user

@app.get("/my-orders", response_model=List[schemas.Order])
def get_my_orders(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Order).filter(models.Order.user_id == current_user.id).order_by(models.Order.created_at.desc()).all()

# Promo & Notification routes
@app.post("/promo-codes", response_model=schemas.PromoCode)
def create_promo(promo: schemas.PromoCodeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(check_management)):
    if current_user.role != models.UserRole.ADMIN:
        if promo.branch_id != current_user.branch_id:
            raise HTTPException(status_code=403, detail="Can only create promos for your own branch")
    
    db_promo = models.PromoCode(**promo.dict())
    db.add(db_promo)
    db.commit()
    db.refresh(db_promo)
    return db_promo

@app.post("/promo-campaign")
def create_promo_campaign(campaign: schemas.PromoCampaign, db: Session = Depends(get_db), current_user: models.User = Depends(check_management)):
    if current_user.role != models.UserRole.ADMIN:
        if campaign.branch_id != current_user.branch_id:
            raise HTTPException(status_code=403, detail="Can only launch campaigns for your own branch")
    
    for uid in campaign.user_ids:
        # Generate unique code for this user
        code = f"FD-{uuid.uuid4().hex[:6].upper()}"
        
        # Create promo code
        db_promo = models.PromoCode(
            code=code,
            discount_percent=campaign.discount_percent,
            user_id=uid,
            branch_id=campaign.branch_id,
            is_active=True
        )
        db.add(db_promo)
        
        # Create notification
        final_msg = campaign.message_template.replace('{CODE}', code).replace('{PERCENT}', str(campaign.discount_percent))
        new_notif = models.Notification(
            user_id=uid,
            title=campaign.title,
            message=final_msg
        )
        db.add(new_notif)
        
    db.commit()
    return {"message": f"Campaign launched for {len(campaign.user_ids)} users"}

@app.post("/notifications/bulk")
def send_bulk_notifications(user_ids: List[int], title: str, message: str, db: Session = Depends(get_db), current_user: models.User = Depends(check_management)):
    # Verify access - basic check for demo
    for uid in user_ids:
        new_notif = models.Notification(user_id=uid, title=title, message=message)
        db.add(new_notif)
    db.commit()
    return {"message": f"Notifications sent to {len(user_ids)} users"}

@app.get("/my-notifications", response_model=List[schemas.Notification])
def get_my_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Notification).filter(models.Notification.user_id == current_user.id).order_by(models.Notification.created_at.desc()).all()

@app.patch("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    notif = db.query(models.Notification).filter(models.Notification.id == notif_id, models.Notification.user_id == current_user.id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Marked as read"}

@app.get("/customers", response_model=List[schemas.User])
def list_customers(db: Session = Depends(get_db), current_user: models.User = Depends(check_management)):
    # Customers don't have a branch_id usually, so we list all for Admin, 
    # For Manager, we might list those who ordered from their branch
    if current_user.role == models.UserRole.ADMIN:
        return db.query(models.User).filter(models.User.role == models.UserRole.CUSTOMER).all()
    
    # Manager sees customers who have orders in their branch
    return db.query(models.User).join(models.Order).join(models.RestaurantTable).filter(
        models.User.role == models.UserRole.CUSTOMER,
        models.RestaurantTable.branch_id == current_user.branch_id
    ).distinct().all()

# Branch routes
@app.post("/branches", response_model=schemas.Branch)
def create_branch(branch: schemas.BranchCreate, db: Session = Depends(get_db), current_user: models.User = Depends(check_admin)):
    new_branch = models.Branch(**branch.dict())
    db.add(new_branch)
    db.commit()
    db.refresh(new_branch)
    return new_branch

@app.get("/branches", response_model=List[schemas.Branch])
def list_branches(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Branch).all()

@app.get("/branches/{branch_id}/users", response_model=List[schemas.User])
def list_branch_users(branch_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(check_management)):
    if current_user.role != models.UserRole.ADMIN:
        if current_user.branch_id != branch_id:
            raise HTTPException(status_code=403, detail="Cannot view users for other branches")
    return db.query(models.User).filter(models.User.branch_id == branch_id).all()

# Table and QR Generation
@app.post("/branches/{branch_id}/tables-bulk")
def create_tables_bulk(branch_id: int, count: int, db: Session = Depends(get_db), current_user: models.User = Depends(check_management)):
    if current_user.role != models.UserRole.ADMIN:
        if current_user.branch_id != branch_id:
            raise HTTPException(status_code=403, detail="Cannot manage tables for other branches")
    
    # Get highest table number
    max_table = db.query(models.RestaurantTable).filter(models.RestaurantTable.branch_id == branch_id).order_by(models.RestaurantTable.number.desc()).first()
    start_num = (max_table.number + 1) if max_table else 1
    
    created_tables = []
    for i in range(count):
        table_num = start_num + i
        new_table = models.RestaurantTable(number=table_num, branch_id=branch_id)
        db.add(new_table)
        db.commit()
        db.refresh(new_table)
        
        qr_data = f"http://localhost:5173/table/{new_table.id}"
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        qr_base64 = base64.b64encode(buffered.getvalue()).decode()
        new_table.qr_code_path = f"data:image/png;base64,{qr_base64}"
        db.commit()
        db.refresh(new_table)
        created_tables.append(new_table)
        
    return created_tables

@app.delete("/branches/{branch_id}/tables/{table_id}")
def delete_table(branch_id: int, table_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(check_management)):
    if current_user.role != models.UserRole.ADMIN:
        if current_user.branch_id != branch_id:
            raise HTTPException(status_code=403, detail="Cannot manage tables for other branches")
            
    table = db.query(models.RestaurantTable).filter(models.RestaurantTable.id == table_id, models.RestaurantTable.branch_id == branch_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
        
    db.delete(table)
    db.commit()
    return {"message": "Table deleted"}

@app.post("/branches/{branch_id}/tables", response_model=schemas.Table)
def create_table(branch_id: int, table_num: int, db: Session = Depends(get_db), current_user: models.User = Depends(check_management)):
    if current_user.role != models.UserRole.ADMIN:
        if current_user.branch_id != branch_id:
            raise HTTPException(status_code=403, detail="Cannot manage tables for other branches")
    
    # Simple table creation with QR data
    new_table = models.RestaurantTable(number=table_num, branch_id=branch_id)
    db.add(new_table)
    db.commit()
    db.refresh(new_table)
    
    # Store table info in QR - frontend URL like http://localhost:5173/table/{table_id}
    qr_data = f"http://localhost:5173/table/{new_table.id}"
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode()
    
    new_table.qr_code_path = f"data:image/png;base64,{qr_base64}"
    db.commit()
    db.refresh(new_table)
    return new_table

@app.get("/branches/{branch_id}/tables", response_model=List[schemas.Table])
def list_branch_tables(branch_id: int, db: Session = Depends(get_db)):
    return db.query(models.RestaurantTable).filter(models.RestaurantTable.branch_id == branch_id).all()

# Get single table (for QR scanner)
@app.get("/tables/{table_id}", response_model=schemas.Table)
def get_table(table_id: int, db: Session = Depends(get_db)):
    table = db.query(models.RestaurantTable).filter(models.RestaurantTable.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return table

# Menu management
@app.post("/branches/{branch_id}/menu", response_model=schemas.MenuItem)
def create_menu_item(branch_id: int, item: schemas.MenuItemCreate, db: Session = Depends(get_db), current_user: models.User = Depends(check_management)):
    if current_user.role != models.UserRole.ADMIN:
        if current_user.branch_id != branch_id:
            raise HTTPException(status_code=403, detail="Cannot manage menu for other branches")
            
    new_item = models.MenuItem(**item.dict())
    new_item.branch_id = branch_id
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@app.get("/branches/{branch_id}/menu", response_model=List[schemas.MenuItem])
def list_menu(branch_id: int, db: Session = Depends(get_db)):
    return db.query(models.MenuItem).filter(models.MenuItem.branch_id == branch_id, models.MenuItem.is_available == True).all()

@app.patch("/menu/{item_id}/availability")
def update_item_availability(item_id: int, is_available: bool, db: Session = Depends(get_db), current_user: models.User = Depends(check_management)):
    item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if current_user.role != models.UserRole.ADMIN:
        if current_user.branch_id != item.branch_id:
            raise HTTPException(status_code=403, detail="Cannot manage menu for other branches")
            
    item.is_available = is_available
    db.commit()
    return {"message": "Updated successfully"}

# Orders and Ecocash simulation
@app.post("/orders", response_model=schemas.Order)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db), current_user: Optional[models.User] = Depends(get_optional_user)):
    db_order = models.Order(
        table_id=order.table_id, 
        total_amount=0,
        user_id=current_user.id if current_user else None
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    total = 0
    for item in order.items:
        menu_item = db.query(models.MenuItem).filter(models.MenuItem.id == item.menu_item_id).first()
        if not menu_item:
            continue
        order_item = models.OrderItem(
            order_id=db_order.id,
            menu_item_id=item.menu_item_id,
            quantity=item.quantity,
            price_at_order=menu_item.price
        )
        total += menu_item.price * item.quantity
        db.add(order_item)
    
    # Apply promo discount if valid
    discount = 0
    if order.promo_code:
        promo = db.query(models.PromoCode).filter(models.PromoCode.code == order.promo_code, models.PromoCode.is_active == True).first()
        if promo:
            # Check user eligibility
            if promo.user_id and (not current_user or promo.user_id != current_user.id):
                pass # Not for this user
            else:
                # Check branch eligibility
                table = db.query(models.RestaurantTable).filter(models.RestaurantTable.id == order.table_id).first()
                if promo.branch_id and table and promo.branch_id != table.branch_id:
                    pass # Not for this branch
                else:
                    discount = (total * promo.discount_percent) / 100
                    total -= discount
                    db_order.promo_code = promo.code
                    db_order.discount_amount = discount

    db_order.total_amount = total
    db.commit()
    db.refresh(db_order)
    return db_order

@app.get("/branches/{branch_id}/orders", response_model=List[schemas.Order])
def list_branch_orders(branch_id: int, db: Session = Depends(get_db)):
    return db.query(models.Order).join(models.RestaurantTable).filter(models.RestaurantTable.branch_id == branch_id).all()

@app.patch("/orders/{order_id}/status")
def update_order_status(order_id: int, status: models.OrderStatus, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if current_user.role != models.UserRole.ADMIN:
        # Check branch through table
        if current_user.branch_id != order.table.branch_id:
            raise HTTPException(status_code=403, detail="Cannot manage orders for other branches")
            
    order.status = status
    db.commit()
    return {"message": "Status updated"}

@app.post("/orders/{order_id}/pay")
def pay_order(order_id: int, payment_code: str, db: Session = Depends(get_db)):
    # Ecocash simulation - any code entered for demo works
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.payment_code = payment_code
    order.is_paid = True
    # We don't mark as COMPLETED yet, kitchen needs to prepare it
    # Generate Receipt QR for the waiter to scan later
    qr_data = f"ORDER_RECEIPT:{order.id}"
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode()
    order.receipt_qr = f"data:image/png;base64,{qr_base64}"
    
    db.commit()
    db.refresh(order)
    return order

@app.post("/orders/scan-complete")
def complete_order_by_qr(qr_code: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not qr_code.startswith("ORDER_RECEIPT:"):
        raise HTTPException(status_code=400, detail="Invalid QR code format")
    
    order_id = int(qr_code.split(":")[1])
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if not order.is_paid:
        raise HTTPException(status_code=400, detail="Order has not been paid")
        
    if order.status not in [models.OrderStatus.PREPARING, models.OrderStatus.SERVED]:
        raise HTTPException(status_code=400, detail=f"Order is in {order.status} state, cannot be served now")

    if current_user.role != models.UserRole.ADMIN and current_user.branch_id != order.table.branch_id:
        raise HTTPException(status_code=403, detail="Not authorized for this branch")

    order.status = models.OrderStatus.COMPLETED
    db.commit()
    return {"message": "Order successfully served and completed", "order_id": order.id}
