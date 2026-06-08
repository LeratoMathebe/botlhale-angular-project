import { Component, OnInit, HostListener } from '@angular/core';
import { RouterModule, RouterLink, RouterOutlet, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
//RouterOutlet is the placeholder where Angular loads pages, example when the user visits dashboard, Angular loads the Dashboard component inside the <router-outlet>
//RouterLink detects whether a link is currently active, example if you're on /dashboard, Angular automatically adds class="active"
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
  currentUrl: string = ''; //the current page URL
  dropdownOpen = false; //
  userName = ''; //stores logged-in user's full name
  userInitial = ''; //stores the first letter of username

  // Listen for route changes to update currentUrl and close dropdown
  constructor(private supabase: SupabaseService, private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl = event.urlAfterRedirects; //the URL that shows after the new page has loaded
      this.dropdownOpen = false; // Close dropdown on navigation
    });
  }

  isAdmin = false; //tracks whether current user is an admin

  async ngOnInit() {
    const { data: { session } } = await this.supabase.supabase.auth.getSession(); //"is this user logged in?"
    
    if (session && (this.router.url === '/' || this.router.url === '/login')) {
      this.router.navigate(['/home']);
    }

    // Load user's name for the dropdown
    if (session?.user) {

     //Get names from profiles
      const { data: profile } = await this.supabase.supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id) //eq(column, value) example .eq('id',2) means find the profile whose id is 2
        .single();

        //Get role from user_roles
        const { data: roleData } = await this.supabase.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      if (profile) {
        this.userName = profile.full_name;
        this.userInitial = profile.full_name.charAt(0).toUpperCase();
      }
      if (roleData) {
        this.isAdmin = roleData.role === 'admin';
      }
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  // Close dropdown when clicking anywhere else on the page e.g "Did the user click outside the dropdown area", if yes, then the dropdown closes
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.dropdownOpen = false;
    }
  }

  //if the URL contains login, register, form etc... then treat as auth page
  get isAuthPage(): boolean {
    return this.currentUrl.includes('/login') || 
           this.currentUrl.includes('/register') ||
           this.currentUrl.includes('/form/') || //this is the link that patients use to access the questionnaire that was created
           this.currentUrl.includes('/forgot-password') ||
           this.currentUrl.includes('/reset-password');
  }

  async signOut() {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }
}

/*The isAuthPage is only under app.html because that's where the thing that we want to be visible or not is
so the thing that we want to be hidden or shown is the navbar. and the navbar is what is in app.html
that's why we only refer to it in app.html */
