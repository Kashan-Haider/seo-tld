from db.database import engine, SessionLocal
from db.models import  User, Project
from sqlalchemy.orm import Session
from db.database import Base

def init_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    
    # Add test data
    db = SessionLocal()
    try:
        # Check if test user already exists
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            # Create test user
            test_user = User(
                email="test@example.com",
                username="testuser",
                hashed_password="hashed_password_here",  # In real app, hash this properly
                full_name="Test User",
                is_active=True
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"Created test user with ID: {test_user.id}")
        
        # Check if test project already exists
        test_project = db.query(Project).filter(Project.id == 1).first()
        if not test_project:
            # Create test project
            test_project = Project(
                id=1,  # Explicitly set ID to match the curl request
                name="Test Project",
                description="A test project for SEO audit",
                website_url="https://example.com",
                is_active=True,
                owner_id=test_user.id
            )
            db.add(test_project)
            db.commit()
            print(f"Created test project with ID: {test_project.id}")
        else:
            print(f"Test project with ID 1 already exists")
            
    except Exception as e:
        print(f"Error creating test data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db() 