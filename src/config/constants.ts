export const APP_CONFIG = {
  MAX_FILE_SIZE: Number(import.meta.env.VITE_MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  ALLOWED_FILE_TYPES: import.meta.env.VITE_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp',
  IMAGE_UPLOAD: {
    MAX_CONCURRENT: 3,
    CHUNK_SIZE: 512 * 1024, // 512KB chunks
  },
  AUTH: {
    MIN_PASSWORD_LENGTH: 6,
    MAX_PASSWORD_LENGTH: 100,
    MIN_USERNAME_LENGTH: 2,
    MAX_USERNAME_LENGTH: 50,
  },
  UI: {
    GRID_BREAKPOINTS: {
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
    },
    TOAST_DURATION: 5000,
    UPLOAD_CLEAR_DELAY: 3000,
  },
  API_BASE_URL: (import.meta.env.VITE_API_BASE_URL as string) || '',
} as const;

export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: "Invalid email or password",
    EMAIL_IN_USE: "This email is already registered",
    WEAK_PASSWORD: "Password must be at least 6 characters",
    INVALID_EMAIL: "Please enter a valid email address",
    SESSION_EXPIRED: "Your session has expired. Please sign in again",
  },
  UPLOAD: {
    FILE_TOO_LARGE: "File size exceeds 10MB limit",
    INVALID_TYPE: "Invalid file type. Please upload an image",
    FAILED: "Failed to upload image",
    ANALYSIS_FAILED: "Failed to analyze image",
  },
  GENERIC: {
    UNKNOWN_ERROR: "An unexpected error occurred",
    NETWORK_ERROR: "Network connection error",
    PERMISSION_DENIED: "You don't have permission to perform this action",
  },
} as const;


export const IMAGE_BUCKET = import.meta.env.VITE_IMAGE_BUCKET || 'images';