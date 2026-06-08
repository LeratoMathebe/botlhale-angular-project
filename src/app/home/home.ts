// import { Component } from '@angular/core';
// import { RouterModule } from '@angular/router';
// import { RouterLink } from '@angular/router';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-home',
//   standalone: true,
//   imports: [RouterModule, RouterLink, CommonModule],
//   templateUrl: './home.html',
//   styleUrl: './home.css',
// })
// export class Home {}

import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  // 1. Declare the dynamic userName property that the HTML layout expects
  userName: string = '';

  ngOnInit(): void {
    // 2. Safely check browser storage on initialization
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('userName');
      
      // If found, format it cleanly; otherwise, fall back to a warm professional greeting
      this.userName = storedName ? storedName.trim() : 'Valued Member';
    }
  }
}
