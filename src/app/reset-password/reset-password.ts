import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../services/supabase';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  
  // Controls which view to show
  mode: 'forgot' | 'reset' = 'forgot';
  
  forgotForm: FormGroup;
  resetForm: FormGroup;
  
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

 async ngOnInit() {
  if (window.location.pathname.includes('reset-password')) {
    this.mode = 'reset';
    
    // Extract the access token from the URL hash and set the session
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      
      if (accessToken && refreshToken) {
        const { error } = await this.supabase.supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (error) {
          this.errorMessage = 'Invalid or expired reset link. Please request a new one.';
          this.mode = 'forgot';
        }
      }
    }
  }
}

  /**
   * Sends a password reset email to the staff member.
   * Supabase handles the email sending automatically.
   */
  async sendResetEmail() {
    if (this.forgotForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { error } = await this.supabase.supabase.auth.resetPasswordForEmail(
      this.forgotForm.value.email,
      { redirectTo: `${window.location.origin}/reset-password` }
    );

    console.log("Reset Email Response:", { error });
    console.log("Email used:", this.forgotForm.value.email);

    this.isLoading = false;

    if (error) {
      this.errorMessage = error.message;
    } else {
      this.successMessage = 'Password reset email sent! Please check your inbox.';
    }
  }

  /**
   * Updates the user's password after they click the reset link.
   */
  async updatePassword() {
    if (this.resetForm.invalid) return;

    const { password, confirmPassword } = this.resetForm.value;

    if (password !== confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { error } = await this.supabase.supabase.auth.updateUser({
      password: password
    });

    this.isLoading = false;

    if (error) {
      this.errorMessage = error.message;
    } else {
      this.successMessage = 'Password updated successfully!';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }
  }
}