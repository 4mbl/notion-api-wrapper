import type {
  PartialPageObjectResponse,
  DatabaseObjectResponse,
  PageObjectResponse,
  PartialDatabaseObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import { processQueryData, removeProps, simplifyProps } from './util';
import { BuiltFilter } from './filter';

const NOTION_VERSION = '2022-06-28' as const;
export const DEFAULT_BATCH_SIZE = 100;

const NO_API_KEY_ERROR =
  'Notion API key not found. Please set the `NOTION_API_KEY` environment variable and make sure is is accessible by this process.' as const;

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
  notionToken?: string;
  includeTrashed?: boolean;
  includeArchived?: boolean;
};

export async function queryDatabase(
  /** Notion database id. */
  id: string,
  nextCursor?: string,
  options?: QueryOptions,
) {
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
      'Notion-Version': NOTION_VERSION,
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
      'Notion-Version': NOTION_VERSION,
    },
  }).then((res) => res.json());

  return removeProps(
    simplifyProps(data, options?.propOptions),
  ) as DatabaseObjectResponse;
}

export async function searchFromDatabase(
  /** Notion database id. */
  id: string,
  value: string,
  property = 'Name',
  options?: QueryOptions,
) {
  const apiKey = options?.notionToken ?? process.env.NOTION_API_KEY;
  if (!apiKey) throw new Error(NO_API_KEY_ERROR);

  const data = await fetch(`https://api.notion.com/v1/databases/${id}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': NOTION_VERSION,
    },
    body: JSON.stringify({
      filter: {
        property: property,
        rich_text: {
          equals: value,
        },
      },
    }),
  }).then((res) => res.json());

  return processQueryData(data, options?.propOptions);
}
