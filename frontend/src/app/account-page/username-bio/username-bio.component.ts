import { Component, EventEmitter, inject, Input, Output } from '@angular/core';

import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthFormFieldComponent } from '../../auth/shared/auth-form-field/auth-form-field.component';
import { AuthService } from '../../auth/auth.service';
import { User } from '../../auth/shared/user.model';

@Component({
  selector: 'app-username-bio',
  imports: [
    AuthFormFieldComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
  ],
  standalone: true,
  templateUrl: './username-bio.component.html',
  styleUrl: './username-bio.component.scss',
})
export class UsernameComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    username: [''],
    bio: [''],
  });

  authService = inject(AuthService);
  snackBar = inject(MatSnackBar);

  @Input() user!: User | null;
  @Output() userChange = new EventEmitter<User>();

  get usernameControl() {
    return this.form.get('username') as FormControl;
  }

  get bioControl() {
    return this.form.get('bio') as FormControl;
  }

  updateUsernameBio() {
    if (this.usernameControl.invalid && this.bioControl.invalid) return;

    this.authService
      .updateUsernameBio({
        username: this.usernameControl.value!,
        bio: this.bioControl.value!,
      })
      .subscribe({
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
