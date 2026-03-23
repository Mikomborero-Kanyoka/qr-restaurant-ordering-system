import { supabase } from './supabaseClient';

export const ADMIN_ASSIGNABLE_ROLES = ['manager', 'supervisor', 'waiter', 'kitchen'];

export async function fetchUserProfile(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('users')
    .select('id, username, role, branch_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function getEffectiveRole(user, profile) {
  return profile?.role || user?.user_metadata?.role || user?.app_metadata?.role || null;
}

export function getEffectiveBranchId(user, profile) {
  return profile?.branch_id ?? user?.user_metadata?.branch_id ?? user?.app_metadata?.branch_id ?? null;
}

export function isManagementRole(role) {
  return ['admin', 'manager', 'supervisor'].includes(role);
}

export function getDashboardPath(role, branchId) {
  if (role === 'admin') return '/admin';
  if (role === 'pending_staff') return '/staff/pending';
  if (role === 'kitchen') return branchId ? `/kitchen/${branchId}` : '/staff/pending';
  if (role === 'waiter') return branchId ? `/waiter/${branchId}` : '/staff/pending';

  if (['manager', 'supervisor', 'staff'].includes(role)) {
    return branchId ? `/branch/${branchId}` : '/staff/pending';
  }

  return null;
}
