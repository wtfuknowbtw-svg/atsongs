export interface ApiResponse<T = any> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export const successResponse = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

export const errorResponse = (code: string, message: string, details?: any): ApiError => ({
  success: false,
  error: {
    code,
    message,
    details,
  },
});

export const errorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  DUPLICATE_FILE: 'DUPLICATE_FILE',
  DUPLICATE_TRACK: 'DUPLICATE_TRACK',
  STORAGE_ERROR: 'STORAGE_ERROR',
  CLOUDINARY_ERROR: 'CLOUDINARY_ERROR',
  TRACK_NOT_READY: 'TRACK_NOT_READY',
} as const;
