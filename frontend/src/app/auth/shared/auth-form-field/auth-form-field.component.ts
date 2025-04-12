import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule, MatError } from '@angular/material/form-field';

@Component({
  selector: 'app-auth-form-field',
  imports: [ReactiveFormsModule, MatFormFieldModule],
  standalone: true,
  templateUrl: './auth-form-field.component.html',
  styleUrls: ['./auth-form-field.component.scss'],
})
export class AuthFormFieldComponent {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() control!: FormControl;
  @Input() type: string = 'text';
}
