'use client';

import { useState } from 'react';

export function PayeeStateControl({
  active,
  action,
}: {
  readonly active: boolean;
  readonly action: () => Promise<{ readonly error: string | null }>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run() {
    if (
      active &&
      !window.confirm(
        'سيظل المستفيد وكل مصروفاته واتفاقياته محفوظة، لكنه لن يكون متاحًا للاختيارات الجديدة. هل تريد المتابعة؟',
      )
    )
      return;
    setPending(true);
    setError(null);
    const result = await action();
    setError(result.error);
    setPending(false);
  }
  return (
    <div>
      <button
        className={active ? 'button button-secondary' : 'button button-primary'}
        type="button"
        disabled={pending}
        onClick={run}
      >
        {pending ? 'جارٍ التنفيذ…' : active ? 'تعطيل' : 'تفعيل'}
      </button>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
