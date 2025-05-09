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
  UpdatePageParameters,
} from '../notion-types.js';
import { isObjectId } from '../validation.js';

export async function updatePage(
  pageId: string,
  body: Omit<UpdatePageParameters, 'page_id'>,
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
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': options?.notionVersion ?? NOTION_VERSION,
    },
    body: JSON.stringify(body),
  });

  if (response.status === 429) {
    throw new NotionRateLimitError(E.RATE_LIMIT);
  }

  if (!response.ok) {
    throw new NotionError(
      `Error updating page: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<
    PageObjectResponse | PartialPageObjectResponse
  >;
}
