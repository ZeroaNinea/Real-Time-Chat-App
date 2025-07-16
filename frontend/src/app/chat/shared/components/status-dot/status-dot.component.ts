import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { IdleService } from '../../../../shared/services/idle/idle.service';

@Component({
  selector: 'app-status-dot',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './status-dot.component.html',
  styleUrl: './status-dot.component.scss',
})
export class StatusDotComponent {
  @Input() status: 'online' | 'offline' | 'idle' | 'typing' = 'offline';
}
