import { logger } from '@/app/lib/logger';

describe('Logger', () => {
  let consoleSpy: {
    debug: jest.SpyInstance;
    info: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: jest.spyOn(console, 'debug').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('log levels', () => {
    it('should log debug messages in development', () => {
      logger.debug('test debug message');
      expect(consoleSpy.debug).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      logger.info('test info message');
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      logger.warn('test warn message');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      logger.error('test error message');
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('context', () => {
    it('should include context in log output', () => {
      logger.info('test message', { userId: 1, action: 'test' });
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] test message'),
        expect.objectContaining({ userId: 1, action: 'test' })
      );
    });

    it('should auto-generate timestamp in context', () => {
      logger.info('test message');
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ timestamp: expect.any(String) })
      );
    });

    it('should preserve custom timestamp if provided', () => {
      const customTs = '2026-01-01T00:00:00Z';
      logger.info('test message', { timestamp: customTs });
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ timestamp: customTs })
      );
    });
  });

  describe('format', () => {
    it('should format with log level prefix', () => {
      logger.error('critical failure');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.any(Object)
      );
    });

    it('should include message in formatted output', () => {
      logger.info('hello world');
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('hello world'),
        expect.any(Object)
      );
    });
  });
});
