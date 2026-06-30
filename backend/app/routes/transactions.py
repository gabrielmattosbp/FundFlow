from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.database import supabase
from app.models.transaction import TransactionCreate, TransactionOut, TransactionList
from app.routes.deps import get_current_user

router = APIRouter(prefix="/transactions", tags=["transactions"])


class BulkImportRequest(BaseModel):
    transactions: list[TransactionCreate]


class BulkImportResponse(BaseModel):
    imported: int
    errors: list[dict]


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
        query = query.gte("date", f"{month}-01").lte("date", f"{month}-31")

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


@router.post("/bulk", response_model=BulkImportResponse)
def bulk_import(
    payload: BulkImportRequest,
    user_id: str = Depends(get_current_user),
):
    imported = 0
    errors: list[dict] = []

    acct = (
        supabase.table("accounts")
        .select("id")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not acct.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has no accounts. Create an account first.",
        )
    available_ids = {str(a["id"]) for a in acct.data}

    for tx in payload.transactions:
        try:
            if str(tx.account_id) not in available_ids:
                errors.append({
                    "description": tx.description,
                    "error": "Account not found or does not belong to user",
                })
                continue

            data = tx.model_dump()
            data["amount"] = float(data["amount"])
            data["date"] = str(data["date"])
            data["account_id"] = str(data["account_id"])
            supabase.table("transactions").insert({**data, "user_id": user_id}).execute()
            imported += 1
        except Exception as e:
            errors.append({
                "description": tx.description,
                "error": str(e),
            })

    return BulkImportResponse(imported=imported, errors=errors)


@router.delete("/all", status_code=status.HTTP_200_OK)
def delete_all_transactions(
    user_id: str = Depends(get_current_user),
):
    resp = (
        supabase.table("transactions")
        .delete()
        .eq("user_id", user_id)
        .execute()
    )
    return {"deleted": len(resp.data)}


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
