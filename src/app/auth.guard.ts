import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from './services/supabase';

/**
 * Route Guard (CanActivateFn)
 * Protects authenticated routes from unauthenticated access.
 * If the user is not logged in, they are redirected to the login page.
 */
export const authGuard: CanActivateFn = async (route, state) => {
  const supabase = inject(SupabaseService); 
  const router = inject(Router); //same as saying constructor(private router: Router) {}

  const { data: {session} } = await supabase.supabase.auth.getSession(); //"Is the user logged-in?"

  if (session) {
    return true; // User is logged in, allow access
  }

  // User is not logged in, redirect to login
  router.navigate(['/login']);
  return false;
};

/*isAuthPage is for the UI only, hides the navbar/sidebar and does NOT block access "Should i hide the furniture in the room?"
  while authGuard is security-level logic and blocks route access "Should i even let you enter the room?" */