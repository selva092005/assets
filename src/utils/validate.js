// ─────────────────────────────────────────────────────────────────────────────
//  Shared Validation Utilities — AMS
// ─────────────────────────────────────────────────────────────────────────────

/** True if value is a non-blank string */
export const required = (val) =>
  val !== null && val !== undefined && String(val).trim().length > 0;

/** True if email is valid */
export const isValidEmail = (val) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim());

/**
 * Password strength: 8+ chars, at least one uppercase, one lowercase,
 * one digit, one special character (@$!%*?&)
 */
export const isStrongPassword = (val) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(val);

/** True if dateStr is a valid parseable date */
export const isValidDate = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
};

/** True if `toDate` is on or after `fromDate` */
export const isDateAfter = (fromDate, toDate) => {
  if (!fromDate || !toDate) return true; // skip if either is blank
  return new Date(toDate) >= new Date(fromDate);
};

/** True if date is not in the future */
export const isNotFutureDate = (dateStr) => {
  if (!dateStr) return true;
  return new Date(dateStr) <= new Date();
};

/** True if date is not in the past (today or future) */
export const isNotPastDate = (dateStr) => {
  if (!dateStr) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) >= today;
};

/**
 * Extract field-level errors from an Axios 400 backend response.
 * The GlobalExceptionHandler returns: { fieldErrors: { field: "message" } }
 * Returns a flat map: { fieldName: "error message" }
 */
export const extractFieldErrors = (axiosError) => {
  const data = axiosError?.response?.data;
  if (data?.fieldErrors && typeof data.fieldErrors === "object") {
    return data.fieldErrors;
  }
  return {};
};
