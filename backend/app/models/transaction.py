from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class TransactionBase(BaseModel):
    description: str
    amount: Decimal
    type: str  # "income" | "expense"
    category: str = "other"
    date: date
    currency: str = "EUR"
    bank_reference: str | None = None
    is_subscription: bool = False


class TransactionCreate(TransactionBase):
    account_id: UUID


class TransactionOut(TransactionBase):
    id: UUID
    account_id: UUID
    user_id: UUID
    created_at: datetime


class TransactionList(BaseModel):
    transactions: list[TransactionOut]
    total: int
