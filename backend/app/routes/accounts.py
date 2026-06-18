from fastapi import APIRouter, Depends, HTTPException, status

from app.database import supabase
from app.models.account import AccountCreate, AccountOut, AccountList
from app.routes.deps import get_current_user

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("/", response_model=AccountList)
def list_accounts(user_id: str = Depends(get_current_user)):
    resp = (
        supabase.table("accounts")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return AccountList(accounts=resp.data, total=len(resp.data))


@router.post("/", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
def create_account(
    payload: AccountCreate,
    user_id: str = Depends(get_current_user),
):
    data = payload.model_dump()
    data["balance"] = float(data["balance"])
    resp = (
        supabase.table("accounts")
        .insert({**data, "user_id": user_id})
        .execute()
    )
    return resp.data[0]



