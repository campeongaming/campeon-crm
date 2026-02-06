═══════════════════════════════════════════════════════════════════════════════
                      USER ROLES & PERMISSIONS SETUP
═══════════════════════════════════════════════════════════════════════════════

OVERVIEW
════════

CAMPEON CRM now supports 4 user roles with different permissions and privilege levels:

1. ADMIN                 - Full system access
2. CRM OPS              - Create and manage bonuses
3. TRANSLATION TEAM     - Translate bonus content
4. OPTIMIZATION TEAM    - Optimize bonus configurations

═══════════════════════════════════════════════════════════════════════════════
                           SETUP INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

STEP 1: Run Database Migration
──────────────────────────────

If you're using PostgreSQL (external database), run the migration script:

   cd backend
   python migrate_fix_user_roles.py

This script will:
  ✓ Drop old PostgreSQL enum constraints
  ✓ Expand role column to varchar(100)
  ✓ Add new role validation

For SQLite (local development), no migration is needed.

STEP 2: Restart Backend
───────────────────────

After migration, restart your backend:

   # Stop current backend (Ctrl+C)
   # Then restart:
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

═══════════════════════════════════════════════════════════════════════════════
                      SUPPORTED ROLES & PERMISSIONS
═══════════════════════════════════════════════════════════════════════════════

ADMIN
─────
Full system access. Can:
  ✓ Create, edit, delete bonuses
  ✓ Manage pricing tables
  ✓ Create and manage users
  ✓ View all translations
  ✓ Translate bonuses
  ✓ View optimization
  ✓ Run optimization
  ✓ View audit logs

CRM OPS
───────
Create and manage bonuses. Can:
  ✓ Create bonuses
  ✓ Edit bonuses
  ✓ Delete bonuses
  ✓ View bonuses
  ✓ View translations
  ✗ Cannot manage pricing tables
  ✗ Cannot create users
  ✗ Cannot optimize
  ✗ Cannot translate

TRANSLATION TEAM
────────────────
Translate bonus content. Can:
  ✓ Translate bonuses
  ✓ Submit translations
  ✓ View bonuses
  ✓ View translations
  ✗ Cannot create/edit bonuses
  ✗ Cannot delete bonuses
  ✗ Cannot manage users
  ✗ Cannot optimize

OPTIMIZATION TEAM
─────────────────
Optimize bonus configurations. Can:
  ✓ View bonuses
  ✓ View optimization
  ✓ Run optimization
  ✗ Cannot create/edit bonuses
  ✗ Cannot delete bonuses
  ✗ Cannot translate
  ✗ Cannot manage users

═══════════════════════════════════════════════════════════════════════════════
                       CREATE USERS WITH ROLES
═══════════════════════════════════════════════════════════════════════════════

Go to: https://campeon-crm-web.vercel.app/admin/create-user

Or locally: http://localhost:3001/admin/create-user

FORM FIELDS:
  Username      - Format: firstname.lastname (e.g., john.smith)
  Role          - Select from: CRM OPS, Translation Team, Optimization Team, Admin
  Password      - Minimum 8 characters
  Confirm Pwd   - Must match password

EXAMPLE USERS:
  john.smith          → CRM OPS (can create bonuses)
  maria.garcia        → Translation Team (can translate)
  alex.patel          → Optimization Team (can optimize)
  admin.user          → Admin (full access)

═══════════════════════════════════════════════════════════════════════════════
                    IMPLEMENTING ROLE-BASED ENDPOINTS
═══════════════════════════════════════════════════════════════════════════════

To protect endpoints with permissions, use the RBAC utilities in backend/services/rbac.py:

EXAMPLE 1: Require specific permission
───────────────────────────────────────

from fastapi import Depends
from services.rbac_examples import get_current_user, require_permission
from services.rbac import Permission

@router.post("/api/bonus-templates")
def create_bonus(
    data: BonusData,
    current_user = Depends(get_current_user),
    _: None = Depends(require_permission(Permission.CREATE_BONUS))
):
    # Only users with CREATE_BONUS permission (admin, CRM OPS)
    return {"status": "bonus created"}

EXAMPLE 2: Require specific role
─────────────────────────────────

from services.rbac_examples import get_current_user, require_role

@router.post("/auth/admin/create-user")
def admin_create_user(
    user_data: UserRegister,
    current_user = Depends(get_current_user),
    _: None = Depends(require_role("admin"))
):
    # Only admin role
    return {"status": "user created"}

EXAMPLE 3: Check permission manually
──────────────────────────────────────

from services.rbac import has_permission, Permission

@router.post("/api/optimization/run")
def run_optimization(
    params: OptimizationParams,
    current_user = Depends(get_current_user),
):
    if not has_permission(current_user.role, Permission.RUN_OPTIMIZATION):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Run optimization...
    return {"status": "completed"}

