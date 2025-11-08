/**
 * RBAC Permission System
 * Defines roles and their associated permissions for PT2030 projects
 */

export type ProjectRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface Permissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  canInviteMembers: boolean;
  canUploadDocuments: boolean;
  canDeleteDocuments: boolean;
  canExport: boolean;
  canGenerateAI: boolean;
  canEditProjectSettings: boolean;
  canViewAnalytics: boolean;
  canComment: boolean;
}

/**
 * Role hierarchy and descriptions:
 *
 * - owner: Full control, can delete project, manage all members
 * - admin: Can edit everything, manage members (except owner)
 * - editor: Can edit content and upload documents
 * - viewer: Read-only access, can view and comment
 */

/**
 * Get permissions for a given role
 * @param role The user's role in the project
 * @param isOwner Whether the user is the project owner
 * @returns Permissions object with all permission flags
 */
export function getPermissions(
  role: ProjectRole | null,
  isOwner: boolean = false
): Permissions {
  // No access if no role and not owner
  if (!role && !isOwner) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canManageMembers: false,
      canInviteMembers: false,
      canUploadDocuments: false,
      canDeleteDocuments: false,
      canExport: false,
      canGenerateAI: false,
      canEditProjectSettings: false,
      canViewAnalytics: false,
      canComment: false,
    };
  }

  // If owner, override role to 'owner'
  const actualRole = isOwner ? 'owner' : role;

  // Define permissions based on role
  switch (actualRole) {
    case 'owner':
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canManageMembers: true,
        canInviteMembers: true,
        canUploadDocuments: true,
        canDeleteDocuments: true,
        canExport: true,
        canGenerateAI: true,
        canEditProjectSettings: true,
        canViewAnalytics: true,
        canComment: true,
      };

    case 'admin':
      return {
        canView: true,
        canEdit: true,
        canDelete: false, // Only owner can delete project
        canManageMembers: true,
        canInviteMembers: true,
        canUploadDocuments: true,
        canDeleteDocuments: true,
        canExport: true,
        canGenerateAI: true,
        canEditProjectSettings: true,
        canViewAnalytics: true,
        canComment: true,
      };

    case 'editor':
      return {
        canView: true,
        canEdit: true,
        canDelete: false,
        canManageMembers: false,
        canInviteMembers: false,
        canUploadDocuments: true,
        canDeleteDocuments: true,
        canExport: true,
        canGenerateAI: true,
        canEditProjectSettings: false,
        canViewAnalytics: false,
        canComment: true,
      };

    case 'viewer':
      return {
        canView: true,
        canEdit: false,
        canDelete: false,
        canManageMembers: false,
        canInviteMembers: false,
        canUploadDocuments: false,
        canDeleteDocuments: false,
        canExport: true, // Viewers can export for their own use
        canGenerateAI: false,
        canEditProjectSettings: false,
        canViewAnalytics: false,
        canComment: true,
      };

    default:
      // Fallback to no permissions
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canManageMembers: false,
        canInviteMembers: false,
        canUploadDocuments: false,
        canDeleteDocuments: false,
        canExport: false,
        canGenerateAI: false,
        canEditProjectSettings: false,
        canViewAnalytics: false,
        canComment: false,
      };
  }
}

/**
 * Get role display name for UI
 */
export function getRoleDisplayName(role: ProjectRole): string {
  const roleNames: Record<ProjectRole, string> = {
    owner: 'Proprietário',
    admin: 'Administrador',
    editor: 'Editor',
    viewer: 'Visualizador',
  };
  return roleNames[role] || role;
}

/**
 * Get role badge color for UI
 */
export function getRoleBadgeColor(role: ProjectRole): string {
  const roleColors: Record<ProjectRole, string> = {
    owner: 'bg-purple-100 text-purple-800',
    admin: 'bg-blue-100 text-blue-800',
    editor: 'bg-green-100 text-green-800',
    viewer: 'bg-gray-100 text-gray-800',
  };
  return roleColors[role] || 'bg-gray-100 text-gray-800';
}

/**
 * Check if a role can manage another role
 * Owners can manage all roles
 * Admins can manage editors and viewers (but not owner or other admins)
 */
export function canManageRole(
  managerRole: ProjectRole,
  targetRole: ProjectRole,
  isOwner: boolean = false
): boolean {
  if (isOwner) return true;

  if (managerRole === 'owner') return true;

  if (managerRole === 'admin') {
    return ['editor', 'viewer'].includes(targetRole);
  }

  return false;
}

/**
 * Get available roles for invitation based on user's role
 */
export function getAvailableRolesForInvite(
  userRole: ProjectRole,
  isOwner: boolean = false
): ProjectRole[] {
  if (isOwner || userRole === 'owner') {
    return ['admin', 'editor', 'viewer'];
  }

  if (userRole === 'admin') {
    return ['editor', 'viewer'];
  }

  return [];
}

/**
 * Validate if a user can perform an action
 * Throws an error with a user-friendly message if not permitted
 */
export function assertPermission(
  permissions: Permissions,
  action: keyof Permissions,
  actionName: string = 'esta ação'
): void {
  if (!permissions[action]) {
    throw new Error(`Não tens permissão para ${actionName}`);
  }
}
