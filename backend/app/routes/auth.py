from fastapi import APIRouter, HTTPException, status

from app.database import supabase
from app.models.user import UserCreate, UserLogin, UserOut, TokenOut
from app.services.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate):
    """Create a new user account and return a JWT."""
    existing = (
        supabase.table("users")
        .select("id")
        .eq("email", payload.email)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    hashed = hash_password(payload.password)
    resp = (
        supabase.table("users")
        .insert({
            "email": payload.email,
            "name": payload.name,
            "password": hashed,
        })
        .execute()
    )
    user = resp.data[0]
    token = create_access_token(user["id"])

    return TokenOut(
        access_token=token,
        user=UserOut(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"],
        ),
    )


@router.post("/login", response_model=TokenOut)
def login(payload: UserLogin):
    """Authenticate with email + password and get a JWT."""
    resp = (
        supabase.table("users")
        .select("*")
        .eq("email", payload.email)
        .single()
        .execute()
    )
    user = resp.data
    if not user or not verify_password(payload.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user["id"])

    return TokenOut(
        access_token=token,
        user=UserOut(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"],
        ),
    )
