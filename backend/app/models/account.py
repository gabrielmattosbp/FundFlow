from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class AccountBase(BaseModel):
    institution: str
    account_type: str = "checking"
    currency: str = "EUR"
    balance: Decimal = Decimal("0.00")


class AccountCreate(AccountBase):
    pass


class AccountOut(AccountBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class AccountList(BaseModel):
    accounts: list[AccountOut]
    total: int
