import { getApiKey } from '../auth.js';
import { NOTION_VERSION } from '../constants.js';
import {
  E,
  NotionError,
  NotionRateLimitError,
  ParameterValidationError
} from '../internal/errors.js';
import type {
  PageObjectResponse,
  PartialPageObjectResponse,
} from '../notion-types.js';
import { isObjectId } from '../validation.js';

export async function trashPage(
  pageId: string,
  options?: {
    notionToken?: string;
    notionVersion?: string;
  },
) {
  if (!isObjectId(pageId))
    throw new ParameterValidationError(E.INVALID_PAGE_ID);

  const apiKey = getApiKey(options);

  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': options?.notionVersion ?? NOTION_VERSION,
    },
    body: JSON.stringify({ in_trash: true }),
  });

  if (response.status === 429) {
    throw new NotionRateLimitError(E.RATE_LIMIT);
  }

  if (!response.ok) {
    throw new NotionError(
      `Failed to trash page: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<
    PageObjectResponse | PartialPageObjectResponse
  >;
}
