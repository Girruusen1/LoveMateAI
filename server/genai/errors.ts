/** Error with a stable code the browser can branch on. Shared by every provider. */
export class GenAIError extends Error {
  readonly code: 'not_configured' | 'refused' | 'truncated' | 'invalid_output' | 'rate_limited' | 'upstream' | 'bad_request';
  readonly status: number;
  constructor(code: GenAIError['code'], message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
