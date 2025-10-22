export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

let level: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'error';

export function setLogLevel(newLevel: LogLevel): void {
  level = newLevel;
}

function shouldLog(target: LogLevel): boolean {
  const order: Record<LogLevel, number> = {
    silent: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
  };
  return order[target] <= order[level] && level !== 'silent';
}

export const logger = {
  setLevel: setLogLevel,
  error: (msg: string, meta?: unknown) => {
    if (shouldLog('error')) console.error(`[dpd-sdk:error] ${msg}`, meta ?? '');
  },
  warn: (msg: string, meta?: unknown) => {
    if (shouldLog('warn')) console.warn(`[dpd-sdk:warn] ${msg}`, meta ?? '');
  },
  info: (msg: string, meta?: unknown) => {
    if (shouldLog('info')) console.info(`[dpd-sdk:info] ${msg}`, meta ?? '');
  },
  debug: (msg: string, meta?: unknown) => {
    if (shouldLog('debug')) console.debug(`[dpd-sdk:debug] ${msg}`, meta ?? '');
  },
};