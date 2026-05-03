import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Register } from './register/register';
import { ManageQuestions } from './manage-questions/manage-questions';
import { Results } from './results/results';
import { Login } from './login/login';



export const routes: Routes = [
  // 1. Default landing page
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  // 2. Auth routes
  {path: 'login', component: Login},
   {path: 'register', component: Register}, 

   // 3. App pages
  {path: 'home', component: Home}, 
  {path: 'manage-questions', component: ManageQuestions},
  {path : 'results', component: Results}
 
];


