import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthTokenService } from '../services/auth-token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(AuthTokenService);

  const token = tokenService.getAccessToken();

  if (req.url.startsWith('https://tenor.googleapis.com')) {
    return next(req);
  }

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(cloned);
  }

  return next(req);
};
