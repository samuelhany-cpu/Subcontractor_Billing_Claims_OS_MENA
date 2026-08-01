export interface ClassificationFormState {
  readonly error: string | null;
  readonly fieldErrors: Readonly<Record<string, string>>;
  readonly success?: string;
}

export interface ClassificationMutationResult {
  readonly error: string | null;
}

export const emptyClassificationFormState: ClassificationFormState = {
  error: null,
  fieldErrors: {},
};
