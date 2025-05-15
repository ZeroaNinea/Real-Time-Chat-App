import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-permissions',
  imports: [MatButtonModule, MatIconModule],
  standalone: true,
  templateUrl: './permissions.component.html',
  styleUrl: './permissions.component.scss',
})
export class PermissionsComponent {
  @Input() canEdit = false;
  @Input() channelId: string | null = null;
  @Output() openPermissionsDialog = new EventEmitter<void>();
}
