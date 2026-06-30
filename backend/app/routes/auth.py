from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from app.database import supabase
from app.models.password_reset import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
)
from app.models.user import UserCreate, UserLogin, UserOut, TokenOut
from app.services.auth import (
    create_access_token,
    generate_reset_token,
    get_reset_token_expiry,
    hash_password,
    verify_password,
)
from app.services.email import send_reset_email

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


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest):
    """Request a password reset token. Emails the token if SMTP is configured."""
    resp = (
        supabase.table("users")
        .select("id, email")
        .eq("email", payload.email)
        .single()
        .execute()
    )
    user = resp.data
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No user found with this email",
        )

    token = generate_reset_token()
    expires_at = get_reset_token_expiry()

    supabase.table("password_reset_tokens").insert({
        "user_id": user["id"],
        "token": token,
        "expires_at": expires_at.isoformat(),
        "used": False,
    }).execute()

    sent = send_reset_email(user["email"], token)

    if sent:
        return ForgotPasswordResponse(
            message="A password reset link has been sent to your email.",
        )
    else:
        return ForgotPasswordResponse(
            message="Password reset token generated (email unavailable — token shown below)",
            reset_token=token,
        )


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest):
    """Reset the password using a valid reset token."""
    token_resp = (
        supabase.table("password_reset_tokens")
        .select("*")
        .eq("token", payload.token)
        .eq("used", False)
        .single()
        .execute()
    )
    token_data = token_resp.data
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or already used reset token",
        )

    expires = datetime.fromisoformat(token_data["expires_at"].replace("Z", "+00:00"))
    if expires < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired",
        )

    user_resp = (
        supabase.table("users")
        .select("id, email")
        .eq("id", token_data["user_id"])
        .single()
        .execute()
    )
    user = user_resp.data
    if not user or user["email"] != payload.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email does not match the reset request",
        )

    hashed = hash_password(payload.new_password)
    supabase.table("users").update({"password": hashed}).eq("id", user["id"]).execute()
    supabase.table("password_reset_tokens").update({"used": True}).eq("id", token_data["id"]).execute()

    return {"message": "Password reset successfully"}
