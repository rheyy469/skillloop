export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details: Array<{ field?: string; message: string }>;

  constructor(
    status: number,
    code: string,
    message: string,
    details: Array<{ field?: string; message: string }> = []
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
