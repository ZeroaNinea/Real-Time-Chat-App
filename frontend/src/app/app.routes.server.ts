import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'chat-room/:chatId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'chat-room/:chatId/channel/:channelId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'account',
    renderMode: RenderMode.Client,
  },
];
