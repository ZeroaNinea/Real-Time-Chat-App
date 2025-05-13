import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-rename-channel-dialog',
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule],
  standalone: true,
  templateUrl: './rename-channel-dialog.component.html',
  styleUrl: './rename-channel-dialog.component.scss',
})
export class RenameChannelDialogComponent {}
