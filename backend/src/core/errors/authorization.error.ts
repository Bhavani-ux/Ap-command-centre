export class AuthorizationError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, code: string = 'AUTHZ_ERROR', statusCode: number = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InsufficientPermissionsError extends AuthorizationError {
  constructor(permission?: string) {
    const message = permission
      ? `Insufficient permissions: ${permission} required`
      : 'Insufficient permissions';
    super(message, 'INSUFFICIENT_PERMISSIONS', 403);
    this.name = 'InsufficientPermissionsError';
  }
}

export class InsufficientRoleError extends AuthorizationError {
  constructor(role?: string) {
    const message = role ? `Insufficient role: ${role} required` : 'Insufficient role';
    super(message, 'INSUFFICIENT_ROLE', 403);
    this.name = 'InsufficientRoleError';
  }
}
