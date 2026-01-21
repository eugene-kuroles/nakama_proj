"""
Script to create an admin user for testing
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from app.database import async_session_maker
from app.models.user import User, UserRole
from app.core.security import get_password_hash


async def create_admin_user(
    email: str = "admin@spellit.ai",
    password: str = "admin123",
    name: str = "Admin User",
):
    """Create an admin user if not exists"""
    async with async_session_maker() as session:
        # Check if user exists
        result = await session.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()
        
        if existing:
            print(f"User {email} already exists")
            return
        
        # Create admin user
        admin = User(
            email=email,
            hashed_password=get_password_hash(password),
            name=name,
            role=UserRole.ADMIN,
            is_active=True,
        )
        
        session.add(admin)
        await session.commit()
        
        print(f"Created admin user: {email}")
        print(f"Password: {password}")
        print(f"Role: {admin.role.value}")


async def create_test_users():
    """Create test users for different roles"""
    test_users = [
        ("admin@spellit.ai", "admin123", "Admin User", UserRole.ADMIN),
        ("ceo@spellit.ai", "ceo123", "CEO User", UserRole.CEO),
        ("director@spellit.ai", "director123", "Sales Director", UserRole.SALES_DIRECTOR),
        ("rop@spellit.ai", "rop123", "ROP User", UserRole.ROP),
        ("manager@spellit.ai", "manager123", "Manager User", UserRole.MANAGER),
    ]
    
    async with async_session_maker() as session:
        for email, password, name, role in test_users:
            # Check if user exists
            result = await session.execute(select(User).where(User.email == email))
            existing = result.scalar_one_or_none()
            
            if existing:
                print(f"User {email} already exists, skipping...")
                continue
            
            user = User(
                email=email,
                hashed_password=get_password_hash(password),
                name=name,
                role=role,
                is_active=True,
            )
            
            session.add(user)
            print(f"Created user: {email} ({role.value})")
        
        await session.commit()
        print("\nAll test users created successfully!")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Create admin/test users")
    parser.add_argument("--all", action="store_true", help="Create all test users")
    parser.add_argument("--email", default="admin@spellit.ai", help="Admin email")
    parser.add_argument("--password", default="admin123", help="Admin password")
    parser.add_argument("--name", default="Admin User", help="Admin name")
    
    args = parser.parse_args()
    
    if args.all:
        asyncio.run(create_test_users())
    else:
        asyncio.run(create_admin_user(args.email, args.password, args.name))
