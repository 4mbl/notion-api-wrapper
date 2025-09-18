import { getApiKey } from '../../auth.js';
import { NOTION_VERSION } from '../../constants.js';
import {
  NotionError,
  type NotionErrorResponse
} from '../../internal/errors.js';
import type { QueryOptions } from '../../naw-types.js';
import type * as Notion from '../../notion-types.js';
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

  if (!response.ok) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorJson: NotionErrorResponse = (await response.json()) as any;
    throw new NotionError(errorJson);
  }

  const data = (await response.json()) as Notion.GetDataSourceResponse;

  return removeProps(
    simplifyProps(data, options?.propOptions),
  ) as Notion.DataSourceObjectResponse;
}
