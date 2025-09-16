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
import { removeProps, simplifyProps } from '../../util.js';

export async function retrieveDataSource(
  /** Notion data source id. */
  id: string,
  options?: QueryOptions,
) {
  const apiKey = getApiKey(options);

  const response = await fetch(`https://api.notion.com/v1/data_sources/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': options?.notionVersion ?? NOTION_VERSION,
    },
  });

  if (response.status === 401) {
    throw new NotionUnauthorizedError(E.UNAUTHORIZED);
  }

  if (response.status === 429) {
    throw new NotionRateLimitError(E.RATE_LIMIT);
  }

  if (!response.ok) {
    throw new NotionError(
      `Failed to get data source columns: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as Notion.GetDataSourceResponse;

  return removeProps(
    simplifyProps(data, options?.propOptions),
  ) as Notion.DataSourceObjectResponse;
}
