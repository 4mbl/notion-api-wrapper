import { NOTION_VERSION } from '../constants.js';

export const E = {
  NO_API_TOKEN:
    'Notion API token not found. Please set the `NOTION_TOKEN` environment variable and make sure is is accessible by this process.',
  INVALID_VALUE: 'Invalid value.',
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

export type NotionErrorResponse = {
  object: 'error';
  status: number;
  code: string;
  message: string;
  request_id: string;
};

export class NotionError extends Error {
  override name = 'NotionError';
  status: number;
  code: string;
  requestId: string;
  raw: NotionErrorResponse;

  constructor(error: NotionErrorResponse) {
    const formatted = `[${error.status} ${error.code}] ${error.message} (request_id: ${error.request_id})`;
    super(formatted);
    this.message = formatted;
    this.status = error.status;
    this.code = error.code;
    this.requestId = error.request_id;
    this.raw = error;
  }

  toJSON() {
    return this.raw;
  }

  override toString() {
    return `[${this.status} ${this.code}] ${this.raw.message} (request_id: ${this.requestId})`;
  }
}
