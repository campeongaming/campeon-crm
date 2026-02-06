"""
Example of role-based access control in FastAPI endpoints.
This shows how to protect endpoints based on user roles and permissions.
"""

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.database import get_db
from database.models import User
from api.auth import verify_token
from services.rbac import Permission, has_permission


def get_current_user(token: str, db: Session = Depends(get_db)) -> User:
    """Get current authenticated user"""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    username = payload.get("username")
    user = db.query(User).filter(User.username == username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


def require_permission(permission: Permission):
    """
    Dependency to require a specific permission.

    Usage:
        @router.post("/api/bonus-templates")
        def create_bonus(
            data: BonusData,
            current_user: User = Depends(get_current_user),
            _: None = Depends(require_permission(Permission.CREATE_BONUS))
        ):
            # Only users with CREATE_BONUS permission can access this endpoint
            ...
    """
    async def check_permission(
        current_user: User = Depends(get_current_user)
    ):
        if not has_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission.value} required"
            )
        return None

    return check_permission


def require_role(*roles: str):
    """
    Dependency to require specific roles.

    Usage:
        @router.post("/auth/admin/create-user")
        def create_user(
            data: UserData,
            current_user: User = Depends(get_current_user),
            _: None = Depends(require_role("admin"))
        ):
            # Only admins can create users
            ...
    """
    async def check_role(
        current_user: User = Depends(get_current_user)
    ):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Admin access required. You are: {current_user.role}"
            )
        return None

    return check_role


"""
EXAMPLE ENDPOINT IMPLEMENTATIONS:
═════════════════════════════════════════════════════════════════

1. CREATE BONUS - Only CRM OPS and Admin
   ────────────────────────────────────────
   @router.post("/api/bonus-templates")
   def create_bonus(
       data: BonusTemplateCreate,
       current_user: User = Depends(get_current_user),
       _: None = Depends(require_permission(Permission.CREATE_BONUS))
   ):
       # Current user can be either "admin" or "CRM OPS"
       # Translation Team and Optimization Team cannot access this
       db_bonus = BonusTemplate(**data.dict())
       db.add(db_bonus)
       db.commit()
       return db_bonus

2. TRANSLATE BONUS - Only Translation Team and Admin
   ───────────────────────────────────────────────────
   @router.post("/api/bonus-templates/{id}/translate")
   def translate_bonus(
       bonus_id: str,
       translation_data: TranslationData,
       current_user: User = Depends(get_current_user),
       _: None = Depends(require_permission(Permission.SUBMIT_TRANSLATION))
   ):
       # Current user can be either "admin" or "Translation Team"
       bonus = db.query(BonusTemplate).filter(BonusTemplate.id == bonus_id).first()
       # ... update translation ...
       return bonus

3. ADMIN ONLY - Create New Users
   ──────────────────────────────
   @router.post("/auth/admin/create-user")
   def admin_create_user(
       user_data: UserRegister,
       current_user: User = Depends(get_current_user),
       _: None = Depends(require_role("admin"))
   ):
       # Only "admin" role can access
       new_user = User(**user_data.dict())
       db.add(new_user)
       db.commit()
       return new_user

4. RUN OPTIMIZATION - Only Optimization Team and Admin
   ───────────────────────────────────────────────────
   @router.post("/api/optimization/run")
   def run_optimization(
       params: OptimizationParams,
       current_user: User = Depends(get_current_user),
       _: None = Depends(require_permission(Permission.RUN_OPTIMIZATION))
   ):
       # Current user can be either "admin" or "Optimization Team"
       # ... run optimization logic ...
       return {"status": "completed"}

5. VIEW AUDIT LOG - Admin Only
   ─────────────────────────────
   @router.get("/api/audit-log")
   def view_audit_log(
       current_user: User = Depends(get_current_user),
       _: None = Depends(require_permission(Permission.VIEW_AUDIT_LOG))
   ):
       # Only admin can see audit log
       logs = db.query(AuditLog).all()
       return logs
"""

# ROLE PERMISSIONS QUICK REFERENCE
# ═════════════════════════════════

ROLE_PERMISSIONS_SUMMARY = """
ADMIN:
  ✓ Create bonuses
  ✓ Edit bonuses
  ✓ Delete bonuses
  ✓ Manage pricing tables
  ✓ Create users
  ✓ Manage users
  ✓ View audit log
  ✓ Translate bonuses
  ✓ View optimization
  ✓ Run optimization

CRM OPS:
  ✓ Create bonuses
  ✓ Edit bonuses
  ✓ Delete bonuses
  ✓ View bonuses
  ✗ Cannot manage pricing tables
  ✗ Cannot create users
  ✗ Cannot translate

TRANSLATION TEAM:
  ✓ Translate bonuses
  ✓ Submit translations
  ✓ View bonuses
  ✓ View translations
  ✗ Cannot create/edit bonuses
  ✗ Cannot optimize
  ✗ Cannot manage users

OPTIMIZATION TEAM:
  ✓ View bonuses
  ✓ View optimization
  ✓ Run optimization
  ✗ Cannot create/edit bonuses
  ✗ Cannot translate
  ✗ Cannot manage users
"""
