export interface ProblemFieldError {
  readonly field?: string;
  readonly code?: string;
  readonly message?: string;
}

export interface ProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly code: string;
  readonly detail: string;
  readonly correlationId?: string;
  readonly errors?: readonly ProblemFieldError[];
}
