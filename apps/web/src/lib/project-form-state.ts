export interface ProjectFormState {
  readonly error: string | null;
  readonly fieldErrors: Readonly<Record<string, string>>;
}

export const emptyProjectFormState: ProjectFormState = {
  error: null,
  fieldErrors: {},
};
