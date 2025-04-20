import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    tap({
      error: (error: any) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          localStorage.removeItem('accessToken');

          router.navigate(['/401']);
        }
      },
    })
  );
};