═══════════════════════════════════════════════════════════════════════════════
                           RBAC UTILITY FUNCTIONS
═══════════════════════════════════════════════════════════════════════════════

Available in backend/services/rbac.py:

1. has_permission(role: str, permission: Permission) -> bool
   Check if a role has a specific permission

2. has_any_permission(role: str, permissions: List[Permission]) -> bool
   Check if role has any of the specified permissions

3. has_all_permissions(role: str, permissions: List[Permission]) -> bool
   Check if role has all of the specified permissions

4. get_role_description(role: str) -> str
   Get human-readable description of a role

5. get_role_permissions(role: str) -> List[str]
   Get list of all permissions for a role

PERMISSIONS AVAILABLE:
  CREATE_BONUS          - Create new bonuses
  EDIT_BONUS            - Edit existing bonuses
  DELETE_BONUS          - Delete bonuses
  VIEW_BONUS            - View bonuses
  TRANSLATE_BONUS       - Translate bonus content
  SUBMIT_TRANSLATION    - Submit translations
  VIEW_TRANSLATIONS     - View translations
  VIEW_OPTIMIZATION     - View optimization tab
  RUN_OPTIMIZATION      - Run optimization
  VIEW_ADMIN_PANEL      - View admin panel
  MANAGE_PRICING_TABLES - Manage pricing tables
  CREATE_USERS          - Create new users
  MANAGE_USERS          - Manage users
  VIEW_AUDIT_LOG        - View audit logs

═══════════════════════════════════════════════════════════════════════════════
                          TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

ERROR: "Invalid role" when creating user
─────────────────────────────────────────
Make sure you select a valid role from the dropdown:
  ✓ CRM OPS
  ✓ Translation Team
  ✓ Optimization Team
  ✓ admin

ERROR: Database error when creating user on external DB
────────────────────────────────────────────────────────
Run the migration script:
  python backend/migrate_fix_user_roles.py

Then restart the backend.

ERROR: "Permission denied" when accessing endpoint
──────────────────────────────────────────────────
Make sure your user has the required role. Contact an admin to upgrade privileges.

═══════════════════════════════════════════════════════════════════════════════
                      TESTING ROLE-BASED ACCESS
═══════════════════════════════════════════════════════════════════════════════

TEST 1: Create CRM OPS user
──────────────────────────
1. Go to /admin/create-user
2. Create user: john.smith / password123 / Role: CRM OPS
3. Login as john.smith
4. Should see bonus creation form
5. Should NOT see admin panel / user creation

TEST 2: Create Translation Team user
────────────────────────────────────
1. Go to /admin/create-user (as admin)
2. Create user: maria.garcia / password456 / Role: Translation Team
3. Login as maria.garcia
4. Should see translation tab
5. Should NOT see bonus creation form
6. Should NOT see admin panel

TEST 3: Create Optimization Team user
─────────────────────────────────────
1. Go to /admin/create-user (as admin)
2. Create user: alex.patel / password789 / Role: Optimization Team
3. Login as alex.patel
4. Should see optimization tab
5. Should NOT see bonus creation form
6. Should NOT see translations

TEST 4: Admin access
───────────────────
1. Login as admin (default role)
2. Should see ALL tabs: Admin, Create, Browse, Translation, Optimization
3. Should be able to create users
4. Should be able to manage pricing tables

═══════════════════════════════════════════════════════════════════════════════
                        FILES AFFECTED
═══════════════════════════════════════════════════════════════════════════════

NEW FILES CREATED:
  backend/migrate_fix_user_roles.py       - Migration script for external DB
  backend/services/rbac.py                - Role-based access control module
  backend/services/rbac_examples.py       - Example implementations
  backend/USER_ROLES_SETUP.md             - This file

MODIFIED FILES:
  backend/database/models.py              - Expanded role column to 100 chars
  backend/api/auth.py                     - Updated user creation logic
  backend/api/schemas.py                  - Added role field to UserRegister

═══════════════════════════════════════════════════════════════════════════════
                         NEXT STEPS
═══════════════════════════════════════════════════════════════════════════════

1. Run migration (if using external DB):
   python backend/migrate_fix_user_roles.py

2. Restart backend:
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

3. Create users with different roles:
   http://localhost:3001/admin/create-user

4. Test each role:
   - Login as CRM OPS user
   - Login as Translation Team user
   - Login as Optimization Team user
   - Login as admin

5. Implement endpoint protection using RBAC utilities:
   Import from backend/services/rbac.py
   Use require_permission() and require_role() dependencies

═══════════════════════════════════════════════════════════════════════════════
