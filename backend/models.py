from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, Enum, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    SUPERVISOR = "supervisor"
    WAITER = "waiter"
    KITCHEN = "kitchen"
    STAFF = "staff"
    CUSTOMER = "customer"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole))
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    
    branch = relationship("Branch", back_populates="employees")
    orders = relationship("Order", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class Branch(Base):
    __tablename__ = "branches"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String)
    
    employees = relationship("User", back_populates="branch")
    tables = relationship("RestaurantTable", back_populates="branch")
    menu_items = relationship("MenuItem", back_populates="branch")

class RestaurantTable(Base):
    __tablename__ = "tables"
    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer)
    branch_id = Column(Integer, ForeignKey("branches.id"))
    qr_code_path = Column(String, nullable=True) # To store local file path or identifier
    
    branch = relationship("Branch", back_populates="tables")
    orders = relationship("Order", back_populates="table")

class MenuItem(Base):
    __tablename__ = "menu_items"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    image_url = Column(String, nullable=True)
    is_available = Column(Boolean, default=True)
    branch_id = Column(Integer, ForeignKey("branches.id"))
    
    branch = relationship("Branch", back_populates="menu_items")

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PREPARING = "preparing"
    SERVED = "served"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("tables.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # For customer history
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    total_amount = Column(Float)
    payment_code = Column(String, nullable=True) # Ecocash simulation code
    receipt_qr = Column(String, nullable=True) # New: Receipt QR code for traceability
    promo_code = Column(String, nullable=True) # Track which promo was used
    discount_amount = Column(Float, default=0) # Track the discount given
    is_paid = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    table = relationship("RestaurantTable", back_populates="orders")
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"))
    quantity = Column(Integer)
    price_at_order = Column(Float)
    
    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem")

class PromoCode(Base):
    __tablename__ = "promo_codes"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    discount_percent = Column(Float)
    is_active = Column(Boolean, default=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # If null, it's a general code
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True) # Valid only for this branch
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    message = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")
