import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import {
  PartialPageObjectResponse,
  type DatabaseObjectResponse,
  type PageObjectResponse,
  PartialDatabaseObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import { processQueryData, removeProps, simplifyProps } from './util';
import { BuiltFilter } from './filter';

dotenv.config();

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

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
    customProps?: string[];
  };
  /** Moves nested properties to the top level of the page(s). */
  simplifyProps?: boolean;
  /** Makes the icon into an URL string no matter if it's an emoji or file. */
  simpleIcon?: boolean;
};

export type QueryOptions = {
  filter?: BuiltFilter;
  propOptions?: PropOptions;
};

export async function queryDatabase(
  id: string,
  nextCursor?: string,
  options?: QueryOptions
) {
  let params = {
    database_id: id,
    start_cursor: nextCursor,
  };

  const data = await notion.databases.query({
    ...params,
    filter: options?.filter,
  });

  return {
    data: processQueryData(data, options?.propOptions),
    cursor: data.next_cursor,
  };
}

export async function queryDatabaseFull(id: string, options?: QueryOptions) {
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
  const data = await notion.databases.retrieve({
    database_id: id,
  });

  return removeProps(simplifyProps(data, options?.propOptions));
}

export async function searchFromDatabase(
  databaseId: string,
  value: string,
  property = 'Name',
  options?: QueryOptions
) {
  const data = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: property,
      rich_text: {
        equals: value,
      },
    },
  });
  return processQueryData(data, options?.propOptions);
}
