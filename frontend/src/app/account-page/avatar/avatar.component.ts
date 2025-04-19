import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

import { User } from '../../auth/shared/user.model';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-avatar',
  imports: [CommonModule, MatButtonModule],
  standalone: true,
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
})
export class AvatarComponent {
  @Input() user!: User;
  @Output() userChange = new EventEmitter<User>();

  currentAvatar = `${environment.avatarPath}this.user.avatar`;

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
      this.selectedFile = input.files[0];
      this.previewUrl = URL.createObjectURL(this.selectedFile);
    }
  }

  uploadAvatar() {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('avatar', this.selectedFile);

    this.authService.uploadAvatar(formData).subscribe({
      next: (res) => {
        this.user.avatar = res.avatar;
        this.userChange.emit(this.user);
        this.snackBar.open('Avatar uploaded!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message || 'Failed to upload avatar',
          'Close',
          { duration: 3000 }
        );
      },
    });
  }
}
