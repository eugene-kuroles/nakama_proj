"""
🔐 Authentication Router - Login, Register, Token Refresh
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
)
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
    get_current_active_user,
)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user.
    
    Only admins can create users with elevated roles.
    """
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )
    
    # Create new user
    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        name=user_data.name,
        role=user_data.role,
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """
    Login and get JWT tokens.
    
    Returns access_token and refresh_token.
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )
    
    # Create tokens
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Refresh access token using refresh token.
    """
    # Verify refresh token
    token_data = verify_token(refresh_token, "refresh")
    
    # Get user
    result = await db.execute(select(User).where(User.id == token_data.user_id))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    
    # Create new tokens
    new_token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
    }
    
    new_access_token = create_access_token(new_token_data)
    new_refresh_token = create_refresh_token(new_token_data)
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get current authenticated user info.
    """
    return current_user
