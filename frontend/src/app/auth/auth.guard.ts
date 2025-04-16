import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  if (typeof window === 'undefined') {
    // Can't check tokens server-side.
    return false;
  }

  const token = localStorage.getItem('accessToken');

  console.log(token, '======================');

  if (!token) {
    router.navigate(['/401']); // Use a 401 page for better UX.
    return false;
  }

  return true;
};
