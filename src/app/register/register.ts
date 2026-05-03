import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // Added this
import { SupabaseService } from '../services/supabase';
import { CustomValidators } from './utils/custom-validators';

@Component({
  selector: 'app-register',
  standalone: true, // Ensuring it is standalone
  imports: [CommonModule, RouterLink, RouterModule, ReactiveFormsModule], // Added ReactiveFormsModule
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  registerForm: FormGroup;

  constructor(
    private supabase: SupabaseService, 
    private router: Router,
    private fb: FormBuilder // Injected FormBuilder
  ) {
    // Initialize the form with your new fields and validation logic
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      idNumber: ['', [Validators.required, CustomValidators.saID()]], // New Field
      phoneNumber: ['', [Validators.required, CustomValidators.saPhone()]] // New Field
    });
  }

  async onRegister() {
    if (this.registerForm.invalid) {
      alert("Please ensure all fields are filled correctly.");
      return;
    }

    // Extract values directly from the form group
    const { name, email, password, idNumber, phoneNumber } = this.registerForm.value;

    const { data, error } = await this.supabase.signUp(email, password, name, idNumber, phoneNumber);

    if (error) {
      alert("Registration failed: " + error.message);
    } else {
      alert("Registration successful! Please check your email.");
      this.router.navigate(['/home']);
    }
  }
}
  

