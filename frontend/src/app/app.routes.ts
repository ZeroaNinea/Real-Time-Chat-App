import { Routes } from '@angular/router';
import { RegisterComponent } from './auth/register/register.component';
import { LoginComponent } from './auth/login/login.component';
import { HomeComponent } from './home/home.component';
import { AccountComponent } from './account-page/account/account.component';
import { authGuard } from './auth/auth.guard';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { ChatRoomComponent } from './chat/chat-room-page/chat-room/chat-room.component';
import { MainComponent } from './chat/main-page/main/main.component';

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
    path: 'chat-room',
    component: ChatRoomComponent,
    canActivate: [authGuard],
  },
  {
    path: 'chat-room/:chatId',
    component: ChatRoomComponent,
    canActivate: [authGuard],
  },
  {
    path: 'chat-room/:chatId/channel/:channelId',
    component: ChatRoomComponent,
    canActivate: [authGuard],
  },
  {
    path: 'main',
    component: MainComponent,
    canActivate: [authGuard],
  },
  {
    path: '401',
    component: UnauthorizedComponent,
  },
];
