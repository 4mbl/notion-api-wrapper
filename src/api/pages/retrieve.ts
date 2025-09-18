import { getApiKey } from '../../auth.js';
import { NOTION_VERSION } from '../../constants.js';
import {
  NotionError,
  type NotionErrorResponse,
} from '../../internal/errors.js';
import type * as Notion from '../../notion-types.js';
import { validateApiVersion, validateObjectId } from '../../validation.js';

export async function retrievePage(
  /** Notion page id. */
  id: string,
  options?: {
    notionToken?: string;
    notionVersion?: string;
  },
) {
  validateObjectId(id);
  validateApiVersion(options?.notionVersion);

  const apiKey = getApiKey(options);

  const response = await fetch(`https://api.notion.com/v1/pages/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': options?.notionVersion ?? NOTION_VERSION,
    },
  });

  if (!response.ok) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorJson: NotionErrorResponse = (await response.json()) as any;
    throw new NotionError(errorJson);
  }

  return response.json() as Promise<
    Notion.PageObjectResponse | Notion.PartialPageObjectResponse
  >;
}
