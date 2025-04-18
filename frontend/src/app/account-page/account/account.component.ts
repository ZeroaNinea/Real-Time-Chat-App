import { Component, inject, OnInit } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { MatTabsModule } from '@angular/material/tabs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

import { AccountInfoComponent } from '../account-info/account-info.component';
import { environment } from '../../../environments/environment';
import { AccountEmailComponent } from '../account-email/account-email.component';
import { User } from '../../auth/shared/user.model';
import { UsernameBioComponent } from '../username-bio/username-bio.component';
import { PasswordComponent } from '../password/password.component';

@Component({
  selector: 'app-account',
  imports: [
    AccountInfoComponent,
    AccountEmailComponent,
    MatTabsModule,
    UsernameBioComponent,
    PasswordComponent,
    MatSidenavModule,
    MatListModule,
  ],
  standalone: true,
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent implements OnInit {
  private http = inject(HttpClient);

  // user: User | null = null;
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
