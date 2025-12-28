export class VisualpingApiError extends Error {
  readonly status: number;
  readonly payload?: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(`Visualping API Error (${status}): ${message}`);
    this.name = 'VisualpingApiError';
    this.status = status;
    this.payload = payload;
  }
}
