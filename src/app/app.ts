import {Component} from '@angular/core';
import { RouterModule } from '@angular/router';
import { Navigation } from '@angular/router';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, RouterLink, RouterOutlet, RouterLinkActive], 
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App { }