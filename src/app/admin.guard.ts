import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from './services/supabase';


/**
 * Admin Guard
 * Only allows access if the logged-in user has role = 'admin'.
 * Redirects staff to home if they try to access the admin page.
 * Reads role from user_roles table instead of profiles to avoid RLS conflicts
 */
export const adminGuard: CanActivateFn = async (route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const { data: { session } } = await supabase.supabase.auth.getSession();

  
  if (!session) {
    router.navigate(['/login']);
    return false;
  }

  // Check the user's role from the profiles table
  const { data, error} = await supabase.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .single();

  if (data?.role === 'admin') {
    return true;
  }

  // Not an admin — redirect to home
  router.navigate(['/home']);
  return false;
};