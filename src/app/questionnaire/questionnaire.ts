import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './questionnaire.html',
  styleUrl: './questionnaire.css',
})
export class Questionnaire {

  form: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {

    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      idNumber: [''],

      hypertension: ['', Validators.required],
      diabetes: ['', Validators.required],

      medication: ['', Validators.required],
      medicationList: [''],

      symptoms: ['', Validators.required],
      symptomDetails: [''],

      smoke: ['', Validators.required],
      alcohol: ['', Validators.required],

      exercise: ['', Validators.required],

      allergies: ['', Validators.required],
      allergyDetails: [''],

      checkups: ['', Validators.required],
      comments: ['']
    });

    // ✅ Q3 → Q4 (FIXED)
    this.form.get('medication')?.valueChanges.subscribe(value => {
      const field = this.form.get('medicationList');

      if (value === 'Yes') { // ✅ FIXED
        field?.setValidators([Validators.required]);
      } else {
        field?.clearValidators();
        field?.setValue('');
      }

      field?.updateValueAndValidity();
    });

    // ✅ Q5 → Q6
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

    // ✅ Q10 → Q11
    this.form.get('allergies')?.valueChanges.subscribe(value => {
      const field = this.form.get('allergyDetails');

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

    console.log("Submit clicked"); // 🔍 Debug

    if (this.form.invalid) {
      alert("Please fill in all required fields");
      this.form.markAllAsTouched();
      return;
    }

    const newEntry = this.form.value;

    // ✅ USE SAME KEY AS RESULTS PAGE
    const existingData = localStorage.getItem('questionnaires');
    const dataArray = existingData ? JSON.parse(existingData) : [];

    dataArray.push(newEntry);

    localStorage.setItem('questionnaires', JSON.stringify(dataArray));

    console.log("Saved:", newEntry); // 🔍 Debug

    this.router.navigate(['/results']);
  }
}




