import * as Sentry from '@sentry/react-native';

const isDev = process.env.EXPO_PUBLIC_ENVIRONMENT === 'DEVELOP' || __DEV__;

type LogLevel = 'info' | 'warning' | 'error' | 'debug';

const log = (level: LogLevel, message: string, context?: Record<string, any>) => {
  if (isDev) {
    const consoleMethod = level === 'warning' ? 'warn' : (level === 'error' ? 'error' : (level === 'debug' ? 'debug' : 'log'));
    console[consoleMethod](`[${level.toUpperCase()}] ${message}`, context ? context : '');
  }

  if (level === 'error') {
    Sentry.captureMessage(message, {
      level: 'error',
      extra: context,
    });
  } else {
    Sentry.addBreadcrumb({
      category: 'log',
      message,
      level: level as Sentry.SeverityLevel,
      data: context,
    });
  }
};

export const logger = {
  info: (message: string, context?: Record<string, any>) => log('info', message, context),
  warn: (message: string, context?: Record<string, any>) => log('warning', message, context),
  error: (message: string, context?: Record<string, any>) => log('error', message, context),
  debug: (message: string, context?: Record<string, any>) => log('debug', message, context),
};
