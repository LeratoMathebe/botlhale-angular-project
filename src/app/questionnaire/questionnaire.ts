import { Component, OnInit } from '@angular/core';
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
export class Questionnaire implements OnInit {

  form: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {

    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      idNumber: ['', Validators.required],

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
  }

  // ✅ CORRECT PLACE
  ngOnInit() {
    const editData = localStorage.getItem('editData');

    if (editData) {
      const data = JSON.parse(editData);

      this.form.patchValue({
        firstName: data.firstName,
        lastName: data.lastName,
        idNumber: data.idNumber,

        hypertension: data.hypertension,
        diabetes: data.diabetes,

        medication: data.medication,
        medicationList: data.medicationList,

        symptoms: data.symptoms,
        symptomDetails: data.symptomDetails,

        smoke: data.smoke,
        alcohol: data.alcohol,
        exercise: data.exercise,

        allergies: data.allergies,
        allergyDetails: data.allergyDetails,

        checkups: data.checkups,
        comments: data.comments
      });
    }

    // 🔥 MEDICATION logic
    this.form.get('medication')?.valueChanges.subscribe(value => {
      const field = this.form.get('medicationList');

      if (value === 'Yes') {
        field?.setValidators([Validators.required]);
      } else {
        field?.clearValidators();
        field?.setValue('');
      }

      field?.updateValueAndValidity();
    });

    // 🔥 SYMPTOMS logic
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

    // 🔥 ALLERGIES logic
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

   console.log("Submit clicked");

  if (this.form.invalid) {
    alert("Please fill in all required fields");
    this.form.markAllAsTouched();
    return;
  }

  const newEntry = this.form.value;

  const existingData = localStorage.getItem('healthData');
  const dataArray = existingData ? JSON.parse(existingData) : [];

  // 🔥 CHECK IF WE ARE EDITING
  const editIndex = localStorage.getItem('editIndex');

  if (editIndex !== null) {
    // UPDATE EXISTING ENTRY
    dataArray[+editIndex] = newEntry;

    localStorage.removeItem('editIndex');
    localStorage.removeItem('editData');

  } else {
    // ADD NEW ENTRY
    dataArray.push(newEntry);
  }

  localStorage.setItem('healthData', JSON.stringify(dataArray));

  console.log("Saved:", newEntry);

  this.router.navigate(['/results']);
  }
}



