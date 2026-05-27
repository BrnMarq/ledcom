import express from 'express';
import cors from 'cors';
import pino from 'pino-http';
import logger from "@/utils/logger";
import routes from "@/routes";

const app = express();

const isDev = process.env.NODE_ENV !== 'production';

app.use(cors());
app.use(express.json());

// Intercept response body in development for logging
if (isDev) {
  app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function (body) {
      res.locals.body = body;
      return originalJson.call(this, body);
    };
    next();
  });
}

app.use(pino({ 
  logger,
  customProps: (req, res) => {
    if (isDev) {
      return {
        reqBody: (req as any).body,
        resBody: (res as any).locals.body
      };
    }
    return {};
  }
}));

// Placeholder Favicon
app.get('/favicon.ico', (req, res) => {
  const favicon = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#10B981"/></svg>', 'utf-8');
  res.set('Content-Type', 'image/svg+xml');
  res.send(favicon);
});

// Placeholder Root View
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Finvez API</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f3f4f6; margin: 0;">
        <div style="text-align: center; padding: 2.5rem; background: white; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
          <h1 style="color: #111827; margin-bottom: 0.5rem;">📈 Finvez API</h1>
          <p style="color: #4B5563; margin-bottom: 2rem;">System is online and running successfully.</p>
          <div style="display: flex; gap: 1rem; justify-content: center;">
            <code style="background: #e5e7eb; padding: 0.5rem 1rem; border-radius: 6px; color: #1f2937; font-weight: 600;">/api/prices</code>
            <code style="background: #e5e7eb; padding: 0.5rem 1rem; border-radius: 6px; color: #1f2937; font-weight: 600;">/api/transactions</code>
            <code style="background: #e5e7eb; padding: 0.5rem 1rem; border-radius: 6px; color: #1f2937; font-weight: 600;">/api/accounts</code>
          </div>
        </div>
      </body>
    </html>
  `);
});

app.use('/api', routes);

export default app;
