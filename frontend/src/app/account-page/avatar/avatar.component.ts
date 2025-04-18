import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { User } from '../../auth/shared/user.model';
import { AuthService } from '../../auth/auth.service';

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

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  private authService = inject(AuthService);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
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
        this.user.profilePicture = res.avatar;
        this.userChange.emit(this.user);
      },
      error: (err) => console.error('Avatar upload failed', err),
    });
  }
}
