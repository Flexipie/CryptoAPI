import pino from 'pino';
import { appConfig } from './config.js';

export const logger = pino({
  level: appConfig.LOG_LEVEL,
  ...(appConfig.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:standard',
      },
    },
  }),
});
