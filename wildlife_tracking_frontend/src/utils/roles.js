/**
 * PUBLIC_INTERFACE
 * Roles and helper utilities
 */
export const ROLES = {
  guest: "guest",
  researcher: "researcher",
  admin: "admin",
};

export function canAccess(role, allowed = []) {
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(role);
}
