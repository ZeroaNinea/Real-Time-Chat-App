import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {
  trigger,
  transition,
  style,
  animate,
  state,
} from '@angular/animations';

@Component({
  selector: 'app-reaction-count',
  imports: [],
  standalone: true,
  templateUrl: './reaction-count.component.html',
  styleUrl: './reaction-count.component.scss',
  animations: [
    trigger('countChange', [
      transition(':increment', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate(
          '200ms ease-out',
          style({ transform: 'translateY(0)', opacity: 1 })
        ),
      ]),
      transition(':decrement', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate(
          '200ms ease-out',
          style({ transform: 'translateY(0)', opacity: 1 })
        ),
      ]),
    ]),
  ],
})
export class ReactionCountComponent implements OnChanges {
  @Input() count = 0;
  @Input() emoji = '';
  @Input() shouldAnimate = false;

  animationState: 'active' | 'inactive' = 'inactive';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['shouldAnimate'] && this.shouldAnimate) {
      this.animationState = 'active';
      setTimeout(() => {
        this.animationState = 'inactive';
      }, 300);
    }
  }
}
