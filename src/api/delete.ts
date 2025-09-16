import { getApiKey } from '../auth.js';
import { NOTION_VERSION } from '../constants.js';
import { E, NotionError, NotionRateLimitError } from '../internal/errors.js';
import type {
  PageObjectResponse,
  PartialPageObjectResponse,
} from '../notion-types.js';
import { validateObjectId } from '../validation.js';

export async function trashPage(
  /** Notion page id. */
  id: string,
  options?: {
    notionToken?: string;
    notionVersion?: string;
  },
) {
  validateObjectId(id);

  const apiKey = getApiKey(options);

  const response = await fetch(`https://api.notion.com/v1/pages/${id}`, {
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
