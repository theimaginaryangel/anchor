/**
 * Role Checking Utilities
 *
 * Helper functions to check what a user is allowed to do.
 * Two roles:
 *   - admin: can upload, delete, and query documents
 *   - viewer: can only query documents (read-only)
 *
 * These are used in API route handlers and in the UI to show/hide
 * controls based on the user's role.
 *
 * Implemented in Phase 1.
 */

export type UserRole = 'admin' | 'viewer' | null | undefined;

export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

export function isViewer(role: UserRole): boolean {
  return role === 'viewer';
}

export function canUpload(role: UserRole): boolean {
  // Both roles can upload. Viewers are portfolio reviewers who need
  // to try the full experience. Only delete is restricted to admin.
  return isAdmin(role) || isViewer(role);
}

export function canDelete(role: UserRole): boolean {
  return isAdmin(role);
}

export function canQuery(role: UserRole): boolean {
  // Both roles can query. They just need to be authenticated and have a valid role.
  return isAdmin(role) || isViewer(role);
}
