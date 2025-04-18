import type {
  GetDatabaseResponse,
  PageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import {
  DEFAULT_BATCH_SIZE,
  getDatabaseColumns,
  queryDatabase,
  QueryOptions,
} from './api/query';
import { isObjectId } from './validation';

type IteratorOptions = QueryOptions & {
  /** How many items to yield at a time. Defaults to `batchSize` or `100` if not set. */
  yieldSize?: number;
};

export class DatabaseIterator<T extends PageObjectResponse>
  implements AsyncIterableIterator<T[]>
{
  private _moreToFetch: boolean = true;
  private _cursor: string | undefined | null;
  private _databaseId: string;
  private _queryOptions: QueryOptions;
  private _primaryProperty: string | undefined;
  private _columns: Promise<GetDatabaseResponse['properties']> | undefined;
  private _yieldSize: number;
  private _cachedResults: Array<T> = [];

  constructor(databaseId: string, options?: IteratorOptions) {
    if (!isObjectId(databaseId)) throw new Error('Invalid database id');

    this._cursor = undefined;
    this._databaseId = databaseId;
    const opts = options ?? {};
    this._yieldSize = opts.yieldSize ?? opts.batchSize ?? DEFAULT_BATCH_SIZE;
    delete opts.yieldSize;
    this._queryOptions = opts;
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<T[]> {
    return this;
  }

  async next(): Promise<IteratorResult<T[]>> {
    if (this._cachedResults.length < this._yieldSize) {
      const nextBatch = await this._fetchNext();
      if (nextBatch) {
        this._cachedResults.push(...nextBatch);
      }
    }

    if (this._cachedResults.length == 0 && !this._moreToFetch) {
      return { done: true, value: undefined };
    }

    return {
      done: false,
      value: await this._getNextBatch(),
    };
  }

  private async _getNextBatch(): Promise<T[]> {
    const nextBatch = [];
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

    const queryOptions = this._queryOptions;
    if (!queryOptions.sort) {
      const primaryProperty = await this.getPrimaryPropertyId();
      if (primaryProperty) {
        queryOptions.sort = {
          direction: 'ascending',
          property: primaryProperty,
        };
      }
    }

    const response = await queryDatabase(
      this._databaseId,
      this._cursor,
      queryOptions,
    );
    this._cursor = response.cursor;
    if (!response.data.has_more) this._moreToFetch = false;
    return response.data.results as T[];
  }

  async getColumns() {
    this._columns = getDatabaseColumns(this._databaseId, {
      notionToken: this._queryOptions.notionToken,
    }).then((data) => data.properties);
  }

  async getPrimaryPropertyId() {
    if (this._primaryProperty) return this._primaryProperty;
    if (!this._columns) await this.getColumns();
    if (!this._columns) return undefined;
    const columnsObj = await this._columns;
    const columnsArray = Object.keys(columnsObj).map((key) => ({
      ...columnsObj[key],
    }));
    const primary = columnsArray.find(
      (col: { type: string }) => col.type === 'title',
    );
    this._primaryProperty = primary?.id;
    return this._primaryProperty;
  }
}
