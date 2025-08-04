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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

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
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
  ],
  standalone: true,
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss', './account.component.media.scss'],
})
export class AccountComponent implements OnInit {
  private wsService = inject(WebsocketService);
  private idleService = inject(IdleService);

  private http = inject(HttpClient);
  user!: User;

  onlineUsers = signal<Set<string>>(new Set());
  typingUsers = signal(new Map<string, Set<string>>());

  isSmallScreen = window.innerWidth <= 768;

  constructor() {
    afterNextRender(() => {
      this.wsService.disconnect();
      this.wsService.connect();
      this.idleService.init(this.wsService);
    });
  }

  setSection(section: string) {
    this.selectedSection = section;
  }

  selectedSection = 'username-bio';

  sections = [
    { key: 'username-bio', label: 'Username & Bio' },
    { key: 'pronouns', label: 'Pronouns' },
    { key: 'email', label: 'Email' },
    { key: 'password', label: 'Password' },
    { key: 'avatar', label: 'Avatar' },
    { key: 'logout', label: 'Log Out' },
    { key: 'delete', label: 'Delete Account' },
    { key: 'navigation', label: 'Navigation' },
  ];

  ngOnInit() {
    this.http.get<User>(`${environment.backendUrl}/auth/account`).subscribe({
      next: (data) => {
        this.user = data;
      },
      error: (error) => {
        console.error('Error fetching user data', error);
      },
    });

    window.addEventListener('resize', () => {
      this.isSmallScreen = window.innerWidth <= 768;
    });
  }
}
