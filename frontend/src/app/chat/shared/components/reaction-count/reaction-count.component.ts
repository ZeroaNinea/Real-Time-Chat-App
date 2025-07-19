import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reaction-count',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './reaction-count.component.html',
  styleUrl: './reaction-count.component.scss',
  animations: [
    trigger('countChange', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(20%)' }),
        animate(
          '200ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
  ],
})
export class ReactionCountComponent implements OnChanges {
  @Input() count = 0;
  @Input() emoji = '';
  @Input() shouldAnimate = false;
  @Input() reacted!: boolean;

  // animationState: 'active' | 'inactive' = 'inactive';
  animationKey: string | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['count'] && changes['count'].previousValue !== undefined) {
      this.animationKey = `${this.count}-${Date.now()}`;
    }
  }
}
