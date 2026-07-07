import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../services/supabase';
import { CustomValidators } from '../register/utils/custom-validators';

@Component({
  selector: 'app-public-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './public-form.html',
  styleUrl: './public-form.css',
})
export class PublicForm implements OnInit {
  questionnaire: any = null;
  questions: any[] = [];
  patientForm!: FormGroup; //this the actual reactive form where answers are stored
  isLoading = true; //shows loading spinner while data is being fetched
  isSubmitted = false; //tracks whether the user has submitted the form
  notFound = false; //used when the questionnaire ID in URL does not exist
  isDuplicate = false; //Tracks if the currrent browser already submitted this form
  currentSlug = '';  //Remembers the slug for localStorage keys 

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // 1. If your router configuration uses ':slug' in the path but receives the ID string, read it here:
    const idOrSlug = this.route.snapshot.paramMap.get('slug'); 
    if (idOrSlug) {
      this.currentSlug = idOrSlug;

    //   if(typeof window !== 'undefined' && window.localStorage) {
    //    if (localStorage.getItem(`submitted_${idOrSlug}`) === 'true') {
    //     this.isDuplicate = true;
    //     this.isLoading = false;
    //     this.cdr.detectChanges();
    //     return;
    //   }
    // }

      this.loadForm(idOrSlug); //if URL contains a slug, load the form from database
    } else {
      this.notFound = true;
      this.isLoading = false;
    }
  }

  async loadForm(slug: string) {
   
    try //find one questionnaire where slug mathces the URL and is published
    {
      const { data: qData, error: qError } = await this.supabase.supabase
        .from('questionnaires')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

        //if no questionnaire found OR database error happened then show "not found" and stop execution
      if (qError || !qData) {
        this.notFound = true;
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
      }

      this.questionnaire = qData; //save the questionnaire so the UI can display it

      //get all questions that belong to this questionnaire from the database
      const { data: qsData, error: qsError } = await this.supabase.supabase
        .from('questions')
        .select('*')
        .eq('questionnaire_id', qData.id)
        .order('page_number', { ascending: true })
        .order('order_index', { ascending: true });

      if (qsError) throw qsError;

      this.questions = qsData || [];

     const formControls: any = {}; //structure of the form
      this.questions.forEach(q => {
      const validators = []; //each question gets its own rules

   //Validation
  if (q.is_required) validators.push(Validators.required);
  if (q.validation_type === 'sa_id') validators.push(CustomValidators.saID());
  if (q.validation_type === 'sa_phone') validators.push(CustomValidators.saPhone());

  formControls[q.key] = ['', validators];
});
     

      this.patientForm = this.fb.group(formControls); //convert object into Angular Reactive Form
      //REACTIVE FORM LOCK: If it's a duplicate entry, lock down all all controls cleanly
      if (this.isDuplicate) 
        {
        this.patientForm.disable();
      }

   this.isLoading = false;
      this.cdr.detectChanges(); // Helps refresh and show lastest results


    } catch (error: any) {
       console.error("Load Error:", error);
    this.notFound = true;
      this.isLoading = false;
        this.cdr.detectChanges();
    }
  }

  //All required fields must be filled in before submission
  async submitForm() {

    //Safety Net: Guard against forced submissions
    // if (this.isDuplicate) {
    //   alert("You have already submitted responses for this questionnaire.");
    //   return;
    // }


    if (this.patientForm.invalid) {
       this.patientForm.markAllAsTouched();
      alert("Please fill in all required fields.");
      return;
    }

    //Creates a new row in the submissions table for that specific entry
    try {
      const { data: submission, error: subError } = await this.supabase.supabase
        .from('submissions')
        .insert({ questionnaire_id: this.questionnaire.id })
        .select()
        .single();

      if (subError) throw subError;

      const answersToInsert = this.questions.map(q =>  /*loops through every question and builds answer objects*/
        (
        {
        submission_id: submission.id,
        question_id: q.id,
        answer_value: this.patientForm.value[q.key] || '' //gets the user's answer from the form
      }
    )
  );
     //adds the answers from the questionnaire that has just been submitted
      const { error: ansError } = await this.supabase.supabase
        .from('answers')
        .insert(answersToInsert);

      if (ansError) throw ansError;

      //Set the duplicate flag in the browser local storage upon successful completion!
      if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(`submitted_${this.currentSlug}`, 'true');
      }

      this.isSubmitted = true;
      this.cdr.detectChanges();

      /*If anything fails:
      -submission insert
      -answer insert
      -database issue
      then log an error message in alignment to that specific error */
      
    } catch (error: any) {
      console.error("Submit Error:", error);
      alert("Failed to submit: " + error.message);
    }
  }
  hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
}

