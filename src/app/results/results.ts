import { Component } from '@angular/core';
import { DataService } from '../data';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './results.html',
  styleUrl: './results.css',
})
export class Results {

  constructor(public dataService: DataService) {}

}
