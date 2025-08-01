export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogContext {
  testName?: string;
  step?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private level: LogLevel = LogLevel.INFO;
  private context: LogContext = {};

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(this.context).length > 0 
      ? ` [${Object.entries(this.context).map(([k, v]) => `${k}=${v}`).join(', ')}]`
      : '';
    
    let formattedMessage = `[${timestamp}] ${level}${contextStr}: ${message}`;
    
    if (data) {
      formattedMessage += `\n${JSON.stringify(data, null, 2)}`;
    }
    
    return formattedMessage;
  }

  private log(level: LogLevel, levelName: string, message: string, data?: any): void {
    if (level >= this.level) {
      const formattedMessage = this.formatMessage(levelName, message, data);
      console.log(formattedMessage);
    }
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, 'INFO', message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, 'WARN', message, data);
  }

  error(message: string, error?: any): void {
    this.log(LogLevel.ERROR, 'ERROR', message, error);
  }

  step(stepName: string, message: string, data?: any): void {
    this.info(`🔹 ${stepName}: ${message}`, data);
  }

  success(message: string, data?: any): void {
    this.info(`✅ ${message}`, data);
  }

  failure(message: string, error?: any): void {
    this.error(`❌ ${message}`, error);
  }
}

export const logger = new Logger(); 