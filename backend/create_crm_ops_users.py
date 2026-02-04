"""
Create CRM OPS team user accounts
"""
from database.database import get_db
from database.models import User
import hashlib


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


# CRM OPS team members with temporary passwords
users_to_create = [
    {"username": "giorgos.sakellaris", "password": "TempPass123!", "role": "CRM OPS"},
    {"username": "athina.kontostathi", "password": "TempPass123!", "role": "CRM OPS"},
    {"username": "katerina.bakira", "password": "TempPass123!", "role": "CRM OPS"},
    {"username": "tilemachos.veletis", "password": "TempPass123!", "role": "CRM OPS"},
    {"username": "dimitris.katsianis", "password": "TempPass123!", "role": "CRM OPS"},
]

db = next(get_db())

print("=" * 60)
print("Creating CRM OPS Team Accounts")
print("=" * 60)
print()

for user_data in users_to_create:
    # Check if user already exists
    existing = db.query(User).filter(
        User.username == user_data["username"]).first()

    if existing:
        print(f"⚠️  User {user_data['username']} already exists - skipping")
        continue

    # Create new user
    new_user = User(
        username=user_data["username"],
        password_hash=hash_password(user_data["password"]),
        role=user_data["role"],
        is_active=True
    )

    db.add(new_user)
    print(f"✅ Created: {user_data['username']}")
    print(f"   Role: {user_data['role']}")
    print(f"   Temp Password: {user_data['password']}")
    print()

db.commit()

print("=" * 60)
print("🎉 All accounts created successfully!")
print("=" * 60)
print()
print("📝 IMPORTANT: All users have the same temporary password: TempPass123!")
print("   Users should change their password on first login.")
print()
print("🔑 Summary:")
for user_data in users_to_create:
    print(f"   • {user_data['username']} → TempPass123!")
