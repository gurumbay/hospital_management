export function extractErrorMessage(err: any): string {
  if (!err) return 'Unknown error';

  // Axios response errors
  const resp = err.response?.data ?? err;

  // If response has 'detail'
  const detail = resp.detail ?? resp;

  // If it's a string
  if (typeof detail === 'string') return detail;

  // If it's an array (pydantic validation errors)
  if (Array.isArray(detail)) {
    try {
      return detail
        .map((d: any) => {
          if (typeof d === 'string') return d;
          const loc = Array.isArray(d.loc) ? d.loc.join('.') : '';
          const msg = d.msg || d.message || JSON.stringify(d);
          return loc ? `${loc}: ${msg}` : msg;
        })
        .join(' ; ');
    } catch (e) {
      return JSON.stringify(detail);
    }
  }

  // If it's an object with message or msg
  if (typeof detail === 'object') {
    if (detail.message) return String(detail.message);
    if (detail.msg) return String(detail.msg);
    // Fallback: try to stringify limited
    try {
      return JSON.stringify(detail);
    } catch (e) {
      return String(detail);
    }
  }

  // Fallback to err.message
  if (err.message) return String(err.message);

  return 'Unknown error';
}

export default extractErrorMessage;import type { AxiosError } from 'axios';

interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

interface HTTPValidationError {
  detail: string | ValidationError[];
}

// Parse API errors and convert to readable messages
export const handleApiError = (error: unknown): string => {
  if (!error) {
    return 'Unknown error';
  }

  // Handle axios errors
  if (typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<HTTPValidationError>;

    if (axiosError.response?.data) {
      const data = axiosError.response.data;

      // Handle validation errors (array of validation details)
      if (Array.isArray(data.detail)) {
        return data.detail
          .map((err: ValidationError) => `${err.loc.join('.')}: ${err.msg}`)
          .join('; ');
      }

      // Handle simple error message
      if (typeof data.detail === 'string') {
        return data.detail;
      }
    }

    if (axiosError.message) {
      return axiosError.message;
    }
  }

  // Handle standard errors
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error occurred';
};

// Map validation errors to field-specific errors
export const mapValidationErrors = (
  error: unknown
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!error || typeof error !== 'object' || !('response' in error)) {
    return errors;
  }

  const axiosError = error as AxiosError<HTTPValidationError>;

  if (axiosError.response?.data?.detail && Array.isArray(axiosError.response.data.detail)) {
    const details = axiosError.response.data.detail as ValidationError[];
    for (const err of details) {
      const fieldName = err.loc[err.loc.length - 1];
      errors[String(fieldName)] = err.msg;
    }
  }

  return errors;
};
