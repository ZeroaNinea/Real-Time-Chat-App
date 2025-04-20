import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';

import { AuthService } from '../../auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthFormFieldComponent } from '../../auth/shared/auth-form-field/auth-form-field.component';
import { User } from '../../auth/shared/user.model';

@Component({
  selector: 'app-pronouns',
  imports: [AuthFormFieldComponent, ReactiveFormsModule, MatFormFieldModule],
  standalone: true,
  templateUrl: './pronouns.component.html',
  styleUrl: './pronouns.component.scss',
})
export class PronounsComponent {
  @Input() user!: User;
  @Output() userChange = new EventEmitter<User>();

  private fb = inject(FormBuilder);

  form = this.fb.group({
    pronouns: [''],
  });

  authService = inject(AuthService);
  snackBar = inject(MatSnackBar);

  get pronounsControl() {
    return this.form.get('pronouns') as FormControl;
  }

  updatePronouns() {
    if (this.pronounsControl.invalid) return;

    this.authService.updateEmail(this.pronounsControl.value!).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.userChange.emit(updatedUser);
        this.snackBar.open('Pronouns updated!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message || 'Failed to update pronouns',
          'Close',
          { duration: 3000 }
        );
      },
    });
  }
}
