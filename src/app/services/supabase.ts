import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})

// Responsible for establishing the live link between Angular and Supabase.
export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    // Initialize the connection using the URL and Key from environment config.
    // Think of this like a phone call: createClient dials the number (supabaseUrl)
    // and provides the passcode (supabaseKey). Once this runs, the line is open.
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  /**
   * Registers a new staff user via Supabase Auth.
   * The profiles table is populated automatically via a database trigger
   * (on_auth_user_created) that fires when a new auth user is created.
   */
  async signUp(email: string, pass: string, name: string, idNumber: string, phoneNumber: string) {
    return await this.supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: name,
          id_number: idNumber,
          phone_number: phoneNumber
        }
      }
    });
  }

  // Login for healthcare staff
  async signIn(email: string, pass: string) {
    return await this.supabase.auth.signInWithPassword({ email, password: pass });
  }

  // Get the current logged-in user
  get user() {
    return this.supabase.auth.getUser();
  }

  // Sign out
  async signOut() {
    return await this.supabase.auth.signOut();
  }
}

//The Supabase service acts as a bridge that connects your Angular app to your database. 
// By replacing the default code, you "handshake" with Supabase using your environment keys so the app has permission to talk to the internet. 
// It provides a "single source of truth" for security, handling the complex work of logging staff in, encrypting passwords, and identifying who is currently using the system. 
// This separation of concerns keeps your pages focused on how things look while the service focuses on how data is saved. Ultimately, this makes your code professional, secure, and much easier to fix if something goes wrong.