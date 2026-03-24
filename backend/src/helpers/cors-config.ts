export const corsOriginValidator = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) => {
  const allowed = [
    'http://localhost:4200',
    'https://real-time-chat-app.local',
    'https://real-time-chat-app-great-bulbdog.vercel.app',
  ];

  if (!origin || allowed.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS.'));
  }
};
