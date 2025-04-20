import { Component, EventEmitter, inject, Input, Output } from '@angular/core';

import { MatSnackBar } from '@angular/material/snack-bar';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { User } from '../../auth/shared/user.model';
import { AuthService } from '../../auth/auth.service';
import { AuthFormFieldComponent } from '../../auth/shared/auth-form-field/auth-form-field.component';
import { Router } from 'express';

@Component({
  selector: 'app-delete-account',
  imports: [AuthFormFieldComponent, ReactiveFormsModule],
  standalone: true,
  templateUrl: './delete-account.component.html',
  styleUrl: './delete-account.component.scss',
})
export class DeleteAccountComponent {
  @Input() user!: User;
  @Output() userChange = new EventEmitter<User>();

  authService = inject(AuthService);
  snackBar = inject(MatSnackBar);

  private fb = inject(FormBuilder);
  private router = inject(Router);

  form = this.fb.group({
    password: [
      '',
      [Validators.required, Validators.minLength(6), Validators.maxLength(50)],
    ],
    confirmPassword: [
      '',
      [Validators.required, Validators.minLength(6), Validators.maxLength(50)],
    ],
  });

  get passwordControl() {
    return this.form.get('password') as FormControl;
  }

  get confirmPasswordControl() {
    return this.form.get('confirmPassword') as FormControl;
  }

  deleteAccount() {
    const { password, confirmPassword } = this.form.value;

    if (password !== confirmPassword) {
      this.snackBar.open('Passwords do not match.', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.authService.deleteAccount({ password: <string>password }).subscribe({
      next: () => {
        this.snackBar.open('Account deleted.', 'Close', { duration: 3000 });
        localStorage.removeItem('accessToken');
        this.router.navigate(['/']);
      },
      error: (err) => {
        const message = err?.error?.message || 'Deletion failed.';
        this.snackBar.open(message, 'Close', { duration: 3000 });
      },
    });
  }
}
