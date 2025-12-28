export const SECOND_MS = 1_000;
export const MINUTE_MS = 60 * SECOND_MS;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

// Token TTL policy (API contract)
export const ID_TOKEN_REFRESH_MS = 23 * HOUR_MS; // refresh every 23h (24h validity)
export const REFRESH_TOKEN_REFRESH_MS = 29 * DAY_MS; // refresh every 29d (30d validity)
