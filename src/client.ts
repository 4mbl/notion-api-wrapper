import { queryDataSource } from './api/data-sources/query.js';
import { retrieveDataSource } from './api/data-sources/retrieve.js';
import { searchFromDataSource } from './api/data-sources/search.js';
import { createPage } from './api/pages/create.js';
import { retrievePage } from './api/pages/retrieve.js';
import { trashPage } from './api/pages/trash.js';
import { updatePage } from './api/pages/update.js';
import { NOTION_VERSION } from './constants.js';

type NotionClientOptions = {
  notionToken?: string;
  notionVersion?: string;
};

export class NotionClient {
  #notionToken?: string;
  #notionVersion: string;

  constructor(options?: NotionClientOptions) {
    this.#notionToken = options?.notionToken;
    this.#notionVersion = options?.notionVersion ?? NOTION_VERSION;
  }

  readonly dataSources = {
    retrieve: (id: Parameters<typeof retrieveDataSource>[0]) => {
      return retrieveDataSource(id, {
        notionToken: this.#notionToken,
        notionVersion: this.#notionVersion,
      });
    },

    query: (
      id: Parameters<typeof queryDataSource>[0],
      options?: Parameters<typeof queryDataSource>[1],
    ) => {
      return queryDataSource(id, {
        ...options,
        notionToken: this.#notionToken,
        notionVersion: this.#notionVersion,
      });
    },

    search: (
      id: Parameters<typeof searchFromDataSource>[0],
      search: Parameters<typeof searchFromDataSource>[1],
      options?: Parameters<typeof searchFromDataSource>[2],
    ) => {
      return searchFromDataSource(id, search, {
        ...options,
        notionToken: this.#notionToken,
        notionVersion: this.#notionVersion,
      });
    },
  };

  readonly pages = {
    create: (body: Parameters<typeof createPage>[0]) => {
      return createPage(body, {
        notionToken: this.#notionToken,
        notionVersion: this.#notionVersion,
      });
    },

    retrieve: (id: Parameters<typeof retrievePage>[0]) => {
      return retrievePage(id, {
        notionToken: this.#notionToken,
        notionVersion: this.#notionVersion,
      });
    },

    update: (
      id: Parameters<typeof updatePage>[0],
      body: Parameters<typeof updatePage>[1],
    ) => {
      return updatePage(id, body, {
        notionToken: this.#notionToken,
        notionVersion: this.#notionVersion,
      });
    },

    trash: (id: Parameters<typeof trashPage>[0]) => {
      return trashPage(id, {
        notionToken: this.#notionToken,
        notionVersion: this.#notionVersion,
      });
    },
  };
}
