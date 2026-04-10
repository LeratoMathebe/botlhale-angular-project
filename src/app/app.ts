import {Component} from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule], //we don't import Questionnaire here anymore because routing handles it
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App { }