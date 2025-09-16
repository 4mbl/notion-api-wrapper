import {
  getDataSourceColumns,
  queryDataSource,
  type QueryOptions,
} from './api/query.js';
import { NotionError } from './internal/errors.js';
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
  private _dataSourceId: string;
  private _queryOptions: QueryOptions;
  private _primaryProperty: string | undefined;
  private _columns: Notion.GetDataSourceResponse['properties'] | undefined;
  private _yieldSize: number | undefined;

  constructor(dataSourceId: string, options?: DataSourceOptions) {
    validateObjectId(dataSourceId);

    this._dataSourceId = dataSourceId;
    const { yieldSize, ...rest } = options ?? {};
    this._queryOptions = rest ?? {};
    this._yieldSize = yieldSize;
  }

  iterator(
    options?: Omit<DataSourceOptions, 'yieldSize'> & { yieldSize?: 1 },
  ): NotionDataSourceIterator<T, 1>;
  iterator<Y extends number>(
    options: DataSourceOptions & { yieldSize: Y },
  ): NotionDataSourceIterator<T, Y>;
  iterator(options?: DataSourceOptions): NotionDataSourceIterator<T, number> {
    const yieldSize =
      options?.yieldSize ?? this._yieldSize ?? DEFAULT_YIELD_SIZE;
    return new NotionDataSourceIterator<T, typeof yieldSize>(this, {
      ...this._queryOptions,
      ...options,
      yieldSize,
    });
  }

  async getColumns() {
    try {
      const data = await getDataSourceColumns(this._dataSourceId, {
        notionToken: this._queryOptions.notionToken,
      });
      this._columns = data.properties;
    } catch (e) {
      throw new NotionError(`Error fetching columns: ${(e as Error).message}`);
    }
  }

  async getPrimaryPropertyId() {
    if (this._primaryProperty) return this._primaryProperty;
    if (!this._columns) await this.getColumns();
    if (!this._columns) return undefined;

    const columnsArray = Object.keys(this._columns).map((key) => ({
      ...this._columns![key],
    })) as Notion.GetDataSourceResponse['properties'][string][];

    const primary = columnsArray.find((col) => col.type === 'title');
    this._primaryProperty = primary?.id;
    return this._primaryProperty;
  }

  get databaseId() {
    return this._dataSourceId;
  }
}

class NotionDataSourceIterator<
  T extends Notion.PageObjectResponse,
  Y extends number,
> implements AsyncIterableIterator<Y extends 1 ? T : T[]>
{
  private _moreToFetch = true;
  private _cursor: string | undefined | null;
  private _dataSource: NotionDataSource<T>;
  private _queryOptions: QueryOptions;
  private _yieldSize: Y;
  private _cachedResults: T[] = [];

  constructor(
    dataSource: NotionDataSource<T>,
    options: DataSourceOptions & { yieldSize: Y },
  ) {
    this._cursor = undefined;
    this._dataSource = dataSource;
    const { yieldSize, ...rest } = options;
    this._yieldSize = yieldSize;
    this._queryOptions = rest;
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<Y extends 1 ? T : T[]> {
    return this;
  }

  async next(): Promise<IteratorResult<Y extends 1 ? T : T[]>> {
    if (this._cachedResults.length < this._yieldSize) {
      const nextBatch = await this._fetchNext();
      if (nextBatch) this._cachedResults.push(...nextBatch);
    }

    if (this._cachedResults.length === 0 && !this._moreToFetch) {
      return { done: true, value: undefined };
    }

    const batch = await this._getNextBatch();
    const value = (this._yieldSize === 1 ? batch.at(0) : batch) as Y extends 1
      ? T
      : T[];

    if (!value) {
      return { done: true, value: undefined };
    }

    return { done: false, value };
  }

  private async _getNextBatch(): Promise<T[]> {
    const nextBatch: T[] = [];
    while (
      this._cachedResults.length > 0 &&
      nextBatch.length < this._yieldSize
    ) {
      nextBatch.push(this._cachedResults.shift()!);
    }
    return nextBatch;
  }

  private async _fetchNext(): Promise<T[] | undefined> {
    if (this._cursor === null) {
      this._moreToFetch = false;
      return undefined;
    }

    const queryOptions = { ...this._queryOptions };
    if (!queryOptions.sort) {
      const primaryProperty = await this._dataSource.getPrimaryPropertyId();
      if (primaryProperty) {
        queryOptions.sort = {
          direction: 'ascending',
          property: primaryProperty,
        };
      }
    }

    const response = await queryDataSource(
      this._dataSource.databaseId,
      this._cursor,
      queryOptions,
    );
    this._cursor = response.cursor;
    if (!response.data.has_more) this._moreToFetch = false;
    return response.data.results as T[];
  }
}
