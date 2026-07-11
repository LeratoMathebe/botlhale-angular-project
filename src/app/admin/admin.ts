import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../services/supabase';
import {FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule} from '@angular/forms';
import { CustomValidators } from '../register/utils/custom-validators';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  staffMembers: any[] = [];
  isLoading = true;
  currentUserId = '';
  searchTerm: string = '';
  roleFilter: string = 'all';

  //Modals visibility states
  showAddModal = false;
  selectedMember: any = null; //Holds member data for the view modal

  staffForm: FormGroup;

  constructor(
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.staffForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['Welcome@Staff2026', [Validators.required, Validators.minLength(6)]],
      full_name: ['', Validators.required],
      sa_id_number: ['', [Validators.required, CustomValidators.saID()]],
      phone_number: ['', [Validators.required, CustomValidators.saPhone()]],
      role: ['staff']
    });
  }

  ngOnInit() {
    this.loadStaff();
  }

  /**
   * Loads all staff members from the profiles table.
   * Only admins can see this page due to adminGuard.
   */
  async loadStaff() {
    try {
      // Get current user ID so we don't accidentally delete ourselves
      const { data: { session } } = await this.supabase.supabase.auth.getSession();
      this.currentUserId = session?.user.id || '';

      //Fetch all profiles
      const { data: profiles, error: profileError } = await this.supabase.supabase
        .from('profiles')
        .select('*');

      if (profileError) throw profileError;

      //Fetch all roles
      const {data: roles, error: rolesError} = await this.supabase.supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      //Combine profiles with their roles
      this.staffMembers = (profiles || []).map(profile => {
        const userRole = (roles || []).find(r => r.user_id === profile.id);
        return{
          ...profile,
          role: userRole?.role || 'staff'
        };
        }).sort((a, b) => a.role.localeCompare(b.role)); // Sort alphabetically

      this.isLoading = false;
      this.cdr.detectChanges();

    } catch (error: any) {
      console.error("Load Staff Error:", error);
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * VIEW ACTION: Opens modal with full profile details
   */
  viewMemberDetails(member: any) {
    this.selectedMember = member;
  }
  closeViewModal() {
    this.selectedMember = null;
  }

  get adminCount(): number {
  return this.staffMembers.filter(m => m.role === 'admin').length;
}

  get filteredStaff(): any[] {
  let result = this.staffMembers;

  if (this.roleFilter !== 'all') {
    result = result.filter(member => member.role === this.roleFilter);
  }

  if (this.searchTerm.trim()) {
    const term = this.searchTerm.toLowerCase();
    result = result.filter(member =>
      member.full_name?.toLowerCase().includes(term) ||
      member.email?.toLowerCase().includes(term) ||
      member.role?.toLowerCase().includes(term)
    );
  }

  return result;
}


  /**
   * ADD ACTION: Signs up a new user via Supabase Auth and hooks their profile configuration 
   */
  async handleStaff() {
    if (this.staffForm.invalid) {
      alert("Please fill in all fields correctly.");
      return;
    }

    const val = this.staffForm.value;
   try {
      // Create user authentication record with metadata mapping to trigger handle_new_user() hook
      const { data, error } = await this.supabase.supabase.auth.signUp({
        email: val.email,
        password: val.password,
        options: {
          data: {
            full_name: val.full_name,
            id_number: val.sa_id_number,
            phone_number: val.phone_number
          }
        }
      });

      if (error) throw error;
      if (!data?.user) throw new Error("Could not generate account");

      if (data.user.identities && data.user.identities.length === 0) {
  throw new Error("This email is already registered. Please use a different email address.");
}

      await this.supabase.supabase
      .from('user_roles')
      .update({ role: val.role })
      .eq('user_id', data.user.id);
        
      alert(`Staff member "${val.full_name}" added successfully!`);
      this.showAddModal = false;
      this.staffForm.reset({password: 'Welcome@Staff2026', role: 'staff'}); 
      this.loadStaff();
    }
    catch (error: any) {
      alert("Failed to add staff user: " + error.message);
    }
  }

  /**
   * Promotes a staff member to admin or demotes admin to staff.
   * Updates user_roles table instead of profiles.
   */

  async toggleRole(member: any) {
    const newRole = member.role === 'admin' ? 'staff' : 'admin';
    const action = newRole === 'admin' ? 'promote' : 'demote';

    const confirmed = confirm(
      `Are you sure you want to ${action} "${member.full_name}" to ${newRole}?`
    );
    if (!confirmed) return;

    const { error } = await this.supabase.supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', member.id);

    if (error) {
      alert("Failed to update role: " + error.message);
      return;
    }

    alert(`"${member.full_name}" is now ${newRole}.`);
    this.loadStaff();
  }

  /**
   * Deletes a staff member account.
   * Cascade delete removes their user_roles entry automatically.
   * Cannot delete your own account
   */
  async deleteStaff(member: any) {
    if (member.id === this.currentUserId) {
      alert("You cannot delete your own account.");
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete "${member.full_name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    const { error } = await this.supabase.supabase
      .from('profiles')
      .delete()
      .eq('id', member.id);

    if (error) {
      alert("Failed to delete: " + error.message);
      return;
    }

    alert(`"${member.full_name}" has been deleted.`);
    this.loadStaff();
  }
}
