"""
Role-Based Access Control (RBAC) utilities for CAMPEON CRM.
Define permissions and privileges for each role.
"""

from typing import List, Set
from enum import Enum


class UserRole(str, Enum):
    """Supported user roles"""
    ADMIN = "admin"
    CRM_OPS = "CRM OPS"
    TRANSLATION_TEAM = "Translation Team"
    OPTIMIZATION_TEAM = "Optimization Team"


class Permission(str, Enum):
    """Application permissions"""
    # Bonus template permissions
    CREATE_BONUS = "create_bonus"
    EDIT_BONUS = "edit_bonus"
    DELETE_BONUS = "delete_bonus"
    VIEW_BONUS = "view_bonus"

    # Translation permissions
    TRANSLATE_BONUS = "translate_bonus"
    SUBMIT_TRANSLATION = "submit_translation"
    VIEW_TRANSLATIONS = "view_translations"

    # Optimization permissions
    VIEW_OPTIMIZATION = "view_optimization"
    RUN_OPTIMIZATION = "run_optimization"

    # Admin permissions
    VIEW_ADMIN_PANEL = "view_admin_panel"
    MANAGE_PRICING_TABLES = "manage_pricing_tables"
    CREATE_USERS = "create_users"
    MANAGE_USERS = "manage_users"
    VIEW_AUDIT_LOG = "view_audit_log"


# Role-to-permissions mapping
ROLE_PERMISSIONS: dict[UserRole, Set[Permission]] = {
    UserRole.ADMIN: {
        # Admin has all permissions
        Permission.CREATE_BONUS,
        Permission.EDIT_BONUS,
        Permission.DELETE_BONUS,
        Permission.VIEW_BONUS,
        Permission.TRANSLATE_BONUS,
        Permission.SUBMIT_TRANSLATION,
        Permission.VIEW_TRANSLATIONS,
        Permission.VIEW_OPTIMIZATION,
        Permission.RUN_OPTIMIZATION,
        Permission.VIEW_ADMIN_PANEL,
        Permission.MANAGE_PRICING_TABLES,
        Permission.CREATE_USERS,
        Permission.MANAGE_USERS,
        Permission.VIEW_AUDIT_LOG,
    },

    UserRole.CRM_OPS: {
        # CRM OPS can create, edit, and view bonuses
        Permission.CREATE_BONUS,
        Permission.EDIT_BONUS,
        Permission.DELETE_BONUS,
        Permission.VIEW_BONUS,
        Permission.VIEW_TRANSLATIONS,
    },

    UserRole.TRANSLATION_TEAM: {
        # Translation Team can translate and view bonuses
        Permission.VIEW_BONUS,
        Permission.TRANSLATE_BONUS,
        Permission.SUBMIT_TRANSLATION,
        Permission.VIEW_TRANSLATIONS,
    },

    UserRole.OPTIMIZATION_TEAM: {
        # Optimization Team can view and optimize bonuses
        Permission.VIEW_BONUS,
        Permission.VIEW_OPTIMIZATION,
        Permission.RUN_OPTIMIZATION,
    },
}


def has_permission(role: str, permission: Permission) -> bool:
    """
    Check if a user role has a specific permission.

    Args:
        role: User role string (e.g., "admin", "CRM OPS")
        permission: Permission to check

    Returns:
        True if role has the permission, False otherwise
    """
    try:
        user_role = UserRole(role)
        return permission in ROLE_PERMISSIONS.get(user_role, set())
    except ValueError:
        # Invalid role
        return False


def has_any_permission(role: str, permissions: List[Permission]) -> bool:
    """Check if role has any of the specified permissions"""
    return any(has_permission(role, perm) for perm in permissions)


def has_all_permissions(role: str, permissions: List[Permission]) -> bool:
    """Check if role has all of the specified permissions"""
    return all(has_permission(role, perm) for perm in permissions)


def get_role_description(role: str) -> str:
    """Get human-readable description of a role"""
    descriptions = {
        UserRole.ADMIN: "Administrator - Full system access",
        UserRole.CRM_OPS: "CRM Operations - Create and manage bonuses",
        UserRole.TRANSLATION_TEAM: "Translation Team - Translate bonus content",
        UserRole.OPTIMIZATION_TEAM: "Optimization Team - Optimize bonus configurations",
    }
    try:
        user_role = UserRole(role)
        return descriptions.get(user_role, f"Unknown role: {role}")
    except ValueError:
        return f"Unknown role: {role}"


def get_role_permissions(role: str) -> List[str]:
    """Get list of permissions for a role"""
    try:
        user_role = UserRole(role)
        return [perm.value for perm in ROLE_PERMISSIONS.get(user_role, set())]
    except ValueError:
        return []
