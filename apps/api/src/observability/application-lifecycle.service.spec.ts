import { ApplicationLifecycleService } from './application-lifecycle.service';
import { StructuredLoggerService } from './structured-logger.service';

describe('ApplicationLifecycleService', () => {
  it('emits sanitized startup and shutdown lifecycle events', () => {
    const event = jest.fn();
    const logger = { event } as unknown as StructuredLoggerService;
    const lifecycle = new ApplicationLifecycleService(logger);

    lifecycle.onApplicationBootstrap();
    lifecycle.beforeApplicationShutdown('SIGTERM');
    lifecycle.onApplicationShutdown('SIGTERM');

    expect(event.mock.calls).toEqual([
      ['info', 'application.started'],
      ['info', 'application.shutdown.started', { signal: 'SIGTERM' }],
      ['info', 'application.shutdown.completed', { signal: 'SIGTERM' }],
    ]);
    expect(JSON.stringify(event.mock.calls)).not.toMatch(
      /password|credential|connection/i,
    );
  });
});
