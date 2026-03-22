from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from models import UserRole, OrderStatus

class UserBase(BaseModel):
    username: str
    role: UserRole
    branch_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

class BranchBase(BaseModel):
    name: str
    address: str

class BranchCreate(BranchBase):
    pass

class Branch(BranchBase):
    id: int
    class Config:
        from_attributes = True

class TableBase(BaseModel):
    number: int
    branch_id: int

class TableCreate(TableBase):
    pass

class Table(TableBase):
    id: int
    qr_code_path: Optional[str] = None
    class Config:
        from_attributes = True

class MenuItemBase(BaseModel):
    name: str
    description: str
    price: float
    image_url: Optional[str] = None
    is_available: bool = True
    branch_id: int

class MenuItemCreate(MenuItemBase):
    pass

class MenuItem(MenuItemBase):
    id: int
    image_url: Optional[str] = None
    class Config:
        from_attributes = True

class OrderItemBase(BaseModel):
    menu_item_id: int
    quantity: int

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    price_at_order: float
    menu_item: Optional[MenuItem] = None
    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    table_id: int
    total_amount: float

class OrderCreate(BaseModel):
    table_id: int
    items: List[OrderItemCreate]
    promo_code: Optional[str] = None

class Order(OrderBase):
    id: int
    user_id: Optional[int] = None
    status: OrderStatus
    is_paid: bool
    receipt_qr: Optional[str] = None
    promo_code: Optional[str] = None
    discount_amount: float = 0
    created_at: datetime
    items: List[OrderItem]
    class Config:
        from_attributes = True

class NotificationBase(BaseModel):
    title: str
    message: str

class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime
    class Config:
        from_attributes = True

class PromoCodeBase(BaseModel):
    code: str
    discount_percent: float
    is_active: bool = True
    user_id: Optional[int] = None
    branch_id: Optional[int] = None

class PromoCodeCreate(PromoCodeBase):
    pass

class PromoCode(PromoCodeBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class PromoCampaign(BaseModel):
    user_ids: List[int]
    discount_percent: float
    title: str
    message_template: str
    branch_id: Optional[int] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
