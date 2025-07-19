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

  animationKey: string | null = null;
  prevCount = 0;

  ngOnChanges(changes: SimpleChanges) {
    const countChanged = this.prevCount !== this.count;
    const shouldTrigger = this.shouldAnimate && countChanged;

    if (shouldTrigger) {
      this.animationKey = `${this.count}-${Date.now()}`;
    } else {
      this.animationKey = null;
    }

    this.prevCount = this.count;

    console.log(
      `emoji=${this.emoji}, count=${this.count}, animate=${this.shouldAnimate}, prev=${this.prevCount}, key=${this.animationKey}`
    );
  }
}
