import {
  afterNextRender,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-reaction-count',
  imports: [],
  standalone: true,
  templateUrl: './reaction-count.component.html',
  styleUrl: './reaction-count.component.scss',
  animations: [
    trigger('bump', [
      transition(':enter', []),
      transition('* => true', [
        style({ transform: 'scale(1)' }),
        animate('150ms ease', style({ transform: 'scale(1.3)' })),
        animate('150ms ease', style({ transform: 'scale(1)' })),
      ]),
    ]),
  ],
})
export class ReactionCountComponent implements OnChanges {
  @Input() count = 0;
  @Input() emoji = '';
  @Input() shouldAnimate = false;

  animationState = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['shouldAnimate'] && this.shouldAnimate) {
      this.animationState = true;
      setTimeout(() => (this.animationState = false), 300);
    }
  }
}
