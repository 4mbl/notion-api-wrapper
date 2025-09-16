import { getApiKey } from '../../auth.js';
import { NOTION_VERSION } from '../../constants.js';
import {
  E,
  NotionError,
  NotionRateLimitError,
  NotionUnauthorizedError,
} from '../../internal/errors.js';
import type { QueryOptions } from '../../naw-types.js';
import type { Notion } from '../../notion-types.js';
import { processQueryData } from '../../util.js';
import { validateApiVersion, validateObjectId } from '../../validation.js';

export const DEFAULT_BATCH_SIZE = 100;

export async function queryDataSource(
  /** Notion data source id. */
  id: string,
  nextCursor?: string | null,
  options?: QueryOptions,
) {
  validateObjectId(id);
  validateApiVersion(options?.notionVersion);

  const apiKey = getApiKey(options);

  const body = {
    start_cursor: nextCursor,
    filter: options?.filter,
    sorts:
      options?.sort &&
      (Array.isArray(options?.sort) ? options?.sort : [options?.sort]),
    page_size: options?.batchSize ?? DEFAULT_BATCH_SIZE,
    // in_trash: options?.includeTrashed,
    // archived: options?.includeArchived,
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
      body: JSON.stringify(body),
    },
  );

  if (response.status === 401) {
    throw new NotionUnauthorizedError(E.UNAUTHORIZED);
  }

  if (response.status === 429) {
    throw new NotionRateLimitError(E.RATE_LIMIT);
  }

  if (!response.ok) {
    throw new NotionError(
      `Failed to query data source: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as Notion.QueryDataSourceResponse;

  return {
    data: processQueryData(data, options?.propOptions),
    cursor: data.next_cursor,
  };
}

export async function queryDataSourceFull(
  /** Notion data source id. */
  id: string,
  options?: QueryOptions,
) {
  validateObjectId(id);

  let nextCursor: string | undefined = undefined;
  const allResults: Array<
    | Notion.PageObjectResponse
    | Notion.PartialPageObjectResponse
    | Notion.PartialDataSourceObjectResponse
    | Notion.DataSourceObjectResponse
  > = [];

  do {
    const response = await queryDataSource(id, nextCursor, options);
    nextCursor = response.cursor ?? undefined;
    allResults.push(...response.data.results);
  } while (nextCursor);
  return allResults;
}

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

  const apiKey = getApiKey(options);

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

  if (response.status === 401) {
    throw new NotionUnauthorizedError(E.UNAUTHORIZED);
  }

  if (response.status === 429) {
    throw new NotionRateLimitError(E.RATE_LIMIT);
  }

  if (!response.ok) {
    throw new NotionError(
      `Failed to search from data source: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as Notion.QueryDataSourceResponse;

  return processQueryData(data, options?.propOptions);
}
