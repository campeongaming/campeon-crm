"""
Create admin user directly in database
"""
from database.database import get_db
from database.models import User
import hashlib


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


db = next(get_db())

# Check if user already exists
existing = db.query(User).filter(User.username == "giorgos.korifidis").first()

if existing:
    print("⚠️  User giorgos.korifidis already exists")
else:
    # Create admin user
    admin_user = User(
        username="giorgos.korifidis",
        password_hash=hash_password("12345678"),
        role="admin",
        is_active=True
    )

    db.add(admin_user)
    db.commit()

    print("✅ Admin user created successfully!")
    print("   Username: giorgos.korifidis")
    print("   Password: 12345678")
    print("   Role: admin")
