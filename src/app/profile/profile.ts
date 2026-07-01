import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../services/supabase';
import { CustomValidators } from '../register/utils/custom-validators';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  profileForm: FormGroup;
  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';
  memberSince = '';
  lastLogin = '';
  userRole = '';
  currentDate = '';

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.profileForm = this.fb.group({
      full_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      sa_id_number: ['', [Validators.required, CustomValidators.saID()]],
      phone_number: ['', [Validators.required, CustomValidators.saPhone()]]
    });
  }

  ngOnInit() {
    this.loadProfile();
  }

  /**
   * Loads the current user's profile from the profiles table.
   */
  async loadProfile() {
    try {
      const { data: { session } } = await this.supabase.supabase.auth.getSession();
      if (!session) {
        this.router.navigate(['/login']);
        return;
      }

      this.memberSince = new Date(session.user.created_at).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
  this.lastLogin = new Date(session.user.last_sign_in_at!).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

      const { data, error } = await this.supabase.supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      //Get role from user_roles
      const { data: roleData} = await this.supabase.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

      if (roleData) {
        this.userRole = roleData.role === 'admin' ? 'Administrator' : 'Staff Member';
      }

      //Current date
      this.currentDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });

      // Populate the form with existing profile data
      this.profileForm.patchValue({
        full_name: data.full_name,
        email: data.email,
        sa_id_number: data.sa_id_number,
        phone_number: data.phone_number
      });

      this.isLoading = false;
      this.cdr.detectChanges();

    } catch (error: any) {
      console.error("Load Profile Error:", error);
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Updates the user's profile in the profiles table.
   */
  async saveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    //this block is updating a user's profile information in the profiles table in the database
    try {
      const { data: { session } } = await this.supabase.supabase.auth.getSession();

      const { error } = await this.supabase.supabase
        .from('profiles')
        .update({
          full_name: this.profileForm.value.full_name,
          email: this.profileForm.value.email,
          sa_id_number: this.profileForm.value.sa_id_number,
          phone_number: this.profileForm.value.phone_number,
          updated_at: new Date().toISOString()
        })
        .eq('id', session!.user.id);

      if (error) throw error;

      this.successMessage = 'Profile updated successfully!';
      this.isSaving = false;
      await this.loadProfile(); //Reload channges to load and show in Angular
      this.cdr.detectChanges();

    } catch (error: any) {
      console.error("Save Profile Error:", error);
      this.errorMessage = 'Failed to update profile: ' + error.message;
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }
}   

/* 
  1. Get the currently logged-in user
          ↓
  2. Read values from the profile form
          ↓
  3. Update the matching row in the profiles table
          ↓
  4. Set updated_at to the current timestamp
          ↓
  5. If anything fails, throw an error

*/

