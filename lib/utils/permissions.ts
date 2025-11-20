/**
 * Permission utility functions for access control
 */

/**
 * Check if a user can view another user's data
 *
 * Rules:
 * - ADMIN role: Can view all users' data (their own + others)
 * - USER role: Can only view their own data
 *
 * @param currentUserRole - The role of the current user
 * @param currentUserId - The ID of the current user
 * @param targetUserId - The ID of the user whose data is being accessed
 * @returns true if access is allowed, false otherwise
 */
export function canViewUserData(
  currentUserRole: string,
  currentUserId: string,
  targetUserId: string
): boolean {
  // ADMIN can view all data
  if (currentUserRole === 'ADMIN') {
    return true;
  }

  // USER can only view their own data
  if (currentUserRole === 'USER') {
    return currentUserId === targetUserId;
  }

  // Default: deny access
  return false;
}

/**
 * Get the allowed user IDs for viewing data based on role
 *
 * @param currentUserRole - The role of the current user
 * @param currentUserId - The ID of the current user
 * @param requestedUserId - The requested user ID (optional, from query params)
 * @returns The user ID(s) that can be accessed
 */
export function getAllowedUserIds(
  currentUserRole: string,
  currentUserId: string,
  requestedUserId?: string | null
): string[] {
  // ADMIN can view all users
  if (currentUserRole === 'ADMIN') {
    // If a specific user is requested, return that user ID
    if (requestedUserId) {
      return [requestedUserId];
    }
    // Otherwise, allow access to all (return empty array to indicate no restriction)
    return [];
  }

  // USER can only view their own data
  return [currentUserId];
}

/**
 * Validate if the requested user ID is accessible
 * Returns the validated user ID or throws an error
 *
 * @param currentUserRole - The role of the current user
 * @param currentUserId - The ID of the current user
 * @param requestedUserId - The requested user ID
 * @returns The validated user ID
 * @throws Error if access is denied
 */
export function validateUserAccess(
  currentUserRole: string,
  currentUserId: string,
  requestedUserId?: string | null
): string {
  // If no specific user is requested, default to current user
  const targetUserId = requestedUserId || currentUserId;

  // Check if access is allowed
  if (!canViewUserData(currentUserRole, currentUserId, targetUserId)) {
    throw new Error('Access denied: You do not have permission to view this user\'s data');
  }

  return targetUserId;
}
