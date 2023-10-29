import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import { type Filter } from './filter';
import {
  PartialPageObjectResponse,
  type DatabaseObjectResponse,
  type PageObjectResponse,
  PartialDatabaseObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import { removeProps as removeProps, simplifyProps } from './util';

dotenv.config();

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export type PropOptions = {
  removeUserIds?: boolean;
  removePageTimestamps?: boolean;
  removeUrl?: boolean;
  removePublicUrl?: boolean;
  removeObjectType?: boolean;
  removeId?: boolean;
  removeCover?: boolean;
  removeArchivedStatus?: boolean;
  removeParent?: boolean;
  removeCustomProps?: string[];
  simplifyProps?: boolean;
};

type QueryOptions = {
  filter?: Filter[];
  propRemoveOptions?: PropOptions;
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
  if (options) params = { ...params, ...options.filter };
  let data = await notion.databases.query(params);
  if (options?.propRemoveOptions) {
    data = removeProps(data, options.propRemoveOptions);
  }
  if (options?.propRemoveOptions?.simplifyProps) {
    data = simplifyProps(data);
  }
  return data;
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
    nextCursor = response.next_cursor ?? undefined;
    allResults.push(...response.results);
  } while (nextCursor !== undefined && nextCursor !== null);
  return allResults;
}

export async function getDatabaseColumns(id: string) {
  return notion.databases.retrieve({
    database_id: id,
  });
}

export async function searchFromDatabase(
  databaseId: string,
  value: string,
  property = 'Name'
) {
  return await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: property,
      rich_text: {
        equals: value,
      },
    },
  });
}

function emojiToHex(emoji: string) {
  const codePoints = Array.from(emoji).map((char) => char.codePointAt(0));
  const hexCode = codePoints
    .map((codePoint) => codePoint?.toString(16))
    .join('');

  return hexCode;
}

export function getIconUrl(page: PageObjectResponse | DatabaseObjectResponse) {
  let iconUrl: string | undefined = undefined;
  if (page.icon?.type === 'external') iconUrl = page.icon?.external.url;
  else if (page.icon?.type === 'file') iconUrl = page.icon?.file.url;
  else if (page.icon?.type === 'emoji') {
    iconUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${emojiToHex(
      page.icon.emoji
    )}.png`;
  }
  return {
    type: page.icon?.type,
    url: iconUrl,
  };
}

export function geDatabasetIdFromUrl(url: string): string | null {
  const regex = /\/([^/?]+)\?/;
  const match = url.match(regex);
  return match?.[1] ? match[1] : null;
}
