import {
  getDatabaseColumns,
  queryDatabase,
  type QueryOptions,
} from './api/query.js';
import { E, NotionError, ParameterValidationError } from './internal/errors.js';
import type {
  GetDatabaseResponse,
  PageObjectResponse,
} from './notion-types.js';
import { isObjectId } from './validation.js';

const DEFAULT_YIELD_SIZE = 1;

export type DatabaseOptions = QueryOptions & {
  /** How many items to yield at a time. Defaults to `1`. */
  yieldSize?: number;
};

export class NotionDatabase<T extends PageObjectResponse = PageObjectResponse> {
  private _databaseId: string;
  private _queryOptions: QueryOptions;
  private _primaryProperty: string | undefined;
  private _columns: GetDatabaseResponse['properties'] | undefined;

  constructor(databaseId: string, options?: DatabaseOptions) {
    if (!isObjectId(databaseId))
      throw new ParameterValidationError(E.INVALID_DATABASE_ID);

    this._databaseId = databaseId;
    this._queryOptions = options ?? {};
  }

  iterator(
    options: DatabaseOptions & { yieldSize: 1 },
  ): NotionDatabaseIterator<T>;
  iterator(options?: DatabaseOptions): NotionDatabaseIterator<T>;
  iterator(options?: DatabaseOptions): NotionDatabaseIterator<T> {
    return new NotionDatabaseIterator<T>(this, options ?? this._queryOptions);
  }

  async getColumns() {
    try {
      const data = await getDatabaseColumns(this._databaseId, {
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
    })) as GetDatabaseResponse['properties'][string][];

    const primary = columnsArray.find((col) => col.type === 'title');
    this._primaryProperty = primary?.id;
    return this._primaryProperty;
  }

  get databaseId() {
    return this._databaseId;
  }
}

class NotionDatabaseIterator<T extends PageObjectResponse>
  implements AsyncIterableIterator<T | T[]>
{
  private _moreToFetch: boolean = true;
  private _cursor: string | undefined | null;
  private _database: NotionDatabase<T>;
  private _queryOptions: QueryOptions;
  private _yieldSize: number;
  private _cachedResults: Array<T> = [];

  constructor(database: NotionDatabase<T>, options?: DatabaseOptions) {
    this._cursor = undefined;
    this._database = database;

    const opts = { ...options };
    this._yieldSize = opts?.yieldSize ?? DEFAULT_YIELD_SIZE;

    delete opts.yieldSize;
    this._queryOptions = opts;
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<T | T[]> {
    return this;
  }

  async next(): Promise<IteratorResult<T | T[]>> {
    if (this._cachedResults.length < this._yieldSize) {
      const nextBatch = await this._fetchNext();
      if (nextBatch) this._cachedResults.push(...nextBatch);
    }

    if (this._cachedResults.length === 0 && !this._moreToFetch)
      return { done: true, value: undefined };

    const batch = await this._getNextBatch();

    const value = this._yieldSize === 1 ? batch.at(0) : batch;
    if (!value) return { done: true, value: undefined };

    return { done: false, value: value };
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

    const queryOptions = this._queryOptions;
    if (!queryOptions.sort) {
      const primaryProperty = await this._database.getPrimaryPropertyId();
      if (primaryProperty) {
        queryOptions.sort = {
          direction: 'ascending',
          property: primaryProperty,
        };
      }
    }

    const response = await queryDatabase(
      this._database.databaseId,
      this._cursor,
      queryOptions,
    );
    this._cursor = response.cursor;
    if (!response.data.has_more) this._moreToFetch = false;
    return response.data.results as T[];
  }
}
