import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../services/supabase';

@Component({
  selector: 'app-login',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  // Form fields
  email = '';
  password = '';
  
  // UI state
  showPassword = false;
  rememberDevice = false;
  isEmailFocused = false;
  isPasswordFocused = false;

  constructor(private supabaseService: SupabaseService, private router: Router) {}

  async handleLogin() {
    const { data, error } = await this.supabaseService.signIn(this.email, this.password);

    if (error) {
      alert('Login failed: ' + error.message);
    } else if (data?.user || data?.session) {
      this.router.navigate(['/home']);
    }
  }
}
/* 
This Login component:
-captures user input
-sends it to Supabase for authentication
-shows erro if login fails
-redirects user to home page if login succeeds
*/
