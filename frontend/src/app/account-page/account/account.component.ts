import {
  afterNextRender,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { MatTabsModule } from '@angular/material/tabs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

import { environment } from '../../../environments/environment';
import { AccountEmailComponent } from '../account-email/account-email.component';
import { User } from '../../auth/shared/user.model';
import { UsernameBioComponent } from '../username-bio/username-bio.component';
import { PasswordComponent } from '../password/password.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { DeleteAccountComponent } from '../delete-account/delete-account.component';
import { PronounsComponent } from '../pronouns/pronouns.component';
import { LogoutComponent } from '../logout/logout.component';
import { UserCardComponent } from '../user-card/user-card.component';
import { AccountNavigationComponent } from '../account-navigation/account-navigation.component';

import { WebsocketService } from '../../chat/shared/services/websocket/websocket.service';
import { IdleService } from '../../shared/services/idle/idle.service';

@Component({
  selector: 'app-account',
  imports: [
    UserCardComponent,
    AccountEmailComponent,
    AvatarComponent,
    DeleteAccountComponent,
    UsernameBioComponent,
    PasswordComponent,
    PronounsComponent,
    LogoutComponent,
    AccountNavigationComponent,
    MatTabsModule,
    MatSidenavModule,
    MatListModule,
  ],
  standalone: true,
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent implements OnInit {
  private wsService = inject(WebsocketService);
  private idleService = inject(IdleService);

  private http = inject(HttpClient);
  user!: User;

  onlineUsers = signal<Set<string>>(new Set());
  typingUsers = signal(new Map<string, Set<string>>());

  constructor() {
    afterNextRender(() => {
      this.wsService.disconnect();
      this.wsService.connect();
      this.idleService.init(this.wsService);

      this.wsService.listenInitialOnlineUsers().subscribe((userIds) => {
        // console.log('Initial online users: ', userIds);
        this.onlineUsers.set(new Set(userIds));
      });

      this.wsService.listenUserOnline().subscribe((userId) => {
        // console.log('User online: ', userId);
        const current = new Set(this.onlineUsers());
        current.add(userId);
        this.onlineUsers.set(current);
      });

      this.wsService.listenUserOffline().subscribe((userId) => {
        // console.log('User offline: ', userId);
        const current = new Set(this.onlineUsers());
        current.delete(userId);
        this.onlineUsers.set(current);
      });

      this.wsService.listenTypingStart().subscribe(({ userId, channelId }) => {
        // console.log('Typing start...');
        const current = this.typingUsers();
        const updated = new Map(current);

        const oldSet = updated.get(channelId) ?? new Set<string>();
        const newSet = new Set(oldSet);
        newSet.add(userId);

        updated.set(channelId, newSet);

        this.typingUsers.set(updated);

        // console.log('Typing users: ', this.typingUsers());
      });

      this.wsService.listenTypingStop().subscribe(({ userId, channelId }) => {
        // console.log('Typing stop...');
        const current = this.typingUsers();
        const updated = new Map(current);

        const oldSet = updated.get(channelId);
        if (!oldSet) return;

        const newSet = new Set(oldSet);
        newSet.delete(userId);

        if (newSet.size === 0) {
          updated.delete(channelId);
        } else {
          updated.set(channelId, newSet);
        }

        this.typingUsers.set(updated);

        // console.log('Typing users: ', this.typingUsers());
      });
    });
  }

  setSection(section: string) {
    this.selectedSection = section;
  }

  selectedSection = 'username-bio';

  ngOnInit() {
    this.http.get<User>(`${environment.backendUrl}/auth/account`).subscribe({
      next: (data) => {
        this.user = data;
      },
      error: (error) => {
        console.error('Error fetching user data', error);
      },
    });
  }
}
