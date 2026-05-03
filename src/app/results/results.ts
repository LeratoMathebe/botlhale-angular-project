import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './results.html',
  styleUrl: './results.css'
})
export class Results implements OnInit {

  data: any[] = [];
  filteredData: any[] = [];
  questionnaires: any[] = [];
  searchText: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    const storedData = localStorage.getItem('healthData');

    this.data = storedData ? JSON.parse(storedData) : [];
    this.filteredData = this.data;

     const storedForms = localStorage.getItem('questionnaires');
    this.questionnaires = storedForms ? JSON.parse(storedForms) : [];

  console.log("Responses:", this.data);
  console.log("Questionnaires:", this.questionnaires);
  }

  // 🔍 SEARCH
  onSearch() {
    const text = this.searchText.toLowerCase();

    this.filteredData = this.data.filter(item =>
      (item.firstName + ' ' + item.lastName).toLowerCase().includes(text) ||
      (item.idNumber || '').toLowerCase().includes(text)
    );
  }

  // 🗑 DELETE (SAFE VERSION)
  deleteEntry(index: number) {
    const itemToDelete = this.filteredData[index];

    // remove from main array
    this.data = this.data.filter(item => item !== itemToDelete);

    // update storage
    localStorage.setItem('healthData', JSON.stringify(this.data));

    // refresh filtered data
    this.onSearch();
  }

  // ✏️ EDIT
  startEdit(index: number) {
    const item = this.data[index];

  localStorage.setItem('editData', JSON.stringify(item));
  localStorage.setItem('editIndex', index.toString());

  this.router.navigate(['/questionnaire']);
}
}

