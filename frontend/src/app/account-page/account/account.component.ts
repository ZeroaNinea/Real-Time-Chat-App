import { Component, inject, OnInit } from '@angular/core';

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
    MatTabsModule,
    MatSidenavModule,
    MatListModule,
  ],
  standalone: true,
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent implements OnInit {
  private http = inject(HttpClient);
  user!: User;

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
