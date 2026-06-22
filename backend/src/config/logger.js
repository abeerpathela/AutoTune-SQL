const LEVELS = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };

const currentLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();

const shouldLog = (level) => {
  const configured = LEVELS[currentLevel] ?? LEVELS.info;
  const requested = LEVELS[level] ?? LEVELS.info;
  return requested <= configured;
};

const format = (level, args) => {
  const timestamp = new Date().toISOString();
  const message = args
    .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
    .join(' ');
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

const logger = {
  error: (...args) => shouldLog('error') && console.error(format('error', args)),
  warn: (...args) => shouldLog('warn') && console.warn(format('warn', args)),
  info: (...args) => shouldLog('info') && console.info(format('info', args)),
  http: (...args) => shouldLog('http') && console.info(format('http', args)),
  debug: (...args) => shouldLog('debug') && console.debug(format('debug', args)),
  shouldLogHttp: () => shouldLog('http'),
};

module.exports = logger;
