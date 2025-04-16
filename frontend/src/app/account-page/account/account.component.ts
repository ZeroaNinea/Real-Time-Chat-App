import { Component, inject, OnInit } from '@angular/core';
import { AccountInfoComponent } from '../account-info/account-info.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-account',
  imports: [AccountInfoComponent],
  standalone: true,
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent implements OnInit {
  private http = inject(HttpClient);

  user: {
    username: string;
    email?: string;
    createdAt: string;
  } | null = null;

  ngOnInit() {
    this.http
      .get<{ username: string; email?: string; createdAt: string }>(
        `${environment.backendUrl}/auth/account`
      )
      .subscribe({
        next: (data) => {
          this.user = data;
        },
        error: (error) => {
          console.error('Error fetching user data', error);
        },
      });
  }
}
