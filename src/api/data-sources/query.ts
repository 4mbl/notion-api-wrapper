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
  options?: QueryOptions & { cursor?: string | null; limit?: number },
) {
  validateObjectId(id);
  validateApiVersion(options?.notionVersion);

  const apiKey = getApiKey(options);

  const limit = options?.limit ?? Infinity;

  const doQuery = async (cursor: string | null | undefined) => {
    const body = {
      start_cursor: cursor,
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
      hasMore: data.has_more,
    };
  };

  let nextCursor: string | undefined = options?.cursor ?? undefined;
  let hasMore = true;
  const allResults: Array<
    | Notion.PageObjectResponse
    | Notion.PartialPageObjectResponse
    | Notion.PartialDataSourceObjectResponse
    | Notion.DataSourceObjectResponse
  > = [];
  do {
    const response = await doQuery(nextCursor);
    nextCursor = response.cursor ?? undefined;
    hasMore = response.hasMore;
    allResults.push(...response.data.results);
  } while (hasMore && allResults.length < limit);

  return { results: allResults, hasMore: hasMore, cursor: nextCursor };
}
