import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

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
