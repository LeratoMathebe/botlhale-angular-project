import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../services/supabase'; 
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-manage-questions',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './manage-questions.html', 
})
export class ManageQuestions implements OnInit {
  adminForm: FormGroup;

  constructor(private fb: FormBuilder, private supabase: SupabaseService) {
    this.adminForm = this.fb.group({
      questions: this.fb.array([])
    });
  }

  ngOnInit() {
    // Later, we will fetch existing questions here
  }

  // Helper to access the FormArray
  get questions() {
    return this.adminForm.get('questions') as FormArray;
  }

  addQuestion() {
    const qGroup = this.fb.group({
      label: ['', Validators.required],
      key: ['', Validators.required],
      type: ['text'], 
      options: [''], 
      page_number: [1], 
      is_required: [false]
    });
    this.questions.push(qGroup);
  }

  removeQuestion(index: number) {
    this.questions.removeAt(index);
  }

  async saveStructure() {
    // 1. Validate the form
    if (this.adminForm.invalid) {
      alert("Please fill in all question fields before saving.");
      return;
    }

    // 2. Check if there is actually data to save
    if (this.questions.length === 0) {
      alert("Please add at least one question.");
      return;
    }

    // 3. Process data: Reset order_index per page number
    const pageCounters: { [key: number]: number } = {};

    const formData = this.questions.controls.map((control) => {
      const pageNum = control.value.page_number || 1;
      
      // Increment the count specifically for this page number
      pageCounters[pageNum] = (pageCounters[pageNum] || 0) + 1;

      return {
        ...control.value,
        order_index: pageCounters[pageNum] 
      };
    });

    try {
      // 4. Clear existing entries to prevent duplicates
      const { error: deleteError } = await this.supabase.supabase
        .from('questionnaire_structure')
        .delete()
        .neq('id', 0); 

      if (deleteError) throw deleteError;

      // 5. Insert the newly ordered structure
      const { error: insertError } = await this.supabase.supabase
        .from('questionnaire_structure')
        .insert(formData);

      if (insertError) throw insertError;

      alert("✅ Questionnaire structure successfully saved to Supabase!");

    } catch (error: any) {
      console.error("Critical Save Error:", error);
      alert("❌ Failed to save structure: " + error.message);
    }
  }
}
