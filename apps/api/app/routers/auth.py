from fastapi import APIRouter, HTTPException, status, Depends, Response, Request
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone

from app.core.auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    get_current_user,
)
from app.models.user import User

router = APIRouter()


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    displayName: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    user: dict


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, response: Response):
    # Check uniqueness
    if await User.find_one(User.username == data.username.lower()):
        raise HTTPException(400, "Username already taken")
    if await User.find_one(User.email == data.email.lower()):
        raise HTTPException(400, "Email already registered")

    user = User(
        username=data.username.lower(),
        email=data.email.lower(),
        display_name=data.displayName,
        hashed_password=hash_password(data.password),
    )
    await user.insert()

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    # Refresh token as httpOnly cookie (no localStorage)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 30,
        path="/v1/auth",
    )

    return TokenResponse(access_token=access_token, user=user.to_public_dict())


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, response: Response):
    user = await User.find_one(User.email == data.email.lower())
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    if user.is_banned:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account suspended")

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 30,
        path="/v1/auth",
    )

    return TokenResponse(access_token=access_token, user=user.to_public_dict())


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No refresh token")
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token type")
    user = await User.get(payload["sub"])
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    access_token = create_access_token(str(user.id))
    return {"access_token": access_token}


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return user.to_public_dict()


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token", path="/v1/auth")
    return {"detail": "Logged out"}
