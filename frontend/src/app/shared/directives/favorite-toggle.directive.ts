import { Directive } from '@angular/core';

@Directive({
  selector: '[appFavoriteToggle]',
  standalone: true,
})
export class FavoriteToggleDirective {
  constructor() {}
}
