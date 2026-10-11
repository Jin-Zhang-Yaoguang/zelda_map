// src/lib/cloud/errors.ts
var AccountFailure = class extends Error {
  constructor(detail) {
    super(detail.code);
    this.detail = detail;
    this.name = "AccountFailure";
  }
  detail;
};
function failure(operation, code, retryable = false) {
  return new AccountFailure({ operation, code, retryable });
}
function normalizeError(error, operation) {
  if (error instanceof AccountFailure) return error;
  const e = error;
  if (operation === "auth" && (e?.code === "otp_expired" || e?.code === "otp_disabled" || e?.code === "validation_failed")) return failure(operation, "invalidOtp");
  if (e?.status === 401 || e?.code === "PGRST301" || e?.code === "refresh_token_not_found" || e?.code === "refresh_token_already_used") return failure(operation, "sessionExpired");
  if (e?.status === 429 || e?.code === "over_request_rate_limit" || e?.code === "over_email_send_rate_limit") return failure(operation, "rateLimited", true);
  if (e?.status === 403 || e?.code === "42501") return failure(operation, "permissionDenied");
  if (operation === "storage") return failure(operation, e?.name === "DataError" ? "corruptCache" : "storageUnavailable", true);
  if (e?.status === 0 || e?.message?.includes("Failed to fetch") || e?.message?.includes("fetch failed") || e?.name === "TypeError" || e?.name === "AbortError" || e?.status && e.status >= 500) return failure(operation, "networkFailure", true);
  return failure(operation, operation === "auth" ? "authFailed" : "requestFailed");
}
export {
  AccountFailure,
  failure,
  normalizeError
};
