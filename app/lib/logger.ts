type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: number | string;
  action?: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): LogLevel {
  if (typeof window !== 'undefined') {
    // Client-side: silent in production
    return process.env.NODE_ENV === 'production' ? 'error' : 'debug';
  }
  // Server-side: info in production, debug in dev
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

function shouldLog(level: LogLevel): boolean {
  const minLevel = getMinLevel();
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
}

function formatEntry(entry: LogEntry): string {
  if (typeof window !== 'undefined') {
    // Client-side: simple format
    return `[${entry.level.toUpperCase()}] ${entry.message}`;
  }
  // Server-side: structured JSON for production
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(entry);
  }
  return `[${entry.level.toUpperCase()}] ${entry.message}`;
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context: LogContext = {}
): LogEntry {
  return {
    level,
    message,
    context: {
      ...context,
      timestamp: context.timestamp ?? new Date().toISOString(),
    },
  };
}

function logToConsole(entry: LogEntry): void {
  const formatted = formatEntry(entry);
  const isServer = typeof window === 'undefined';

  switch (entry.level) {
    case 'debug':
      if (isServer && process.env.NODE_ENV === 'production') {
        // Structured JSON to stdout
        process.stdout.write(formatted + '\n');
      } else {
        console.debug(formatted, entry.context);
      }
      break;
    case 'info':
      if (isServer && process.env.NODE_ENV === 'production') {
        process.stdout.write(formatted + '\n');
      } else {
        console.info(formatted, entry.context);
      }
      break;
    case 'warn':
      if (isServer && process.env.NODE_ENV === 'production') {
        process.stderr.write(formatted + '\n');
      } else {
        console.warn(formatted, entry.context);
      }
      break;
    case 'error':
      if (isServer && process.env.NODE_ENV === 'production') {
        process.stderr.write(formatted + '\n');
      } else {
        console.error(formatted, entry.context);
      }
      break;
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (!shouldLog('debug')) return;
    logToConsole(createLogEntry('debug', message, context));
  },

  info(message: string, context?: LogContext): void {
    if (!shouldLog('info')) return;
    logToConsole(createLogEntry('info', message, context));
  },

  warn(message: string, context?: LogContext): void {
    if (!shouldLog('warn')) return;
    logToConsole(createLogEntry('warn', message, context));
  },

  error(message: string, context?: LogContext): void {
    if (!shouldLog('error')) return;
    logToConsole(createLogEntry('error', message, context));
  },
};

export function withRequestContext(
  handler: (req: Request) => Promise<Response>,
  routeName: string
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const start = Date.now();
    const requestId = crypto.randomUUID();

    logger.info(`→ ${req.method} ${routeName}`, {
      action: 'request_start',
      requestId,
    } as LogContext);

    try {
      const response = await handler(req);
      const duration = Date.now() - start;

      logger.info(`← ${req.method} ${routeName} ${response.status} (${duration}ms)`, {
        action: 'request_end',
        requestId,
        duration,
        status: response.status,
      } as LogContext);

      return response;
    } catch (error) {
      const duration = Date.now() - start;

      logger.error(`✕ ${req.method} ${routeName} ERROR (${duration}ms)`, {
        action: 'request_error',
        requestId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      } as LogContext);

      throw error;
    }
  };
}

export type { LogLevel, LogContext, LogEntry };
