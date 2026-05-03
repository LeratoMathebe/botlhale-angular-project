import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { SupabaseService } from '../services/supabase';

@Component({
  selector: 'app-login',
  imports: [RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  constructor(private supabaseService: SupabaseService, private router: Router) {}

  async handleLogin(event: any) {
  event.preventDefault();
  const email = event.target.email.value;
  const password = event.target.password.value;

  const { data, error } = await this.supabaseService.signIn(email, password);

  if (error) {
    alert('Login failed: ' + error.message);
  } else if (data?.user || data?.session) {
    alert('Welcome back!');
    this.router.navigate(['/home']); // Send them to the main page
  }
}
}

