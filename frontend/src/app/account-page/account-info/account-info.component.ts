import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-account-info',
  imports: [DatePipe],
  standalone: true,
  templateUrl: './account-info.component.html',
  styleUrl: './account-info.component.scss',
})
export class AccountInfoComponent {
  @Input() user!: {
    username: string;
    email?: string;
    createdAt: string;
  };
}
