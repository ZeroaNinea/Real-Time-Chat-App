import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
// import { provideAnimations } from '@angular/platform-browser/animations';
// import { provideStore } from '@ngrx/store';
// import { provideStoreDevtools } from '@ngrx/store-devtools';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { authInterceptor } from './auth/shared/auth-interceptor/auth.interceptor';
import { errorInterceptor } from './auth/shared/error-interceptor/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),

    // Angular Material
    provideAnimationsAsync(),
    // provideAnimations(),

    // NgRx Store
    // provideStore(),

    // NgRx DevTools
    // provideStoreDevtools({
    //   maxAge: 25,
    //   logOnly: false,
    //   autoPause: true,
    //   features: {
    //     pause: false,
    //     lock: true,
    //     persist: true,
    //   },
    // }),

    // Interceptors
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ],
};
