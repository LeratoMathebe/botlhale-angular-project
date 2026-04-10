import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DataService } from '../data';  
import { Router } from '@angular/router';

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './questionnaire.html',
  styleUrl: './questionnaire.css',
})
export class Questionnaire {

  constructor(private dataService: DataService, private router: Router) {}

  name: string = '';
  age: string = '';
  food: string = '';

  responses: { name: string; age: string; food: string }[] = []; //array to store responses by the users

  submit() {
    // Store the current response in the responses array
    this.dataService.responses.push({
      name: this.name,
      age: this.age,
      food: this.food
    });

    // Clear the form fields after submission
    this.name = '';
    this.age = '';
    this.food = '';

    //navigate to the results page 
    this.router.navigate(['/results']);
  }
}
