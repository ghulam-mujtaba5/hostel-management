/**
 * Production Logger
 * 
 * Structured logging for server and client-side code with
 * support for different log levels and transports.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  request?: {
    method?: string;
    url?: string;
    userAgent?: string;
    ip?: string;
  };
  environment: string;
  service: string;
}

interface LoggerConfig {
  minLevel: LogLevel;
  service: string;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private readonly BUFFER_SIZE = 100;
  private flushTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = {
      minLevel: (process.env.LOG_LEVEL as LogLevel) || 
        (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      service: 'hostelmate',
      enableConsole: true,
      enableRemote: process.env.NODE_ENV === 'production',
      remoteEndpoint: process.env.LOG_ENDPOINT,
    };
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatForConsole(entry: LogEntry): string {
    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      fatal: '\x1b[35m', // Magenta
    };
    const reset = '\x1b[0m';
    const color = levelColors[entry.level];
    
    let output = `${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp}`;
    if (entry.context) {
      output += ` [${entry.context}]`;
    }
    output += ` ${entry.message}`;
    
    return output;
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data,
      environment: process.env.NODE_ENV || 'development',
      service: this.config.service,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: Record<string, unknown>,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createEntry(level, message, context, data, error);

    // Console output
    if (this.config.enableConsole) {
      const formattedMessage = this.formatForConsole(entry);
      
      switch (level) {
        case 'debug':
          console.debug(formattedMessage, data || '');
          break;
        case 'info':
          console.info(formattedMessage, data || '');
          break;
        case 'warn':
          console.warn(formattedMessage, data || '');
          break;
        case 'error':
        case 'fatal':
          console.error(formattedMessage, error || data || '');
          break;
      }
    }

    // Buffer for remote logging
    if (this.config.enableRemote) {
      this.logBuffer.push(entry);
      
      if (this.logBuffer.length >= this.BUFFER_SIZE || level === 'error' || level === 'fatal') {
        this.flush();
      } else if (!this.flushTimeout) {
        this.flushTimeout = setTimeout(() => this.flush(), 5000);
      }
    }
  }

  async flush(): Promise<void> {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.logBuffer.length === 0 || !this.config.remoteEndpoint) return;

    const logs = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs }),
        keepalive: true,
      });
    } catch (err) {
      // Re-queue logs on failure
      if (this.logBuffer.length < this.BUFFER_SIZE * 2) {
        this.logBuffer = [...logs, ...this.logBuffer];
      }
      console.error('Failed to flush logs:', err);
    }
  }

  // Log level methods
  debug(message: string, data?: Record<string, unknown>): void;
  debug(context: string, message: string, data?: Record<string, unknown>): void;
  debug(arg1: string, arg2?: string | Record<string, unknown>, arg3?: Record<string, unknown>): void {
    if (typeof arg2 === 'string') {
      this.log('debug', arg2, arg1, arg3);
    } else {
      this.log('debug', arg1, undefined, arg2);
    }
  }

  info(message: string, data?: Record<string, unknown>): void;
  info(context: string, message: string, data?: Record<string, unknown>): void;
  info(arg1: string, arg2?: string | Record<string, unknown>, arg3?: Record<string, unknown>): void {
    if (typeof arg2 === 'string') {
      this.log('info', arg2, arg1, arg3);
    } else {
      this.log('info', arg1, undefined, arg2);
    }
  }

  warn(message: string, data?: Record<string, unknown>): void;
  warn(context: string, message: string, data?: Record<string, unknown>): void;
  warn(arg1: string, arg2?: string | Record<string, unknown>, arg3?: Record<string, unknown>): void {
    if (typeof arg2 === 'string') {
      this.log('warn', arg2, arg1, arg3);
    } else {
      this.log('warn', arg1, undefined, arg2);
    }
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void;
  error(context: string, message: string, error?: Error, data?: Record<string, unknown>): void;
  error(
    arg1: string, 
    arg2?: string | Error, 
    arg3?: Error | Record<string, unknown>,
    arg4?: Record<string, unknown>
  ): void {
    if (typeof arg2 === 'string') {
      this.log('error', arg2, arg1, arg4, arg3 as Error);
    } else {
      this.log('error', arg1, undefined, arg3 as Record<string, unknown>, arg2);
    }
  }

  fatal(message: string, error?: Error, data?: Record<string, unknown>): void;
  fatal(context: string, message: string, error?: Error, data?: Record<string, unknown>): void;
  fatal(
    arg1: string, 
    arg2?: string | Error, 
    arg3?: Error | Record<string, unknown>,
    arg4?: Record<string, unknown>
  ): void {
    if (typeof arg2 === 'string') {
      this.log('fatal', arg2, arg1, arg4, arg3 as Error);
    } else {
      this.log('fatal', arg1, undefined, arg3 as Record<string, unknown>, arg2);
    }
  }

  // Create a child logger with fixed context
  child(context: string): ChildLogger {
    return new ChildLogger(this, context);
  }
}

class ChildLogger {
  constructor(private parent: Logger, private context: string) {}

  debug(message: string, data?: Record<string, unknown>): void {
    this.parent.debug(this.context, message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.parent.info(this.context, message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.parent.warn(this.context, message, data);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.parent.error(this.context, message, error, data);
  }

  fatal(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.parent.fatal(this.context, message, error, data);
  }
}

// Export singleton
export const logger = Logger.getInstance();

// Export class for testing
export { Logger, ChildLogger };

// Convenience methods
export const log = {
  debug: (message: string, data?: Record<string, unknown>) => logger.debug(message, data),
  info: (message: string, data?: Record<string, unknown>) => logger.info(message, data),
  warn: (message: string, data?: Record<string, unknown>) => logger.warn(message, data),
  error: (message: string, error?: Error, data?: Record<string, unknown>) => logger.error(message, error, data),
  fatal: (message: string, error?: Error, data?: Record<string, unknown>) => logger.fatal(message, error, data),
};
