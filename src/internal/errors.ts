export const E = {
  NO_API_KEY:
    'Notion API key not found. Please set the `NOTION_API_KEY` environment variable and make sure is is accessible by this process.',
  INVALID_VALUE: 'Invalid value.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
  INVALID_DATABASE_ID:
    'Invalid database id. Should be 32 character alphanumeric string with optional dashes.',
  INVALID_PAGE_ID:
    'Invalid page id. Should be 32 character alphanumeric string with optional dashes.',
  INVALID_PARENT_ID:
    'Invalid parent id. Should be 32 character alphanumeric string with optional dashes.',
} as const;

export class ParameterValidationError extends Error {
  override name: string;
  override message: string;
  constructor(message: string) {
    super(message);
    this.name = 'ParameterValidationError';
    this.message = message;
  }
}

export class AuthenticationError extends Error {
  override name: string;
  override message: string;
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
    this.message = message;
  }
}

export class NotionError extends Error {
  override name: string;
  override message: string;
  constructor(message: string) {
    super(message);
    this.name = 'NotionError';
    this.message = message;
  }
}

export class NotionRateLimitError extends NotionError {
  override name: string;
  override message: string;
  constructor(message: string) {
    super(message);
    this.name = 'NotionRateLimitError';
    this.message = message;
  }
}
