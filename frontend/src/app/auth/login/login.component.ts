import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthFormFieldComponent } from '../shared/auth-form-field/auth-form-field.component';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthFormFieldComponent,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit() {
    if (this.form.invalid) {
      console.log('Invalid form');
      return;
    }
    console.log('Form submitted:', this.form.value);
    this.authService
      .login({
        username: this.form.value.username || '',
        password: this.form.value.password || '',
      })
      .subscribe({
        next: (data: any) => {
          // Navigate to chat or show success.
          console.log('Login successful');
          localStorage.setItem('accessToken', data['token']);
          this.router.navigate(['/account']);
        },
        error: (err) => {
          console.error(err);
        },
      });
  }
}
