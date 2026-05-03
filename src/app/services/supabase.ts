import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment'; //It holds your unique Supabase URL and Key

@Injectable({
  providedIn: 'root'
})

//It is responsible for establishing the live link between your Angular application and the Supabase cloud.
export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    // Initialize the connection to Supabase using the URL and Key from the environment configuration
    //Think of this like a Phone Call: The createClient line dials the number (supabaseUrl) 
    // and provides the passcode (supabaseKey). Once this runs, the phone line to the cloud is Open.

    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // Register a new staff user
 async signUp(email: string, pass: string, name: string, idNumber: string, phoneNumber: string) {
    return await this.supabase.auth.signUp({
      email,
      password: pass,
      options: 
      { data: 
        { full_name: name, 
          id_number: idNumber, 
          phone_number: phoneNumber 
        } 
      }
    })
  }

      //This sends the email and password to Supabase. Supabase checks its list:
    //if you are registered, it gives an error to say "already signed in", but if not, then Supabase adds you to the list

  // Login for healthcare staff
  async signIn(email: string, pass: string) {
    
    //if Supabse finds you on the list, it lets you in
    //if not, then it gives an error to say "invalid login"

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