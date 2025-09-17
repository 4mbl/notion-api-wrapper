import { queryDataSource } from './api/data-sources/query.js';
import { retrieveDataSource } from './api/data-sources/retrieve.js';
import { NotionError } from './internal/errors.js';
import type { QueryOptions } from './naw-types.js';
import type { Notion } from './notion-types.js';
import { validateObjectId } from './validation.js';

const DEFAULT_YIELD_SIZE = 1;

export type DataSourceOptions = QueryOptions & {
  /** How many items to yield at a time. Defaults to `1`. */
  yieldSize?: number;
};

export class NotionDataSource<
  T extends Notion.PageObjectResponse = Notion.PageObjectResponse,
> {
  #dataSourceId: string;
  #queryOptions: QueryOptions;
  #primaryProperty: string | undefined;
  #columns: Notion.GetDataSourceResponse['properties'] | undefined;
  #yieldSize: number | undefined;

  constructor(dataSourceId: string, options?: DataSourceOptions) {
    validateObjectId(dataSourceId);

    this.#dataSourceId = dataSourceId;
    const { yieldSize, ...rest } = options ?? {};
    this.#queryOptions = rest ?? {};
    this.#yieldSize = yieldSize;
  }

  iterator(
    options?: Omit<DataSourceOptions, 'yieldSize'> & { yieldSize?: 1 },
  ): NotionDataSourceIterator<T, 1>;
  iterator<Y extends number>(
    options: DataSourceOptions & { yieldSize: Y },
  ): NotionDataSourceIterator<T, Y>;
  iterator(options?: DataSourceOptions): NotionDataSourceIterator<T, number> {
    const yieldSize =
      options?.yieldSize ?? this.#yieldSize ?? DEFAULT_YIELD_SIZE;
    return new NotionDataSourceIterator<T, typeof yieldSize>(this, {
      ...this.#queryOptions,
      ...options,
      yieldSize,
    });
  }

  async getColumns() {
    try {
      const data = await retrieveDataSource(this.#dataSourceId, {
        notionToken: this.#queryOptions.notionToken,
      });
      this.#columns = data.properties;
    } catch (e) {
      throw new NotionError(`Error fetching columns: ${(e as Error).message}`);
    }
  }

  async getPrimaryPropertyId() {
    if (this.#primaryProperty) return this.#primaryProperty;
    if (!this.#columns) await this.getColumns();
    if (!this.#columns) return undefined;

    const columnsArray = Object.keys(this.#columns).map((key) => ({
      ...this.#columns![key],
    })) as Notion.GetDataSourceResponse['properties'][string][];

    const primary = columnsArray.find((col) => col.type === 'title');
    this.#primaryProperty = primary?.id;
    return this.#primaryProperty;
  }

  get dataSourceId() {
    return this.#dataSourceId;
  }
}

class NotionDataSourceIterator<
  T extends Notion.PageObjectResponse,
  Y extends number,
> implements AsyncIterableIterator<Y extends 1 ? T : T[]>
{
  #moreToFetch = true;
  #cursor: string | undefined | null;
  #dataSource: NotionDataSource<T>;
  #queryOptions: QueryOptions;
  #yieldSize: Y;
  #cachedResults: T[] = [];

  constructor(
    dataSource: NotionDataSource<T>,
    options: DataSourceOptions & { yieldSize: Y },
  ) {
    this.#cursor = undefined;
    this.#dataSource = dataSource;
    const { yieldSize, ...rest } = options;
    this.#yieldSize = yieldSize;
    this.#queryOptions = rest;
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<Y extends 1 ? T : T[]> {
    return this;
  }

  async next(): Promise<IteratorResult<Y extends 1 ? T : T[]>> {
    if (this.#cachedResults.length < this.#yieldSize) {
      const nextBatch = await this.#fetchNext();
      if (nextBatch) this.#cachedResults.push(...nextBatch);
    }

    if (this.#cachedResults.length === 0 && !this.#moreToFetch) {
      return { done: true, value: undefined };
    }

    const batch = await this.#getNextBatch();
    const value = (this.#yieldSize === 1 ? batch.at(0) : batch) as Y extends 1
      ? T
      : T[];

    if (!value) {
      return { done: true, value: undefined };
    }

    return { done: false, value };
  }

  async #getNextBatch(): Promise<T[]> {
    const nextBatch: T[] = [];
    while (
      this.#cachedResults.length > 0 &&
      nextBatch.length < this.#yieldSize
    ) {
      nextBatch.push(this.#cachedResults.shift()!);
    }
    return nextBatch;
  }

  async #fetchNext(): Promise<T[] | undefined> {
    if (!this.#moreToFetch) {
      return undefined;
    }

    if (this.#cursor === null) {
      this.#moreToFetch = false;
      return undefined;
    }

    const queryOptions = { ...this.#queryOptions };
    if (!queryOptions.sort) {
      const primaryProperty = await this.#dataSource.getPrimaryPropertyId();
      if (primaryProperty) {
        queryOptions.sort = {
          direction: 'ascending',
          property: primaryProperty,
        };
      }
    }

    const response = await queryDataSource(this.#dataSource.dataSourceId, {
      ...queryOptions,
      cursor: this.#cursor,
    });
    this.#cursor = response.cursor;
    if (!response.hasMore) this.#moreToFetch = false;
    return response.results as T[];
  }
}
