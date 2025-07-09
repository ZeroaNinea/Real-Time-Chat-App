import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  if (!isPlatformBrowser(platformId)) return false;

  if (typeof window === 'undefined') {
    // Can't check tokens server-side.
    return false;
  }

  const token = localStorage.getItem('accessToken');

  if (!token) {
    router.navigate(['/401']); // Use a 401 page for better UX.
    return false;
  }

  return true;
};
