/**
 * Simple structured logger for production use
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

function formatLog(level, message, data = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  });
}

export const logger = {
  error: (message, data = {}) => {
    console.error(formatLog(LOG_LEVELS.ERROR, message, data));
  },
  warn: (message, data = {}) => {
    console.warn(formatLog(LOG_LEVELS.WARN, message, data));
  },
  info: (message, data = {}) => {
    console.log(formatLog(LOG_LEVELS.INFO, message, data));
  },
  debug: (message, data = {}) => {
    if (process.env.DEBUG === 'true') {
      console.log(formatLog(LOG_LEVELS.DEBUG, message, data));
    }
  }
};

export default logger;
