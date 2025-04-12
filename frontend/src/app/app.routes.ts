import { Routes } from '@angular/router';
import { RegisterComponent } from './auth/register/register.component';
import { ChatComponent } from './chat/chat.component';
import { LoginComponent } from './auth/login/login.component';

export const routes: Routes = [
  {
    path: '',
    component: ChatComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
];
