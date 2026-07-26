export type AppErrorCode =
  | 'CONFIG_READ_FAILED'
  | 'CONFIG_WRITE_FAILED'
  | 'CONFIG_INVALID'
  | 'THEME_NOT_FOUND'
  | 'THEME_RESERVED'
  | 'THEME_EXISTS'
  | 'THEME_INVALID'
  | 'THEME_READ_FAILED'
  | 'CONNECTION_NOT_FOUND'
  | 'CONNECTION_DUPLICATE'
  | 'IMPORT_FAILED'
  | 'EXPORT_FAILED'
  | 'SECRET_FAILED'
  | 'SSH_FAILED'
  | 'UNKNOWN';

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public override readonly cause?: unknown;

  public constructor(code: AppErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = cause;
  }
}

export const toAppError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError('UNKNOWN', error.message, error);
  }

  return new AppError('UNKNOWN', 'Unknown error', error);
};
