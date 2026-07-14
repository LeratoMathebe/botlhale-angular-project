import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SupabaseService } from '../services/supabase';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  questionnaires: any[] = []; //created a variable to store all questionnaires

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchQuestionnaires();
  }

  async fetchQuestionnaires() {
    const { data, error } = await this.supabase.supabase
      .from('questionnaires')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase Error:", error);
      return;
    }

    //Fetch all roles so we can tag each questionnaire with its creator's role

    const {data: roles, error: rolesError} = await this.supabase.supabase
    .from('user_roles')
    .select('*');

    if (rolesError) 
      {
        console.error("Roles Fetch Error:", rolesError);
      }

   /**loops through every questionnaire, finds the role of the staff member who created it by matching the questionnaire's owner_id 
    * with the corresponding user_id in the user_roles table
    * 
    */

    this.questionnaires = (data || []).map(q => {
    const ownerRole = (roles || []).find(r => r.user_id === q.owner_id);
    return {
      ...q,
      creator_role: ownerRole?.role || 'staff'
    };
  });

    this.cdr.detectChanges(); 
    console.log("Dashboard Data:", this.questionnaires);
  }

  async deleteQuestionnaire(id: string, title: string) {
    
    const confirmed = confirm(`Are you sure you want to delete "${title}"?`);
    if (confirmed) {

      const { data, error } = await this.supabase.supabase
        .from('questionnaires')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error("Delete Error:", error);
        alert(" Failed to delete: " + error.message);
        return;
      }

      if (!data || data.length === 0) {
        alert("Only the creator of this questionnaire can delete it.");
        return;
      }

      alert("Questionnaire deleted successfully.");
      this.fetchQuestionnaires();
    }
  }
   /*Angular takes me to the manage-questions page
    and tells the manage-questions page which questionnaire to upload using its ID
    */

  editQuestionnaire(id: string) {
    this.router.navigate(['/manage-questions'], { queryParams: { id: id } });
  }

  viewResults(id: string) {
     this.router.navigate(['/results', id]);
}

/**
 * Builds the public form link using the current domain
 */

//takes the questionnaire's unique slug as a parameter, combines it with the application's current domain name,
//  and returns the complete public link

  getPublicLink(slug: string): string 
  {
    return `${window.location.origin}/form/${slug}`;
  }

  getQrCode(slug: string): string 
  {
    const link = this.getPublicLink(slug);
     return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(link)}`;
  }

  get publishedCount(): number 
  {
    return this.questionnaires.filter(q => q.is_published).length;
  }

  get draftCount(): number 
  {
    return this.questionnaires.filter(q => !q.is_published).length;
  }

  /**
   * Publishes a questionnaire by setting is_published to true.
   * The slug is already generated in the DB so we just activate it.
   */
  async publishQuestionnaire(id: string, title: string) {
      const confirmed = confirm(`Publish "${title}"? This will generate a public link for patients.`);
  if (!confirmed) return;

  //Mark this questionnaire as published in Supabase
    const { error } = await this.supabase.supabase
         .from('questionnaires')
      .update({ is_published: true })
        .eq('id', id);

    if (error) {
      alert("Failed to publish: " + error.message);
      return;
    }

    await this.fetchQuestionnaires();

    // Show the public link after publishing
    const published = this.questionnaires.find(q => q.id === id); //finds the questionnaire that has been requested using their ID
    if (published) {
      const link = `${window.location.origin}/form/${published.slug}`; //Base URL = the part of a website address that stays the same for every page
      alert(`"${title}" is now published!\n\nPublic link:\n${link}`);
    }
  }

  /**
   * Unpublishes a questionnaire by setting is_published to false.
   * Retains all historical patient data.
   */
  async unpublishQuestionnaire(id: string, title: string) {
    const confirmed = confirm(`Unpublish "${title}"? Patients will no longer be able to access the form, but all submitted data will be kept.`);
    if (!confirmed) return;

    const { error } = await this.supabase.supabase
        .from('questionnaires')
      .update({ is_published: false })
    .eq('id', id);

    if (error) {
      alert("Failed to unpublish: " + error.message);
      return;
    }

    alert(`"${title}" has been unpublished.`);
    this.fetchQuestionnaires();
  }
}
