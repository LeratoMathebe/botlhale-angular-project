import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Register } from './register/register';
import { ManageQuestions } from './manage-questions/manage-questions';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { authGuard } from './auth.guard';
import { PublicForm } from './public-form/public-form';
import { Results } from './results/results';
import { ResetPassword } from './reset-password/reset-password';
import { Profile } from './profile/profile';
import { Admin } from './admin/admin';
import {adminGuard} from './admin.guard';


export const routes: Routes = [
  // 1. Default landing page
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  
  // 2. Auth routes
  {path: 'login', component: Login},
  {path: 'register', component: Register}, 

   // 3. App pages
  {path: 'home', component: Home, canActivate: [authGuard]}, 
  {path: 'manage-questions', component: ManageQuestions, canActivate: [authGuard]},
  {path: 'dashboard', component: Dashboard, canActivate: [authGuard]},
  {path: 'results/:id', component: Results, canActivate: [authGuard]},
  {path: 'form/:slug', component: PublicForm},
  {path: 'forgot-password', component: ResetPassword}, //no authGuard because patients don't need to log in to fill out the form
  {path: 'reset-password', component: ResetPassword},
  {path: 'profile', component: Profile, canActivate: [authGuard]},
  {path: 'admin', component: Admin, canActivate: [adminGuard]}
];

//Auth Guards are like check permission before entering (canActivate)


