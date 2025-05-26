import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-role-management',
  imports: [],
  standalone: true,
  templateUrl: './role-management.component.html',
  styleUrl: './role-management.component.scss',
})
export class RoleManagementComponent {
  @Input() isAdmin: boolean = false;
  @Input() isOwner: boolean = false;
  @Input() isModerator: boolean = false;
}
