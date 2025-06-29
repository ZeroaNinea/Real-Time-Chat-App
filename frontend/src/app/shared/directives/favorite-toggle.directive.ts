import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  Input,
  Renderer2,
} from '@angular/core';
import { ChatService } from '../../chat/shared/services/chat-service/chat.service';

@Directive({
  selector: '[appFavoriteToggle]',
  standalone: true,
})
export class FavoriteToggleDirective {
  private el = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);
  private chatService = inject(ChatService);

  @Input('appFavoriteToggle') gifUrl!: string;

  favoriteGifs: string[] = [];

  constructor() {
    this.chatService.favorites$.subscribe((favs) => {
      this.favoriteGifs = favs;
    });
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    event.stopPropagation();

    const wrapper = this.el.nativeElement.closest('.marked-star-wrapper');
    const particleContainer = wrapper?.querySelector(
      '.marked-particle-container'
    ) as HTMLElement;

    if (particleContainer) {
      this.animateParticles(particleContainer);
    }

    if (this.favoriteGifs.includes(this.gifUrl)) {
      this.chatService.removeFavorite(this.gifUrl).subscribe();
    } else {
      this.chatService.addFavorite(this.gifUrl).subscribe();
    }
  }

  animateParticles(container: Element) {
    for (let i = 0; i < 12; i++) {
      const particle = this.renderer.createElement('div');
      this.renderer.addClass(particle, 'particle');

      this.renderer.setStyle(particle, '--x', `${Math.random() * 2 - 1}`);
      this.renderer.setStyle(particle, '--y', `${Math.random() * 2 - 1}`);
      this.renderer.setStyle(particle, 'width', `6px`);
      this.renderer.setStyle(particle, 'height', `6px`);

      this.renderer.appendChild(container, particle);

      setTimeout(() => {
        this.renderer.removeChild(container, particle);
      }, 600);
    }
  }
}
