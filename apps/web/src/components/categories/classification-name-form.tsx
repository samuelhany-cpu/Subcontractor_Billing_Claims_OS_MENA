'use client';

import { useActionState } from 'react';
import {
  ClassificationFormState,
  emptyClassificationFormState,
} from '@/lib/category-form-state';

type NameAction = (
  state: ClassificationFormState,
  formData: FormData,
) => Promise<ClassificationFormState>;

export function ClassificationNameForm({
  action,
  initialName = '',
  label,
  submitLabel,
}: {
  readonly action: NameAction;
  readonly initialName?: string;
  readonly label: string;
  readonly submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    emptyClassificationFormState,
  );
  return (
    <form action={formAction} className="classification-name-form" noValidate>
      <label>
        <span>{label}</span>
        <input
          name="name"
          defaultValue={initialName}
          required
          maxLength={120}
          autoComplete="off"
          aria-invalid={state.fieldErrors.name ? true : undefined}
        />
      </label>
      <button
        className="button button-secondary"
        disabled={pending}
        type="submit"
      >
        {pending ? 'جارٍ الحفظ…' : submitLabel}
      </button>
      {state.fieldErrors.name && (
        <p className="field-error" role="alert">
          {state.fieldErrors.name}
        </p>
      )}
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="form-success" role="status">
          {state.success}
        </p>
      )}
    </form>
  );
}
