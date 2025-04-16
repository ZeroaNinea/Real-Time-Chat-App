import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../auth/auth.service';
import { AuthFormFieldComponent } from '../../auth/shared/auth-form-field/auth-form-field.component';
import { User } from '../../auth/shared/user.model';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-account-email',
  imports: [AuthFormFieldComponent, MatButtonModule],
  templateUrl: './account-email.component.html',
  styleUrl: './account-email.component.scss',
})
export class AccountEmailComponent {
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  authService = inject(AuthService);
  snackBar = inject(MatSnackBar);

  @Input() user!: User | null;
  @Output() userChange = new EventEmitter<User>();

  updateEmail() {
    if (this.emailControl.invalid) return;

    this.authService.updateEmail(<string>this.emailControl.value).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.userChange.emit(updatedUser);
        this.snackBar.open('Email updated!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message || 'Failed to update email',
          'Close',
          { duration: 3000 }
        );
      },
    });
  }
}
