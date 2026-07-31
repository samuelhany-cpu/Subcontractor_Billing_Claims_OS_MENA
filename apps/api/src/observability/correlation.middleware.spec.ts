import { Request, Response } from 'express';
import {
  CORRELATION_HEADER,
  CorrelationContext,
  isValidCorrelationId,
} from './correlation-context';
import { CorrelationMiddleware } from './correlation.middleware';

function createFixture(headerValue?: string) {
  const context = new CorrelationContext();
  const middleware = new CorrelationMiddleware(context);
  const request = {
    header: jest.fn().mockReturnValue(headerValue),
  } as unknown as Request;
  const setHeader = jest.fn();
  const response = { setHeader } as unknown as Response;
  return { context, middleware, request, response, setHeader };
}

describe('CorrelationMiddleware', () => {
  it('preserves a valid inbound correlation identifier', () => {
    const fixture = createFixture('caller-request-123');
    const next = jest.fn(() => {
      expect(fixture.context.getCorrelationId()).toBe('caller-request-123');
    });

    fixture.middleware.use(fixture.request, fixture.response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(fixture.setHeader).toHaveBeenCalledWith(
      CORRELATION_HEADER,
      'caller-request-123',
    );
  });

  it.each([undefined, 'unsafe value', 'header\r\ninjection', 'x'.repeat(129)])(
    'replaces an absent or invalid inbound value %j',
    (headerValue) => {
      const fixture = createFixture(headerValue);
      let generated = '';
      const next = jest.fn(() => {
        generated = fixture.context.getCorrelationId() ?? '';
      });

      fixture.middleware.use(fixture.request, fixture.response, next);

      expect(isValidCorrelationId(generated)).toBe(true);
      expect(generated).not.toBe(headerValue);
      expect(fixture.setHeader).toHaveBeenCalledWith(
        CORRELATION_HEADER,
        generated,
      );
    },
  );
});
