import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideServerRouting, ServerRoute } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRouting(serverRoutes),
    // provideServerRouting(serverRoutes, {
    //   renderMode: (route: ServerRoute) =>
    //     route.path?.includes(':chatId') || route.path?.includes(':channelId')
    //       ? 'no-prerender'
    //       : undefined,
    // } as any),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
