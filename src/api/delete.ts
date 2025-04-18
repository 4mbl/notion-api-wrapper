import { NOTION_VERSION } from '../constants';
import { NO_API_KEY_ERROR } from '../internal/errors';
import { isObjectId } from '../validation';

export async function trashPage(
  pageId: string,
  options?: {
    notionToken?: string;
    notionVersion?: string;
  },
) {
  if (!isObjectId(pageId)) throw new Error('Invalid page id');

  const apiKey = options?.notionToken ?? process.env.NOTION_API_KEY;
  if (!apiKey) throw new Error(NO_API_KEY_ERROR);

  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': options?.notionVersion ?? NOTION_VERSION,
    },
    body: JSON.stringify({ in_trash: true }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to trash page: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}
