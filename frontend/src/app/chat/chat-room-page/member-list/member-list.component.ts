import { Component, inject, Input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';

import { PopulatedUser } from '../../shared/models/populated-user.model';
import { environment } from '../../../../environments/environment';

import { UserCardDialogComponent } from '../../dialogs/user-card-dialog/user-card-dialog.component';

@Component({
  selector: 'app-member-list',
  imports: [MatListModule],
  standalone: true,
  templateUrl: './member-list.component.html',
  styleUrl: './member-list.component.scss',
})
export class MemberListComponent {
  private dialog = inject(MatDialog);

  @Input() members: PopulatedUser[] = [];
  environment = environment;

  getAvatarUrl(userId: string): string {
    const avatar = this.members.find((m) => m.user._id === userId)?.user.avatar;
    return avatar
      ? `${this.environment.backendUrl}/${avatar}`
      : 'assets/camera.svg';
  }

  openUserDialog(member: PopulatedUser) {
    this.dialog.open(UserCardDialogComponent, {
      data: member,
      width: '400px',
    });
  }
}
