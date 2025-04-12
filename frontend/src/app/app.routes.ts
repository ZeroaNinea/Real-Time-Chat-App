import { Routes } from '@angular/router';
import { RegisterComponent } from './auth/register/register.component';
import { AppComponent } from './app.component';

export const routes: Routes = [
  {
    path: '',
    component: AppComponent,
  },
  {
    path: 'auth/register',
    component: RegisterComponent,
  },
];
