// Build-time constants baked in by Vite (see vite.config.ts `define`).
// Used as a single source of truth for cache-busting checks and OTP length.

declare global {
  // eslint-disable-next-line no-var
  var __BUILD_ID__: string;
  // eslint-disable-next-line no-var
  var __OTP_LENGTH__: number;
}

export const BUILD_ID: string =
  typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "dev";

export const OTP_LENGTH_EXPECTED: number =
  typeof __OTP_LENGTH__ !== "undefined" ? __OTP_LENGTH__ : 6;
