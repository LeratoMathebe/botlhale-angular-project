import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
//OnInit -> lets the component do something when it first starts
//ChangeDetectorRef -> helps Angular notice changes and update the screen

import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
//FormControl -> one input field e.g name
//FormGroup -> a box holding many input fields together e.g name, email, password
//FormArray - a list that can hold many FormGroups
//ReactiveFormsModule -> for FormControl, FormGroup, FormArray to work, we need this (our toolbox)
//Validators -> checks if the user filled in the form correctly

import { CommonModule } from '@angular/common';
//gives Angular basic tools like *ngIf and *ngFor so you can show/hide or loop things in your HTML

import { SupabaseService } from '../services/supabase';
//your custom service that connects your Angular app to Supabase so you can save, read, update, and delete data from a database

import { RouterLink, Router, ActivatedRoute } from '@angular/router';
//RouterLink -> lets you click something in HTML and go to a different page
//Router -> lets you navigate between pages using TypeScript code
//ActivatedRoute -> lets you read info from the URL, like query parameters (?id=123)

import { CustomValidators } from '../register/utils/custom-validators';
//Custom validation functions for forms, like checking if two password fields match

@Component({
  selector: 'app-manage-questions',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './manage-questions.html',
})
export class ManageQuestions implements OnInit {
  adminForm: FormGroup;
  editingId: string | null = null; // Holds the ID if we are in edit mode
  editingTitle: string = '';  //Holds the existing title if we are in edit mode
  showPreview = false;   //false ="the preview window is currently closed" => true "open"

  constructor(
    private fb: FormBuilder, //used to create form easily
    private supabase: SupabaseService, //used to save, read, update, delete data from Supabase
    private router: Router, //used to move to another page after form submit
    private route: ActivatedRoute, //used to read URL info
    private cdr: ChangeDetectorRef  //helps Angular notice changes and updates the screen
  ) {
    //creates a form (adminForm) that contains a list (array) of questions
    //  and right now that list starts empty.
    this.adminForm = this.fb.group({
      questionnaire_description: [''], //this is where you can add a description field for the questionnaire if you want
      questions: this.fb.array([]),
      primary_colour: ['#967010'],
      logo_url: ['']
    });
  }

  ngOnInit() {
    //this code is listening to the URL and checking:
    //"Did the URL inlcude an id? if yes, load existing data for editing"
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.editingId = params['id'];
        this.loadQuestionnaire(this.editingId!);
      }
    });
  }
  //This code creates a shortcut that lets you easily access the 'questions' FormArray inside adminForm
  get questions() {
    return this.adminForm.get('questions') as FormArray;
  }

  /**
   * EDIT MODE: Loads existing questionnaire and populates the form
   */
  async loadQuestionnaire(id: string) {
    try {
      // 1. Fetch the questionnaire title using its ID from the database
      const { data: qData, error: qError } = await this.supabase.supabase 
        .from('questionnaires') 
        .select('title, description, primary_colour, logo_url')
        .eq('id', id)
        .single(); //only want one result

      if (qError) throw qError; //if you can't find it, throw an error
      this.editingTitle = qData.title; //if you've found it, save and display the title
      
      //Patch the existing description text directly into the main questionnaire
      this.adminForm.patchValue({
        questionnaire_description: qData.description || '', //if there's a description, show it. If not, show empty string
        primary_colour: qData.primary_colour || '#15803d',
        logo_url: qData.logo_url || ''

      });

      // 2. Fetch its questions ordered by order_index
    const { data: qsData, error: qsError } = await this.supabase.supabase
        .from('questions')
      .select('*')
        .eq('questionnaire_id', id)
       .order('order_index', { ascending: true });

      if (qsError) throw qsError;

      //3. This code is taking questions from the database and putting them into your form.
      this.questions.clear();
      qsData.forEach(q => {
         this.questions.push(this.fb.group({
          id: [q.id],
           label: [q.label, Validators.required],
         key: [q.key, Validators.required],
          type: [q.type],
           options: [q.options ? q.options.join(', ') : ''],
         page_number: [q.page_number],
            is_required: [q.is_required],
        validation_type: [q.validation_type]
        }));

      });

      this.cdr.detectChanges(); // Ensure the form updates after async load

      
      /*If something goes wrong while loading the questionnaire, show the error */
    } catch (error: any) {
      console.error("Load Error:", error);
      alert(" Failed to load questionnaire: " + error.message);
    }
  }

  //Creates a new empty question form and adds it to the questions list
  addQuestion() {
    const qGroup = this.fb.group({
      label: ['', Validators.required],
      key: ['', Validators.required],
      type: ['text'],
      options: [''],
      page_number: [1],
      is_required: [false],
      validation_type: ['none']
    });
    this.questions.push(qGroup);
  }

  //removes a question from the FormArray based on its position (index) in the list 
  //e.g 0 = first question, 1 = second question, etc
  removeQuestion(index: number) {
    this.questions.removeAt(index);
  }

  /**
   * SAVE LOGIC
   * Creates a new questionnaire OR updates an existing one depending on mode
   */

  async saveStructure() {
if (this.adminForm.invalid || this.questions.length === 0) {
    alert("Please fill in all fields and add at least one question.");
    return;
  }

  let questionnaireTitle = this.editingTitle;
  if (!this.editingId) {
    const prompted = prompt("Enter a name for this questionnaire:");
    if (!prompted?.trim()) return;
    questionnaireTitle = prompted;
  }

  try {
    let questionnaireId = this.editingId;

    if (this.editingId) {
      // 1. Update Header
      const { error: updateError } = await this.supabase.supabase
        .from('questionnaires')
        .update({ 
          title: questionnaireTitle,
          description: this.adminForm.get('questionnaire_description')?.value,
          updated_at: new Date().toISOString() 
        })
        .eq('id', this.editingId);
      if (updateError) throw updateError;

      // 2. Delete OLD questions FIRST
      const { error: deleteError } = await this.supabase.supabase
        .from('questions')
        .delete()
        .eq('questionnaire_id', this.editingId);

      if (deleteError) throw deleteError;

    } else {
      // Create mode
      const { data: newQ, error: qError } = await this.supabase.supabase
        .from('questionnaires')
        .insert([{ title: questionnaireTitle, owner_id: (await this.supabase.supabase.auth.getUser()).data.user?.id }])
        .select()
        .single();
      if (qError) throw qError;
      questionnaireId = newQ.id;
    }

    // 3. Insert NEW questions
    const questionsToInsert = this.questions.controls.map((control, index) => ({
      questionnaire_id: questionnaireId,
      label: control.value.label,
      key: control.value.key,
      type: control.value.type,
      options: control.value.type === 'radio' ? ['Yes', 'No'] : null, // Simplified for brevity
      order_index: index,
      is_required: control.value.is_required
    }));

    const { error: insertError } = await this.supabase.supabase
      .from('questions')
      .insert(questionsToInsert);

    if (insertError) throw insertError;

    alert("Saved successfully!");
    this.router.navigate(['/dashboard']);

  } catch (error: any) {
    console.error("Save Error:", error);
    alert("Critical failure: " + error.message);
  }
}
  // Toggles the preview modal on and off.

togglePreview() {
  this.showPreview = !this.showPreview;
}
}
