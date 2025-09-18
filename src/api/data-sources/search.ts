import { getApiKey } from '../../auth.js';
import { NOTION_VERSION } from '../../constants.js';
import {
  NotionError,
  type NotionErrorResponse,
} from '../../internal/errors.js';
import type { QueryOptions } from '../../naw-types.js';
import type * as Notion from '../../notion-types.js';
import { processQueryData } from '../../util.js';
import { validateApiVersion, validateObjectId } from '../../validation.js';

type SearchOptions = {
  /** The value to search for. */
  query: string;
  /** The property to search in. */
  property?: string;
  /** The match type to use. */
  match?: MatchType;
};

type MatchType =
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'notEquals'
  | 'notContains';

export async function searchFromDataSource(
  /** Notion data source id. */
  id: string,
  search: SearchOptions,
  options?: QueryOptions,
) {
  validateObjectId(id);
  validateApiVersion(options?.notionVersion);

  const apiKey = getApiKey(options);

  const convertMatchType = (matchType: MatchType) => {
    switch (matchType) {
      case 'equals':
        return 'equals';
      case 'contains':
        return 'contains';
      case 'startsWith':
        return 'starts_with';
      case 'endsWith':
        return 'ends_with';
      case 'notEquals':
        return 'does_not_equal';
      case 'notContains':
        return 'does_not_contain';
    }
  };

  const response = await fetch(
    `https://api.notion.com/v1/data_sources/${id}/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Notion-Version': options?.notionVersion ?? NOTION_VERSION,
      },
      body: JSON.stringify({
        filter: {
          property: search?.property ?? 'Name',
          rich_text: {
            [convertMatchType(search?.match ?? 'equals')]: search.query,
          },
        },
      }),
    },
  );

  if (!response.ok) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorJson: NotionErrorResponse = (await response.json()) as any;
    throw new NotionError(errorJson);
  }

  const data = (await response.json()) as Notion.QueryDataSourceResponse;

  return processQueryData(data, options?.propOptions);
}
