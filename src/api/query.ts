import type {
  PartialPageObjectResponse,
  DatabaseObjectResponse,
  PageObjectResponse,
  PartialDatabaseObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import { processQueryData, removeProps, simplifyProps } from '../util';
import { BuiltFilter } from '../filter-builder';
import { NO_API_KEY_ERROR } from '../internal/errors';
import { NOTION_VERSION } from '../constants';
import { isObjectId } from '../validation';

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
  nextCursor?: string,
  options?: QueryOptions,
) {
  if (!isObjectId(id)) throw new Error('Invalid database id');

  const apiKey = options?.notionToken ?? process.env.NOTION_API_KEY;
  if (!apiKey) throw new Error(NO_API_KEY_ERROR);

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

  const data = await fetch(`https://api.notion.com/v1/databases/${id}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': options?.notionVersion ?? NOTION_VERSION,
    },
    body: JSON.stringify(body),
  }).then((res) => res.json());

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
  if (!isObjectId(id)) throw new Error('Invalid database id');

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
  const apiKey = options?.notionToken ?? process.env.NOTION_API_KEY;
  if (!apiKey) throw new Error(NO_API_KEY_ERROR);

  const data = await fetch(`https://api.notion.com/v1/databases/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': options?.notionVersion ?? NOTION_VERSION,
    },
  }).then((res) => res.json());

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
  if (!isObjectId(id)) throw new Error('Invalid database id');

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

  const apiKey = options?.notionToken ?? process.env.NOTION_API_KEY;
  if (!apiKey) throw new Error(NO_API_KEY_ERROR);

  const data = await fetch(`https://api.notion.com/v1/databases/${id}/query`, {
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
  }).then((res) => res.json());

  return processQueryData(data, options?.propOptions);
}
