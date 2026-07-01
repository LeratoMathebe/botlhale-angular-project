// import { Component } from '@angular/core';
// import { RouterModule } from '@angular/router';
// import { RouterLink } from '@angular/router';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-home',
//   standalone: true,
//   imports: [RouterModule, RouterLink, CommonModule],
//   templateUrl: './home.html',
//   styleUrl: './home.css',
// })
// export class Home {}

import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../services/supabase';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})

export class Home implements OnInit {
  userName: string = 'Valued Member';

  constructor(private supabase: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    try {
      // 1. Get the authenticated user
      const { data: { user } } = await this.supabase.supabase.auth.getUser();

      if (user) {
        // 2. Fetch the profile from the database
        const { data: profile, error } = await this.supabase.supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profile?.full_name) {
          this.userName = profile.full_name;
          return; // Success! Stop here.
        }
      }
    } catch (err) {
      console.error("Error fetching profile, falling back to local storage:", err);
    }

    // 3. Fallback: Only if DB fetch failed/no profile found, check localStorage
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('userName');
      this.userName = storedName ? storedName.trim() : 'Valued Member';
    }
  }
}