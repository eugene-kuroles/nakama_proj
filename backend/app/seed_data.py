"""
Seed script to populate database with test data from Excel file.

Run: python -m app.seed_data
"""
import asyncio
import os
import sys
from pathlib import Path

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.database import async_session_maker, init_db
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.manager import Manager
from app.models.criteria import CriteriaGroup, Criteria, ScoreType
from app.models.call import Call, CallScore, CallGroupAverage
from app.core.security import get_password_hash
from app.integrations.excel.parser import parse_excel_file


# Test users configuration
TEST_USERS = [
    {
        "email": "testceo@spellit.ai",
        "password": "ceo123",
        "name": "Тестовый CEO",
        "role": UserRole.CEO,
    },
    {
        "email": "testrop@spellit.ai", 
        "password": "rop123",
        "name": "Тестовый РОП",
        "role": UserRole.ROP,
    },
    {
        "email": "admin@spellit.ai",
        "password": "admin123",
        "name": "Администратор",
        "role": UserRole.ADMIN,
    },
]


async def create_test_users(session):
    """Create test users"""
    print("Creating test users...")
    
    created_users = []
    for user_data in TEST_USERS:
        # Check if user exists
        result = await session.execute(
            select(User).where(User.email == user_data["email"])
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            print(f"  User {user_data['email']} already exists")
            created_users.append(existing)
            continue
        
        user = User(
            email=user_data["email"],
            hashed_password=get_password_hash(user_data["password"]),
            name=user_data["name"],
            role=user_data["role"],
            project_id=1,  # Will be updated after project creation
        )
        session.add(user)
        created_users.append(user)
        print(f"  Created user: {user_data['email']} ({user_data['role'].value})")
    
    await session.flush()
    return created_users


async def create_manager_users(session, managers: list, project_id: int):
    """Create user accounts for each manager"""
    print("Creating manager users...")
    
    created_count = 0
    for idx, manager in enumerate(managers):
        email = f"testman{idx if idx > 0 else ''}@spellit.ai"
        password = f"man{idx if idx > 0 else ''}123" if idx > 0 else "man123"
        
        # Check if exists
        result = await session.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()
        
        if existing:
            # Update manager_id and project_id if not set
            if not existing.manager_id:
                existing.manager_id = manager.id
                existing.project_id = project_id
            print(f"  User {email} already exists (updated links)")
            continue
        
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            name=manager.name,
            role=UserRole.MANAGER,
            manager_id=manager.id,
            project_id=project_id,
        )
        session.add(user)
        created_count += 1
        print(f"  Created manager user: {email} / {password} → {manager.name}")
    
    await session.flush()
    return created_count


