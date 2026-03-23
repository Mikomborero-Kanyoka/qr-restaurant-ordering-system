import { supabase } from './supabaseClient'

export const STAFF_SIGNUP_ROLE = 'staff'
export const MANAGER_ASSIGNABLE_ROLES = ['manager', 'supervisor', 'waiter', 'kitchen', 'staff']

export async function fetchUserProfile(userId) {
  if (!userId) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export function mergeUserContext(user, profile) {
  if (!user) return null

  return {
    user,
    profile,
    role: profile?.role ?? user.user_metadata?.role ?? user.app_metadata?.role ?? null,
    branchId: profile?.branch_id ?? user.user_metadata?.branch_id ?? user.app_metadata?.branch_id ?? null,
    username: profile?.username ?? user.user_metadata?.username ?? user.email ?? 'User',
    email: profile?.email ?? user.email ?? '',
  }
}

export async function getCurrentUserContext() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return null
  }

  const profile = await fetchUserProfile(session.user.id)
  return mergeUserContext(session.user, profile)
}

export function subscribeToUserContext(callback) {
  return supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      callback(null)
      return
    }

    try {
      const profile = await fetchUserProfile(session.user.id)
      callback(mergeUserContext(session.user, profile))
    } catch (error) {
      console.error('Failed to load profile during auth change', error)
      callback(mergeUserContext(session.user, null))
    }
  })
}
