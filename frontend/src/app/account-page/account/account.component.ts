import { Component } from '@angular/core';
import { AccountInfoComponent } from '../account-info/account-info.component';

@Component({
  selector: 'app-account',
  imports: [AccountInfoComponent],
  standalone: true,
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent {}
