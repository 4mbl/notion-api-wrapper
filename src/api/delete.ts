import { NOTION_VERSION } from '../constants.js';
import {
  E,
  AuthenticationError,
  NotionError,
  NotionRateLimitError,
} from '../internal/errors.js';
import { isObjectId } from '../validation.js';

export async function trashPage(
  pageId: string,
  options?: {
    notionToken?: string;
    notionVersion?: string;
  },
) {
  if (!isObjectId(pageId))
    throw new Error(
      'Invalid page id. Should be 32 characters long with optional dashes.',
    );

  const apiKey = options?.notionToken ?? process.env.NOTION_API_KEY;
  if (!apiKey) throw new AuthenticationError(E.NO_API_KEY);

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

  return response.json();
}
