import { Directive, ElementRef, inject, Input, Renderer2 } from '@angular/core';
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

  favoritesGifs: string[] = [];

  constructor() {}
}