async def import_excel_data(session, excel_path: str):
    """Import data from Excel file"""
    print(f"Parsing Excel file: {excel_path}")
    
    groups, criteria_list, calls, parsed_managers = parse_excel_file(excel_path)
    
    print(f"  Found {len(groups)} criteria groups")
    print(f"  Found {len(criteria_list)} criteria")
    print(f"  Found {len(calls)} calls")
    print(f"  Found {len(parsed_managers)} managers")
    
    # Create or get project
    result = await session.execute(
        select(Project).where(Project.name == "Госники")
    )
    project = result.scalar_one_or_none()
    
    if not project:
        project = Project(
            name="Госники",
            client_name="Тестовый клиент (Госники)",
        )
        session.add(project)
        await session.flush()
        print(f"  Created project: {project.name} (ID: {project.id})")
    else:
        print(f"  Using existing project: {project.name} (ID: {project.id})")
    
    # Create criteria groups
    group_map = {}  # group_name -> CriteriaGroup
    for idx, g in enumerate(groups):
        result = await session.execute(
            select(CriteriaGroup).where(
                CriteriaGroup.project_id == project.id,
                CriteriaGroup.name == g.name
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            group_map[g.name] = existing
        else:
            group = CriteriaGroup(
                project_id=project.id,
                name=g.name,
                order=idx,
            )
            session.add(group)
            group_map[g.name] = group
    
    await session.flush()
    print(f"  Created/loaded {len(group_map)} criteria groups")
    
    # Create criteria
    criteria_map = {}  # criteria_number -> Criteria
    for idx, c in enumerate(criteria_list):
        group = group_map.get(c.group_name)
        if not group:
            continue
        
        result = await session.execute(
            select(Criteria).where(
                Criteria.group_id == group.id,
                Criteria.number == c.number
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            criteria_map[c.number] = existing
        else:
            score_type = ScoreType.NUMERIC
            if c.score_type == "tag":
                score_type = ScoreType.TAG
            elif c.score_type == "recommendation":
                score_type = ScoreType.RECOMMENDATION
            
            criteria = Criteria(
                group_id=group.id,
                number=c.number,
                name=c.name,
                prompt=c.prompt,
                in_final_score=c.in_final_score,
                score_type=score_type,
                order=idx,
            )
            session.add(criteria)
            criteria_map[c.number] = criteria
    
    await session.flush()
    print(f"  Created/loaded {len(criteria_map)} criteria")
    
    # Create managers from parsed data
    manager_map = {}  # manager_external_id -> Manager
    
    for pm in parsed_managers:
        if not pm.name or pm.name == "Unknown":
            continue
        
        result = await session.execute(
            select(Manager).where(
                Manager.project_id == project.id,
                Manager.external_id == pm.external_id
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            manager_map[pm.external_id] = existing
        else:
            manager = Manager(
                project_id=project.id,
                external_id=pm.external_id,
                name=pm.name,
            )
            session.add(manager)
            manager_map[pm.external_id] = manager
    
    await session.flush()
    print(f"  Created/loaded {len(manager_map)} managers")
    
    # Create manager user accounts
    await create_manager_users(session, list(manager_map.values()), project.id)
    
    # Create calls and scores
    calls_created = 0
    for parsed_call in calls:
        # Check if call exists
        result = await session.execute(
            select(Call).where(
                Call.project_id == project.id,
                Call.external_id == parsed_call.external_id
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            continue
        
        manager = manager_map.get(parsed_call.manager_external_id)
        
        call = Call(
            project_id=project.id,
            manager_id=manager.id if manager else None,
            external_id=parsed_call.external_id,
            call_date=parsed_call.call_date,
            call_week=parsed_call.call_week,
            duration_seconds=parsed_call.duration_seconds,
            final_percent=parsed_call.final_percent,
            extra_data=parsed_call.metadata if parsed_call.metadata else None,  # CRM data
        )
        session.add(call)
        await session.flush()
        
        # Add scores
        for score in parsed_call.scores:
            criteria = criteria_map.get(score.criteria_number)
            if not criteria:
                continue
            
            call_score = CallScore(
                call_id=call.id,
                criteria_id=criteria.id,
                score=score.score,
                reason=score.reason,
                quote=score.quote,
            )
            session.add(call_score)
        
        calls_created += 1
    
    await session.commit()
    print(f"  Created {calls_created} calls with scores")
    
    return project, list(manager_map.values())


async def main():
    """Main seed function"""
    print("=" * 60)
    print("Spellit Analytics - Database Seed")
    print("=" * 60)
    
    # Initialize database
    await init_db()
    print("Database initialized")
    
    async with async_session_maker() as session:
        # Create test users
        await create_test_users(session)
        await session.commit()
        
        # Find Excel file - prefer new file with more data
        excel_paths = [
            "Docs/TS Spellit Отчет 4_ Госники (от 26.09.25).xlsx",  # New file (1112 calls)
            "../Docs/TS Spellit Отчет 4_ Госники (от 26.09.25).xlsx",
            "Docs/TEST ПРОМТ 3 Spellit Отчет 4_ Госники (от 26.09.25).xlsx",  # Old file (822 calls)
            "../Docs/TEST ПРОМТ 3 Spellit Отчет 4_ Госники (от 26.09.25).xlsx",
        ]
        
        excel_path = None
        for path in excel_paths:
            if os.path.exists(path):
                excel_path = path
                break
        
        if not excel_path:
            print("ERROR: Excel file not found!")
            print("Looked in:", excel_paths)
            return
        
        # Import Excel data
        project, managers = await import_excel_data(session, excel_path)
        
        print()
        print("=" * 60)
        print("SEED COMPLETED!")
        print("=" * 60)
        print()
        print("Test credentials:")
        print("  CEO:     testceo@spellit.ai / ceo123")
        print("  РОП:     testrop@spellit.ai / rop123")
        print("  Admin:   admin@spellit.ai / admin123")
        print()
        print("Manager credentials:")
        for idx, manager in enumerate(managers[:5]):
            email = f"testman{idx if idx > 0 else ''}@spellit.ai"
            password = f"man{idx if idx > 0 else ''}123" if idx > 0 else "man123"
            print(f"  {manager.name}: {email} / {password}")
        if len(managers) > 5:
            print(f"  ... and {len(managers) - 5} more managers")


if __name__ == "__main__":
    asyncio.run(main())
