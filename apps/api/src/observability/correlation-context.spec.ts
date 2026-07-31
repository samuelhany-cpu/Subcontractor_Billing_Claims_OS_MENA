import {
  MAX_CORRELATION_ID_LENGTH,
  CorrelationContext,
  isValidCorrelationId,
} from './correlation-context';

describe('correlation ID validation', () => {
  it.each(['request-123', '01J4Z2K8M9.example:api', 'ABC_def.456'])(
    'accepts the safe value %s',
    (value) => {
      expect(isValidCorrelationId(value)).toBe(true);
    },
  );

  it.each([
    '',
    ' leading-space',
    'contains space',
    'line\r\ninjection',
    'slash/not-allowed',
    'x'.repeat(MAX_CORRELATION_ID_LENGTH + 1),
  ])('rejects the unsafe value %j', (value) => {
    expect(isValidCorrelationId(value)).toBe(false);
  });
});

describe('CorrelationContext', () => {
  it('isolates parallel asynchronous request contexts', async () => {
    const context = new CorrelationContext();

    const values = await Promise.all(
      ['request-a', 'request-b', 'request-c'].map((correlationId, index) =>
        context.run(correlationId, async () => {
          await new Promise((resolve) => setTimeout(resolve, 3 - index));
          return context.getCorrelationId();
        }),
      ),
    );

    expect(values).toEqual(['request-a', 'request-b', 'request-c']);
    expect(context.getCorrelationId()).toBeUndefined();
  });
});
