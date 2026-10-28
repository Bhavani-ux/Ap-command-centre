export class AuthenticationError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, code: string = 'AUTH_ERROR', statusCode: number = 401) {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    this.name = 'InvalidCredentialsError';
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor() {
    super('Invalid or expired token', 'INVALID_TOKEN', 401);
    this.name = 'InvalidTokenError';
  }
}

export class AccountLockedError extends AuthenticationError {
  constructor() {
    super('Account is locked due to too many failed login attempts', 'ACCOUNT_LOCKED', 403);
    this.name = 'AccountLockedError';
  }
}

export class AccountInactiveError extends AuthenticationError {
  constructor() {
    super('Account is inactive', 'ACCOUNT_INACTIVE', 403);
    this.name = 'AccountInactiveError';
  }
}

export class SessionExpiredError extends AuthenticationError {
  constructor() {
    super('Session has expired', 'SESSION_EXPIRED', 401);
    this.name = 'SessionExpiredError';
  }
}
