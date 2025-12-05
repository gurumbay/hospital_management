import type { AxiosError } from 'axios';

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
