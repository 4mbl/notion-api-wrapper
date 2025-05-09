import { NOTION_VERSION } from '../constants.js';
import {
  E,
  AuthenticationError,
  NotionError,
  NotionRateLimitError,
  ParameterValidationError,
} from '../internal/errors.js';
import type {
  PageObjectResponse,
  PartialPageObjectResponse,
} from '../notion-types.js';
import { isObjectId } from '../validation.js';

export async function getPage(
  pageId: string,
  options?: {
    notionToken?: string;
    notionVersion?: string;
  },
) {
  if (!isObjectId(pageId))
    throw new ParameterValidationError(E.INVALID_PAGE_ID);

  const apiKey = options?.notionToken ?? process.env.NOTION_API_KEY;
  if (!apiKey) throw new AuthenticationError(E.NO_API_KEY);

  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': options?.notionVersion ?? NOTION_VERSION,
    },
  });

  if (response.status === 429) {
    throw new NotionRateLimitError(E.RATE_LIMIT);
  }

  if (!response.ok) {
    throw new NotionError(
      `Error fetching page: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<
    PageObjectResponse | PartialPageObjectResponse
  >;
}
