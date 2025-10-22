export class DPDError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'DPDError';
    Object.setPrototypeOf(this, DPDError.prototype);
  }
}

export class DPDAuthError extends DPDError {
  constructor(message: string, code?: string, cause?: unknown) {
    super(message, code, cause);
    this.name = 'DPDAuthError';
    Object.setPrototypeOf(this, DPDAuthError.prototype);
  }
}

export class DPDValidationError extends DPDError {
  constructor(
    message: string,
    public readonly validationErrors: unknown,
    code?: string
  ) {
    super(message, code);
    this.name = 'DPDValidationError';
    Object.setPrototypeOf(this, DPDValidationError.prototype);
  }
}

export class DPDServiceError extends DPDError {
  constructor(message: string, code?: string, cause?: unknown) {
    super(message, code, cause);
    this.name = 'DPDServiceError';
    Object.setPrototypeOf(this, DPDServiceError.prototype);
  }
}

export class DPDNetworkError extends DPDError {
  constructor(message: string, cause?: unknown) {
    super(message, 'NETWORK_ERROR', cause);
    this.name = 'DPDNetworkError';
    Object.setPrototypeOf(this, DPDNetworkError.prototype);
  }
}
