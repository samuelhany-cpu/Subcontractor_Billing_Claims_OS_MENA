export interface PayeeFormState {
  readonly error: string | null;
  readonly fieldErrors: Readonly<Record<string, string>>;
  readonly success?: string;
}

export const emptyPayeeFormState: PayeeFormState = {
  error: null,
  fieldErrors: {},
};
