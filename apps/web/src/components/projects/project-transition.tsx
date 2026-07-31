'use client';

import { useState } from 'react';

interface ProjectTransitionProps {
  readonly mode: 'archive' | 'restore';
  readonly action: () => Promise<void>;
}

export function ProjectTransition({ mode, action }: ProjectTransitionProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const archive = mode === 'archive';

  async function run() {
    if (
      archive &&
      !window.confirm(
        'سيتم أرشفة المشروع مع الاحتفاظ بجميع سجلاته. هل تريد المتابعة؟',
      )
    ) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await action();
    } catch {
      setError('تعذر تحديث حالة المشروع. حدّث الصفحة وحاول مرة أخرى.');
      setPending(false);
    }
  }

  return (
    <div className="transition-control">
      <button
        type="button"
        className={
          archive ? 'button button-secondary' : 'button button-primary'
        }
        disabled={pending}
        onClick={run}
      >
        {pending
          ? 'جارٍ التنفيذ…'
          : archive
            ? 'أرشفة المشروع'
            : 'استعادة المشروع'}
      </button>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
