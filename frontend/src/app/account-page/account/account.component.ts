import { Component, inject, OnInit } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { MatTabsModule } from '@angular/material/tabs';

import { AccountInfoComponent } from '../account-info/account-info.component';
import { environment } from '../../../environments/environment';
import { AccountEmailComponent } from '../account-email/account-email.component';
import { User } from '../../auth/shared/user.model';
import { UsernameBioComponent } from '../username-bio/username-bio.component';

@Component({
  selector: 'app-account',
  imports: [
    AccountInfoComponent,
    AccountEmailComponent,
    MatTabsModule,
    UsernameBioComponent,
  ],
  standalone: true,
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent implements OnInit {
  private http = inject(HttpClient);

  user: User | null = null;

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
