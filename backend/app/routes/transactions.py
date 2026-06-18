from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import supabase
from app.models.transaction import TransactionCreate, TransactionOut, TransactionList
from app.routes.deps import get_current_user

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/", response_model=TransactionList)
def list_transactions(
    user_id: str = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    account_id: UUID | None = None,
    month: str | None = None,  # "2026-06"
):
    query = (
        supabase.table("transactions")
        .select("*")
        .eq("user_id", user_id)
        .order("date", desc=True)
    )

    if account_id:
        query = query.eq("account_id", str(account_id))
    if month:
        query = query.gte("date", f"{month}-01")

    offset = (page - 1) * per_page
    resp = query.range(offset, offset + per_page - 1).execute()

    return TransactionList(transactions=resp.data, total=len(resp.data))


@router.post("/", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    user_id: str = Depends(get_current_user),
):
    """Manually create a transaction (for CSV import or manual entry)."""

    acct = (
        supabase.table("accounts")
        .select("id")
        .eq("id", str(payload.account_id))
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not acct.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found or does not belong to user",
        )

    data = payload.model_dump()
    data["amount"] = float(data["amount"])
    data["date"] = str(data["date"])
    data["account_id"] = str(data["account_id"])
    resp = (
        supabase.table("transactions")
        .insert({**data, "user_id": user_id})
        .execute()
    )
    return resp.data[0]


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: UUID,
    user_id: str = Depends(get_current_user),
):
    resp = (
        supabase.table("transactions")
        .delete()
        .eq("id", str(transaction_id))
        .eq("user_id", user_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
