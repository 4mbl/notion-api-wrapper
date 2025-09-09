import { getApiKey } from '../auth.js';
import { NOTION_VERSION } from '../constants.js';
import type { BuiltFilter } from '../filter-builder.js';
import {
  E,
  NotionError,
  NotionRateLimitError,
  ParameterValidationError,
} from '../internal/errors.js';
import type {
  DatabaseObjectResponse,
  GetDatabaseResponse,
  PageObjectResponse,
  PartialDatabaseObjectResponse,
  PartialPageObjectResponse,
  QueryDatabaseResponse,
} from '../notion-types.js';
import { processQueryData, removeProps, simplifyProps } from '../util.js';
import { isObjectId } from '../validation.js';

export const DEFAULT_BATCH_SIZE = 100;

export type PropOptions = {
  remove?: {
    /** Removes created by and last edited by user ids from the page(s). */
    userIds?: boolean;
    /** Removes created time and last edited time from the page(s). */
    pageTimestamps?: boolean;
    url?: boolean;
    publicUrl?: boolean;
    objectType?: boolean;
    id?: boolean;
    icon?: boolean;
    cover?: boolean;
    archived?: boolean;
    parent?: boolean;
    inTrash?: boolean;
    customProps?: string[];
  };
  /** Allows only explicitly listed props to be kept. */
  keep?: string[];
  /** Moves nested properties to the top level of the page(s). */
  simplifyProps?: boolean;
  /** Makes the icon into an URL string no matter if it's an emoji or file. */
  simpleIcon?: boolean;
};

export type SortOption = {
  property: string;
  direction: 'ascending' | 'descending';
};

export type QueryOptions = {
  filter?: BuiltFilter;
  propOptions?: PropOptions;
  sort?: SortOption | SortOption[];
  /** How many items to fetch at a time. Defaults to 100. */
  batchSize?: number;
  includeTrashed?: boolean;
  includeArchived?: boolean;

  notionToken?: string;
  notionVersion?: string;
};

export async function queryDatabase(
  /** Notion database id. */
  id: string,
  nextCursor?: string | null,
  options?: QueryOptions,
) {
  if (!isObjectId(id))
    throw new ParameterValidationError(E.INVALID_DATABASE_ID);

  const apiKey = getApiKey(options);

  const body = {
    start_cursor: nextCursor,
    filter: options?.filter,
    sorts:
      options?.sort &&
      (Array.isArray(options?.sort) ? options?.sort : [options?.sort]),
    page_size: options?.batchSize ?? DEFAULT_BATCH_SIZE,
    in_trash: options?.includeTrashed,
    archived: options?.includeArchived,
  };

  const response = await fetch(
    `https://api.notion.com/v1/databases/${id}/query`,
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

  if (response.status === 429) {
    throw new NotionRateLimitError(E.RATE_LIMIT);
  }

  if (!response.ok) {
    throw new NotionError(
      `Failed to query database: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as QueryDatabaseResponse;

  return {
    data: processQueryData(data, options?.propOptions),
    cursor: data.next_cursor,
  };
}

export async function queryDatabaseFull(
  /** Notion database id. */
  id: string,
  options?: QueryOptions,
) {
  if (!isObjectId(id))
    throw new ParameterValidationError(E.INVALID_DATABASE_ID);

  let nextCursor: string | undefined = undefined;
  const allResults: Array<
    | PageObjectResponse
    | PartialPageObjectResponse
    | PartialDatabaseObjectResponse
    | DatabaseObjectResponse
  > = [];

  do {
    const response = await queryDatabase(id, nextCursor, options);
    nextCursor = response.cursor ?? undefined;
    allResults.push(...response.data.results);
  } while (nextCursor);
  return allResults;
}

export async function getDatabaseColumns(id: string, options?: QueryOptions) {
  const apiKey = getApiKey(options);

  const response = await fetch(`https://api.notion.com/v1/databases/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': options?.notionVersion ?? NOTION_VERSION,
    },
  });

  if (response.status === 429) throw new NotionRateLimitError(E.RATE_LIMIT);

  if (!response.ok) {
    throw new NotionError(
      `Failed to get database columns: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as GetDatabaseResponse;

  return removeProps(
    simplifyProps(data, options?.propOptions),
  ) as DatabaseObjectResponse;
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
export async function searchFromDatabase(
  /** Notion database id. */
  id: string,
  search: SearchOptions,
  options?: QueryOptions,
) {
  if (!isObjectId(id))
    throw new ParameterValidationError(E.INVALID_DATABASE_ID);

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
    `https://api.notion.com/v1/databases/${id}/query`,
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

  if (response.status === 429) {
    throw new NotionRateLimitError(E.RATE_LIMIT);
  }

  if (!response.ok) {
    throw new NotionError(
      `Failed to search from database: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as QueryDatabaseResponse;

  return processQueryData(data, options?.propOptions);
}
