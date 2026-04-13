import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './questionnaire.html',
  styleUrl: './questionnaire.css',
})
export class Questionnaire {

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      //Q1 - Q2
      hypertension: ['', Validators.required],
      diabetes: ['', Validators.required],

      //Q3-Q4
      medication: ['', Validators.required],
      medicationList: [''],

      //Q5-Q6
      symptoms: ['', Validators.required],
      symptomDetails: [''],

      //Q7-Q8
      smoke: ['', Validators.required],
      alcohol: ['', Validators.required],

      //Q9-Q11
      exercise:['', Validators.required],
      allergies:['', Validators.required],
      checkups:['', Validators.required],

      //Q12
      comments: ['']
      
    });

    //Q3-> Q4 logic (Medication)
    this.form.get('medication')?.valueChanges.subscribe(value => {
      const field = this.form.get('medicationList');

      if (value === 'yes') {
        field?.setValidators(Validators.required);
      } else {
        field?.clearValidators();
        field?.setValue('');
      }
      field?.updateValueAndValidity();
    });

    // 🔥 Q5 → Q6 logic (Symptoms)
    this.form.get('symptoms')?.valueChanges.subscribe(value => {
      const field = this.form.get('symptomDetails');

      if (value === 'Yes') {
        field?.setValidators([Validators.required]);
      } else {
        field?.clearValidators();
        field?.setValue('');
      }

      field?.updateValueAndValidity();
    });
  }

  onSubmit() {
    if (this.form.valid) {
      console.log(this.form.value);
      alert('Form submitted successfully!');
    } else {
      this.form.markAllAsTouched();
    }
  }
}




