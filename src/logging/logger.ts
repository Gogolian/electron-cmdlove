import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export interface Logger {
  logPath: string;
  info(message: string): void;
  error(message: string, error?: unknown): void;
}

export function createLogger(userDataPath: string): Logger {
  const logPath = path.join(userDataPath, 'cmdlove.log');
  mkdirSync(path.dirname(logPath), { recursive: true });

  const write = (level: string, message: string, error?: unknown): void => {
    const detail = error === undefined ? '' : ` ${formatError(error)}`;
    appendFileSync(logPath, `${new Date().toISOString()} [${level}] ${message}${detail}\n`, 'utf8');
  };

  return {
    logPath,
    info: (message) => write('info', message),
    error: (message, error) => write('error', message, error),
  };
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}
