import { Component, inject } from '@angular/core';

import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';

import { AuthFormFieldComponent } from '../../auth/shared/auth-form-field/auth-form-field.component';

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
export class UsernameBioComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    username: [''],
    bio: [''],
  });

  get usernameBioControl() {
    return this.form.get(['username', 'bio']) as FormControl;
  }
}
