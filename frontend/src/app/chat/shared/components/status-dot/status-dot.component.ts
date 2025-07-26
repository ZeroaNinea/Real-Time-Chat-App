import { CommonModule } from '@angular/common';
import { afterNextRender, Component, Input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-status-dot',
  imports: [CommonModule, MatTooltipModule],
  standalone: true,
  templateUrl: './status-dot.component.html',
  styleUrl: './status-dot.component.scss',
})
export class StatusDotComponent {
  @Input() status: 'online' | 'offline' | 'idle' | 'typing' = 'offline';

  comment() {
    // afterNextRender(() => {
    console.log('Current status:', this.status);
    // });
  }
}
