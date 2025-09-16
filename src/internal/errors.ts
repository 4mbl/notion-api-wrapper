import { NOTION_VERSION } from '../constants.js';

export const E = {
  NO_API_KEY:
    'Notion API key not found. Please set the `NOTION_TOKEN` environment variable and make sure is is accessible by this process.',
  INVALID_VALUE: 'Invalid value.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
  INVALID_OBJECT_ID:
    'Invalid id. Should be 32 character alphanumeric string with optional dashes.',
} as const;

export const W = {
  UNSUPPORTED_API_VERSION: `Warning: You are using an unsupported Notion API version. Using an unsupported version may result in data loss or unexpected behavior. Please remove the \`notionVersion\` option or set it to \`${NOTION_VERSION}\`.`,
};

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
