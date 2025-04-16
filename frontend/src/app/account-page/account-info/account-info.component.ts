import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { User } from '../../auth/shared/user.model';

@Component({
  selector: 'app-account-info',
  imports: [DatePipe],
  standalone: true,
  templateUrl: './account-info.component.html',
  styleUrl: './account-info.component.scss',
})
export class AccountInfoComponent {
  @Input() user!: User;
}
