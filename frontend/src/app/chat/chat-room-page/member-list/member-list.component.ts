import { Component, Input } from '@angular/core';
import { PopulatedUser } from '../../shared/models/populated-user.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-member-list',
  imports: [],
  standalone: true,
  templateUrl: './member-list.component.html',
  styleUrl: './member-list.component.scss',
})
export class MemberListComponent {
  @Input() members: PopulatedUser[] = [];
  environment = environment;
}
