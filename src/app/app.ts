import { Component, OnInit, HostListener } from '@angular/core';
import { RouterModule, RouterLink, RouterOutlet, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from './services/supabase';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, RouterLink, RouterOutlet, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {

  currentUrl: string = '';
  dropdownOpen = false;

  userName = '';
  userInitial = '';
  isAdmin = false;

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {

    // Listen for route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl = event.urlAfterRedirects;
      this.dropdownOpen = false;
    });

  }

  async ngOnInit() {

    // Check current session when app starts
    const { data: { session } } =
      await this.supabase.supabase.auth.getSession();

    if (session && (this.router.url === '/' || this.router.url === '/login')) {
      this.router.navigate(['/home']);
    }

    // Load current user
    await this.loadUser(session);

  
  }

  // Loads the logged-in user's information
  async loadUser(session: any) {

    if (!session?.user) {
      this.userName = '';
      this.userInitial = '';
      this.isAdmin = false;
      return;
    }

    // Get profile
    const { data: profile } = await this.supabase.supabase
      .from('profiles')
      .select('full_name')
      .eq('id', session.user.id)
      .single();

    // Get role
    const { data: roleData } = await this.supabase.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (profile) {
      this.userName = profile.full_name;
      this.userInitial = profile.full_name.charAt(0).toUpperCase();
    } else {
      this.userName = '';
      this.userInitial = '';
    }

    this.isAdmin = roleData?.role === 'admin';
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  mobileMenuOpen = false;

  toggleMobileMenu() 
  {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!target.closest('.relative')) {
      this.dropdownOpen = false;
    }
  }

  get isAuthPage(): boolean {
    return this.currentUrl.includes('/login') ||
           this.currentUrl.includes('/register') ||
           this.currentUrl.includes('/form/') ||
           this.currentUrl.includes('/forgot-password') ||
           this.currentUrl.includes('/reset-password');
  }

  async signOut() {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }

}

