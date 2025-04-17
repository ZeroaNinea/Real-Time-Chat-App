import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { CdkTextareaAutosize, TextFieldModule } from '@angular/cdk/text-field';

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
    MatInputModule,
    TextFieldModule,
  ],
  standalone: true,
  templateUrl: './username-bio.component.html',
  styleUrl: './username-bio.component.scss',
})
export class UsernameBioComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    username: ['', [Validators.minLength(3)]],
    bio: [''],
  });

  authService = inject(AuthService);
  snackBar = inject(MatSnackBar);

  @Input() user!: User | null;
  @Output() userChange = new EventEmitter<User>();

  private populateForm() {
    if (!this.user) return;
    this.form.patchValue({
      username: this.user.username || '',
      bio: this.user.bio || '',
    });
  }

  get usernameControl() {
    return this.form.get('username') as FormControl;
  }

  get bioControl() {
    return this.form.get('bio') as FormControl;
  }

  ngOnInit() {
    // this.populateForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && changes['user'].currentValue) {
      this.populateForm();
    }
  }

  updateUsernameBio() {
    if (this.usernameControl.invalid || this.bioControl.invalid) return;

    const dataToUpdate: Partial<User> = {};
    if (this.usernameControl.value !== this.user?.username) {
      dataToUpdate.username = this.usernameControl.value!;
    }
    if (this.bioControl.value !== this.user?.bio) {
      dataToUpdate.bio = this.bioControl.value!;
    }

    if (Object.keys(dataToUpdate).length === 0) return;

    this.authService
      .updateUsernameBio({
        username: this.usernameControl.value!,
        bio: this.bioControl.value!,
      })
      .subscribe({
        next: (updatedUser) => {
          this.user = updatedUser;
          this.userChange.emit(updatedUser);
          this.snackBar.open('Username & Bio updated!', 'Close', {
            duration: 3000,
          });
          this.populateForm();
        },
        error: (err) => {
          this.snackBar.open(
            err.error?.message || 'Failed to update Username & Bio',
            'Close',
            { duration: 3000 }
          );
        },
      });
  }
}
