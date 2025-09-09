import { getApiKey } from '../auth.js';
import { NOTION_VERSION } from '../constants.js';
import { E, NotionError, NotionRateLimitError } from '../internal/errors.js';
import type {
  CreatePageParameters,
  PageObjectResponse,
  PartialPageObjectResponse,
} from '../notion-types.js';

export async function createPage(
  body: CreatePageParameters,
  options?: {
    notionToken?: string;
    notionVersion?: string;
  },
) {
  const apiKey = getApiKey(options);

  const response = await fetch(`https://api.notion.com/v1/pages`, {
    method: 'POST',
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
      `Failed to create page: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<
    PageObjectResponse | PartialPageObjectResponse
  >;
}
