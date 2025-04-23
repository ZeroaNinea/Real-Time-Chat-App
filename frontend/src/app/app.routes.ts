import { Routes } from '@angular/router';
import { RegisterComponent } from './auth/register/register.component';
import { ChatComponent } from './chat/chat-room-page/chat/chat.component';
import { LoginComponent } from './auth/login/login.component';
import { HomeComponent } from './home/home.component';
import { AccountComponent } from './account-page/account/account.component';
import { authGuard } from './auth/auth.guard';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'account',
    component: AccountComponent,
    canActivate: [authGuard],
  },
  {
    path: '401',
    component: UnauthorizedComponent,
  },
];
