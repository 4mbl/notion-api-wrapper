import { getApiKey } from '../auth.js';
import { NOTION_VERSION } from '../constants.js';
import {
  E,
  NotionError,
  NotionRateLimitError,
  NotionUnauthorizedError,
} from '../internal/errors.js';
import type { Notion } from '../notion-types.js';
import { validateApiVersion, validateObjectId } from '../validation.js';

export async function updatePage(
  /** Notion page id. */
  id: string,
  body: Omit<Notion.UpdatePageParameters, 'page_id'>,
  options?: {
    notionToken?: string;
    notionVersion?: string;
  },
) {
  validateObjectId(id);
  validateApiVersion(options?.notionVersion);

  const apiKey = getApiKey(options);

  const response = await fetch(`https://api.notion.com/v1/pages/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': options?.notionVersion ?? NOTION_VERSION,
    },
    body: JSON.stringify(body),
  });

  if (response.status === 401) {
    throw new NotionUnauthorizedError(E.UNAUTHORIZED);
  }

  if (response.status === 429) {
    throw new NotionRateLimitError(E.RATE_LIMIT);
  }

  if (!response.ok) {
    try {
      const errorData = (await response.json()) as any;
      throw new NotionError(
        `Error updating page: ${response.status} ${response.statusText} ${errorData.object === 'error' ? errorData.message : ''}`,
      );
    } catch (e) {
      throw new NotionError(
        `Error updating page: ${response.status} ${response.statusText}`,
      );
    }
  }

  return response.json() as Promise<
    Notion.PageObjectResponse | Notion.PartialPageObjectResponse
  >;
}
