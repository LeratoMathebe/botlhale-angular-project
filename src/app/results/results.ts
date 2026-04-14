// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-results',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './results.html',
//   styleUrl: './results.css'
// })
// export class Results implements OnInit {

//   data: any[] = [];

//   ngOnInit() {
//     const storedData = localStorage.getItem('healthData');
//     this.data = storedData ? JSON.parse(storedData) : [];

//     console.log("Loaded data:", this.data);
//   }
// }

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './results.html',
  styleUrl: './results.css'
})
export class Results implements OnInit {

  data: any[] = []; // ✅ MUST be array

  ngOnInit() {
    const storedData = localStorage.getItem('questionnaires');

    if (storedData) {
      this.data = JSON.parse(storedData);
    } else {
      this.data = [];
    }

    console.log("Loaded data:", this.data); // 🔍 Debug
  }
}

