import { Routes } from '@angular/router';
import { Questionnaire } from './questionnaire/questionnaire';
import { Home } from './home/home';
import { Results } from './results/results';

export const routes: Routes = [
    {path: '', component: Home}, //default page
  { path: 'questionnaire' , component: Questionnaire },
  {path : 'results', component: Results}
];
