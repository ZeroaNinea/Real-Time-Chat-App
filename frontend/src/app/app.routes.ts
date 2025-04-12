import { Routes } from '@angular/router';
import { RegisterComponent } from './auth/register/register.component';
import { ChatComponent } from './chat/chat.component';

export const routes: Routes = [
  {
    path: '',
    component: ChatComponent,
  },
  {
    path: 'auth/register',
    component: RegisterComponent,
  },
];
